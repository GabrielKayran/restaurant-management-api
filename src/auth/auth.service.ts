import { Prisma, User, UserRole } from '@prisma/client';
import {
  ConflictException,
  Injectable,
  BadRequestException,
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
  private static readonly INVALID_CREDENTIALS_MESSAGE =
    'Credenciais invalidas.';

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
  ) {}

  async createUser(payload: SignupInput): Promise<Token> {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const normalizedName = this.normalizeRequiredField(payload.name, 'nome');
    const normalizedTenantName = this.normalizeRequiredField(
      payload.tenantName,
      'tenant',
    );
    const normalizedUnitName = this.normalizeRequiredField(
      payload.unitName,
      'unidade',
    );
    const normalizedPhone = this.normalizeOptionalField(payload.phone);
    const hashedPassword = await this.passwordService.hashPassword(
      payload.password,
    );
    const tenantSlug = this.slugify(normalizedTenantName);
    const unitSlug = this.slugify(
      `${normalizedTenantName}-${normalizedUnitName}`,
    );

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: normalizedName,
            email: normalizedEmail,
            passwordHash: hashedPassword,
          },
        });

        const tenant = await tx.tenant.create({
          data: {
            name: normalizedTenantName,
            slug: tenantSlug,
            phone: normalizedPhone,
          },
        });

        const unit = await tx.restaurantUnit.create({
          data: {
            tenantId: tenant.id,
            name: normalizedUnitName,
            slug: unitSlug,
            phone: normalizedPhone,
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
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        tenantRoles: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(AuthService.INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordValid = await this.passwordService.validatePassword(
      password,
      user.passwordHash,
    );

    if (!passwordValid || !user.isActive) {
      throw new UnauthorizedException(AuthService.INVALID_CREDENTIALS_MESSAGE);
    }

    return this.generateTokens({
      userId: user.id,
      tenantId: this.resolveTenantId(user.tenantRoles),
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
    let payload: { sub?: string; userId?: string; tenantId?: string };

    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException();
    }

    const userId = payload.sub ?? payload.userId;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.generateTokens({ userId, tenantId: payload.tenantId });
  }

  private generateAccessToken(payload: {
    userId: string;
    tenantId?: string;
  }): string {
    return this.jwtService.sign(this.buildJwtPayload(payload));
  }

  private generateRefreshToken(payload: {
    userId: string;
    tenantId?: string;
  }): string {
    const securityConfig = this.configService.get<SecurityConfig>('security');

    return this.jwtService.sign(this.buildJwtPayload(payload), {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: securityConfig.refreshIn,
    });
  }

  private buildJwtPayload(payload: { userId: string; tenantId?: string }): {
    sub: string;
    tenantId?: string;
  } {
    return {
      sub: payload.userId,
      tenantId: payload.tenantId,
    };
  }

  private resolveTenantId(
    tenantRoles: Array<{
      tenantId: string;
    }>,
  ): string | undefined {
    const tenantIds = [
      ...new Set(tenantRoles.map((tenantRole) => tenantRole.tenantId)),
    ].sort();

    if (tenantIds.length === 1) {
      return tenantIds[0];
    }

    return undefined;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeRequiredField(value: string, fieldName: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException(`O campo ${fieldName} e obrigatorio.`);
    }

    return normalizedValue;
  }

  private normalizeOptionalField(value?: string): string | undefined {
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : undefined;
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
