import { Prisma, User, UserRole } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'nestjs-prisma';
import { PasswordService } from './password.service';
import { SignupInput } from './dto/signup.input';
import { Token } from './models/token.model';
import { SecurityConfig } from '../common/configs/config.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
  ) {}

  async createUser(payload: SignupInput): Promise<Token> {
    const hashedPassword = await this.passwordService.hashPassword(
      payload.password,
    );
    const tenantSlug = this.slugify(payload.tenantName);
    const unitSlug = this.slugify(`${payload.tenantName}-${payload.unitName}`);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: payload.name,
            email: payload.email.toLowerCase(),
            passwordHash: hashedPassword,
          },
        });

        const tenant = await tx.tenant.create({
          data: {
            name: payload.tenantName,
            slug: tenantSlug,
            phone: payload.phone,
          },
        });

        const unit = await tx.restaurantUnit.create({
          data: {
            tenantId: tenant.id,
            name: payload.unitName,
            slug: unitSlug,
            phone: payload.phone,
          },
        });

        await tx.userTenantRole.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            role: UserRole.OWNER,
          },
        });

        await tx.userUnitRole.create({
          data: {
            userId: user.id,
            unitId: unit.id,
            role: UserRole.OWNER,
          },
        });

        return { user, tenant };
      });

      return this.generateTokens({
        userId: result.user.id,
        tenantId: result.tenant.id,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email ou identificador do tenant/unidade ja esta em uso.',
        );
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<Token> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { tenantRoles: true },
    });

    if (!user) {
      throw new NotFoundException('As credenciais informadas sao invalidas.');
    }

    const passwordValid = await this.passwordService.validatePassword(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new BadRequestException('As credenciais informadas sao invalidas.');
    }

    return this.generateTokens({
      userId: user.id,
      tenantId: user.tenantRoles[0]?.tenantId,
    });
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantRoles: {
          select: {
            tenantId: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  generateTokens(payload: { userId: string; tenantId?: string }): Token {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  refreshToken(token: string): Token {
    try {
      const { userId, tenantId } = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      return this.generateTokens({ userId, tenantId });
    } catch {
      throw new UnauthorizedException();
    }
  }

  private generateAccessToken(payload: {
    userId: string;
    tenantId?: string;
  }): string {
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(payload: {
    userId: string;
    tenantId?: string;
  }): string {
    const securityConfig = this.configService.get<SecurityConfig>('security');

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: securityConfig.refreshIn,
    });
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
