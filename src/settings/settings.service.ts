import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { Messages } from '../common/i18n/messages';
import { RequestScope } from '../common/models/request-scope.model';
import { AuditLoggerService } from '../common/services/audit-logger.service';
import { NormalizationService } from '../common/services/normalization.service';
import { RestaurantSettingsResponseDto } from './dto/restaurant-settings.response';
import { UnitSettingsResponseDto } from './dto/unit-settings.response';
import { UpdateRestaurantSettingsInput } from './dto/update-restaurant-settings.input';
import { UpdateUnitSettingsInput } from './dto/update-unit-settings.input';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizationService: NormalizationService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async getRestaurant(
    user: AuthenticatedUser,
  ): Promise<RestaurantSettingsResponseDto> {
    const tenantId = this.getTenantIdOrThrow(user);
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        document: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            units: true,
          },
        },
        units: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(Messages.TENANT_NOT_FOUND);
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      document: tenant.document ?? null,
      phone: tenant.phone ?? null,
      isActive: tenant.isActive,
      unitsCount: tenant._count.units,
      activeUnitsCount: tenant.units.length,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  async updateRestaurant(
    user: AuthenticatedUser,
    input: UpdateRestaurantSettingsInput,
  ): Promise<RestaurantSettingsResponseDto> {
    const tenantId = this.getTenantIdOrThrow(user);

    await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        ...(input.name !== undefined
          ? {
              name: this.normalizationService.normalizeRequiredField(
                input.name,
                'nome',
              ),
            }
          : {}),
        ...(input.document !== undefined
          ? {
              document: this.normalizationService.normalizeNullableField(
                input.document,
              ),
            }
          : {}),
        ...(input.phone !== undefined
          ? {
              phone: this.normalizationService.normalizeNullableField(
                input.phone,
              ),
            }
          : {}),
      },
    });

    this.auditLogger.log({
      action: 'settings.restaurant.updated',
      actorUserId: user.id,
      tenantId,
      targetType: 'tenant',
      targetId: tenantId,
      details: {
        fields: Object.keys(input),
        document: input.document ?? null,
        phone: input.phone ?? null,
      },
    });

    return this.getRestaurant(user);
  }

  async getUnit(scope: RequestScope): Promise<UnitSettingsResponseDto> {
    const unit = await this.prisma.restaurantUnit.findFirst({
      where: {
        id: scope.unitId,
        tenantId: scope.tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!unit) {
      throw new NotFoundException(Messages.UNIT_NOT_IN_TENANT);
    }

    return {
      id: unit.id,
      tenantId: unit.tenantId,
      name: unit.name,
      slug: unit.slug,
      phone: unit.phone ?? null,
      isActive: unit.isActive,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }

  async updateUnit(
    scope: RequestScope,
    input: UpdateUnitSettingsInput,
  ): Promise<UnitSettingsResponseDto> {
    const updated = await this.prisma.restaurantUnit.updateMany({
      where: {
        id: scope.unitId,
        tenantId: scope.tenantId,
      },
      data: {
        ...(input.name !== undefined
          ? {
              name: this.normalizationService.normalizeRequiredField(
                input.name,
                'nome',
              ),
            }
          : {}),
        ...(input.phone !== undefined
          ? {
              phone: this.normalizationService.normalizeNullableField(
                input.phone,
              ),
            }
          : {}),
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException(Messages.UNIT_NOT_IN_TENANT);
    }

    this.auditLogger.log({
      action: 'settings.unit.updated',
      actorUserId: scope.userId,
      tenantId: scope.tenantId,
      unitId: scope.unitId,
      targetType: 'restaurant_unit',
      targetId: scope.unitId,
      details: {
        fields: Object.keys(input),
        phone: input.phone ?? null,
      },
    });

    return this.getUnit(scope);
  }

  private getTenantIdOrThrow(user: AuthenticatedUser): string {
    const tenantId = user.auth?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(Messages.TENANT_CONTEXT_MISSING);
    }

    return tenantId;
  }
}
