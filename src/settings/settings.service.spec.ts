import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { RequestScope } from '../common/models/request-scope.model';
import { AuditLoggerService } from '../common/services/audit-logger.service';
import { NormalizationService } from '../common/services/normalization.service';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: {
    tenant: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    restaurantUnit: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let normalizationService: {
    normalizeRequiredField: jest.Mock;
    normalizeNullableField: jest.Mock;
  };
  let auditLogger: { log: jest.Mock };

  const user = {
    id: 'user-1',
    auth: { tenantId: 'tenant-1' },
  } as AuthenticatedUser;

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      restaurantUnit: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    normalizationService = {
      normalizeRequiredField: jest.fn((value: string) => value.trim()),
      normalizeNullableField: jest.fn((value?: string | null) =>
        value?.trim() ? value.trim() : null,
      ),
    };

    auditLogger = {
      log: jest.fn(),
    };

    service = new SettingsService(
      prisma as unknown as PrismaService,
      normalizationService as unknown as NormalizationService,
      auditLogger as unknown as AuditLoggerService,
    );
  });

  it('throws when tenant context is missing', async () => {
    await expect(
      service.getRestaurant({
        ...user,
        auth: { tenantId: undefined },
      } as AuthenticatedUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns restaurant settings for the authenticated tenant', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Hamburgueria Central',
      slug: 'hamburgueria-central',
      document: null,
      phone: '34999990000',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { units: 1 },
      units: [{ id: 'unit-1' }],
    });

    const result = await service.getRestaurant(user);

    expect(result.id).toBe('tenant-1');
    expect(result.unitsCount).toBe(1);
    expect(result.activeUnitsCount).toBe(1);
  });

  it('updates restaurant settings and emits an audit log', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      name: 'Hamburgueria Central',
      slug: 'hamburgueria-central',
      document: null,
      phone: '34999990000',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { units: 1 },
      units: [{ id: 'unit-1' }],
    });

    await service.updateRestaurant(user, {
      name: 'Hamburgueria Atualizada',
      phone: '34988887777',
    });

    expect(prisma.tenant.update).toHaveBeenCalled();
    expect(auditLogger.log).toHaveBeenCalledTimes(1);
  });

  it('throws when the unit cannot be resolved inside the tenant scope', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue(null);

    await expect(service.getUnit(scope)).rejects.toThrow(NotFoundException);
  });

  it('updates the current unit settings', async () => {
    prisma.restaurantUnit.updateMany.mockResolvedValue({ count: 1 });
    prisma.restaurantUnit.findFirst.mockResolvedValue({
      id: 'unit-1',
      tenantId: 'tenant-1',
      name: 'Unidade Centro',
      slug: 'hamburgueria-central-centro',
      phone: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.updateUnit(scope, {
      name: 'Unidade Atualizada',
    });

    expect(prisma.restaurantUnit.updateMany).toHaveBeenCalled();
    expect(result.id).toBe('unit-1');
    expect(auditLogger.log).toHaveBeenCalledTimes(1);
  });
});
