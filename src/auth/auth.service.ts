import { Prisma, User, UserRole } from '@prisma/client';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'nestjs-prisma';
import { PasswordService } from './password.service';
import { SignupInput } from './dto/signup.input';
import { Token } from './models/token.model';
import { SecurityConfig } from '../common/configs/config.interface';
import { NormalizationService } from '../common/services/normalization.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    private readonly normalizationService: NormalizationService,
  ) {}

  async createUser(payload: SignupInput): Promise<Token> {
    const normalizedEmail = this.normalizationService.normalizeEmail(
      payload.email,
    );
    const normalizedName = this.normalizationService.normalizeRequiredField(
      payload.name,
      'nome',
    );
    const normalizedTenantName =
      this.normalizationService.normalizeRequiredField(
        payload.tenantName,
        'tenant',
      );
    const normalizedUnitName = this.normalizationService.normalizeRequiredField(
      payload.unitName,
      'unidade',
    );
    const normalizedPhone = this.normalizationService.normalizeOptionalField(
      payload.phone,
    );
    const hashedPassword = await this.passwordService.hashPassword(
      payload.password,
    );
    const tenantSlug = this.normalizationService.slugify(normalizedTenantName);
    const unitSlug = this.normalizationService.slugify(
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
        const target = (error.meta?.target as string[]) ?? [];

        if (target.includes('email')) {
          throw new ConflictException('errors.auth.emailAlreadyInUse');
        }

        if (target.includes('slug')) {
          throw new ConflictException(
            'errors.auth.tenantOrUnitNameAlreadyExists',
          );
        }

        throw new ConflictException('errors.auth.identityAlreadyInUse');
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<Token> {
    const normalizedEmail = this.normalizationService.normalizeEmail(email);
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
      throw new UnauthorizedException('errors.auth.invalidCredentials');
    }

    const passwordValid = await this.passwordService.validatePassword(
      password,
      user.passwordHash,
    );

    if (!passwordValid || !user.isActive) {
      throw new UnauthorizedException('errors.auth.invalidCredentials');
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
      throw new UnauthorizedException('errors.auth.invalidCredentials');
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
      throw new UnauthorizedException('errors.auth.invalidCredentials');
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
      throw new UnauthorizedException('errors.auth.invalidCredentials');
    }

    const userId = payload.sub ?? payload.userId;

    if (!userId) {
      throw new UnauthorizedException('errors.auth.invalidCredentials');
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
}
