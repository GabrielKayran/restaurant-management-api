import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'nestjs-prisma';
import { NormalizationService } from '../common/services/normalization.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
    };
  };
  let passwordService: {
    hashPassword: jest.Mock;
    validatePassword: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let normalizationService: {
    normalizeEmail: jest.Mock;
    normalizeRequiredField: jest.Mock;
    normalizeOptionalField: jest.Mock;
    slugify: jest.Mock;
  };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn(
        (payload: { sub: string; tenantId?: string }, options?: object) =>
          options ? 'refresh-token' : 'access-token',
      ),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    passwordService = {
      hashPassword: jest.fn(),
      validatePassword: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'security') {
          return { refreshIn: '7d' };
        }

        if (key === 'JWT_REFRESH_SECRET') {
          return 'refresh-secret';
        }

        return undefined;
      }),
    };

    normalizationService = {
      normalizeEmail: jest.fn((email: string) => email.trim().toLowerCase()),
      normalizeRequiredField: jest.fn((value: string) => value.trim()),
      normalizeOptionalField: jest.fn((value?: string) => value?.trim()),
      slugify: jest.fn((value: string) => value.trim().toLowerCase()),
    };

    service = new AuthService(
      jwtService,
      prismaService as unknown as PrismaService,
      passwordService as unknown as PasswordService,
      configService as unknown as ConfigService,
      normalizationService as unknown as NormalizationService,
    );
  });

  it('normalizes email on login and issues tokens with a single tenant', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed-password',
      isActive: true,
      tenantRoles: [{ tenantId: 'tenant-1' }, { tenantId: 'tenant-1' }],
    });
    passwordService.validatePassword.mockResolvedValue(true);

    const result = await service.login('  OWNER@RESTAURANTE.COM  ', '123456');

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'owner@restaurante.com' },
      include: {
        tenantRoles: {
          select: {
            tenantId: true,
          },
        },
      },
    });
    expect(normalizationService.normalizeEmail).toHaveBeenCalledWith(
      '  OWNER@RESTAURANTE.COM  ',
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtService.sign).toHaveBeenNthCalledWith(1, {
      sub: 'user-1',
      tenantId: 'tenant-1',
    });
  });

  it('returns a generic error when the user is inactive', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed-password',
      isActive: false,
      tenantRoles: [{ tenantId: 'tenant-1' }],
    });
    passwordService.validatePassword.mockResolvedValue(true);

    await expect(
      service.login('user@restaurante.com', '123456'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('does not lock tenant in token when user has multiple tenants', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-2',
      passwordHash: 'hashed-password',
      isActive: true,
      tenantRoles: [{ tenantId: 'tenant-2' }, { tenantId: 'tenant-1' }],
    });
    passwordService.validatePassword.mockResolvedValue(true);

    await service.login('multi@restaurante.com', '123456');

    expect(jwtService.sign).toHaveBeenNthCalledWith(1, {
      sub: 'user-2',
      tenantId: undefined,
    });
  });

  it('accepts refresh token payload using sub claim', () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
    } as never);

    const result = service.refreshToken('valid-refresh-token');

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('accepts legacy refresh token payload using userId', () => {
    jwtService.verify.mockReturnValue({
      userId: 'legacy-user',
      tenantId: 'tenant-legacy',
    } as never);

    const result = service.refreshToken('legacy-refresh-token');

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtService.sign).toHaveBeenNthCalledWith(1, {
      sub: 'legacy-user',
      tenantId: 'tenant-legacy',
    });
  });

  it('returns user profile with tenant and unit roles for unit-scoped requests', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Owner',
      email: 'owner@restaurante.com',
      isActive: true,
      createdAt: new Date('2026-03-14T13:00:00.000Z'),
      updatedAt: new Date('2026-03-14T13:00:00.000Z'),
      tenantRoles: [{ tenantId: 'tenant-1', role: 'OWNER' }],
      unitRoles: [
        {
          role: 'OWNER',
          unit: {
            id: 'unit-1',
            name: 'Unidade Centro',
            tenantId: 'tenant-1',
          },
        },
      ],
    });

    const result = await service.getMe('user-1');

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tenantRoles: {
          select: {
            tenantId: true,
            role: true,
          },
        },
        unitRoles: {
          select: {
            role: true,
            unit: {
              select: {
                id: true,
                name: true,
                tenantId: true,
              },
            },
          },
        },
      },
    });
    expect(result).toEqual({
      id: 'user-1',
      name: 'Owner',
      email: 'owner@restaurante.com',
      isActive: true,
      tenantRoles: [{ tenantId: 'tenant-1', role: 'OWNER' }],
      unitRoles: [
        {
          id: 'unit-1',
          name: 'Unidade Centro',
          tenantId: 'tenant-1',
          role: 'OWNER',
        },
      ],
      createdAt: new Date('2026-03-14T13:00:00.000Z'),
      updatedAt: new Date('2026-03-14T13:00:00.000Z'),
    });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
