import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { Messages } from '../common/i18n/messages';
import { RequestScope } from '../common/models/request-scope.model';
import { AuditLoggerService } from '../common/services/audit-logger.service';
import { MemoryCacheService } from '../common/services/memory-cache.service';
import { NormalizationService } from '../common/services/normalization.service';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { RestaurantSettingsResponseDto } from './dto/restaurant-settings.response';
import { UnitOrderingSettingsResponseDto } from './dto/unit-ordering.response';
import { UnitSettingsResponseDto } from './dto/unit-settings.response';
import { UpdateRestaurantSettingsInput } from './dto/update-restaurant-settings.input';
import {
  UpdateDeliveryZoneInput,
  UpdateUnitOrderingInput,
} from './dto/update-unit-ordering.input';
import { UpdateUnitSettingsInput } from './dto/update-unit-settings.input';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizationService: NormalizationService,
    private readonly auditLogger: AuditLoggerService,
    private readonly cache: MemoryCacheService,
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

  async getUnitOrdering(
    scope: RequestScope,
  ): Promise<UnitOrderingSettingsResponseDto> {
    const unit = await this.prisma.restaurantUnit.findFirst({
      where: {
        id: scope.unitId,
        tenantId: scope.tenantId,
      },
      select: {
        id: true,
        slug: true,
        publicDescription: true,
        orderingTimeZone: true,
        publicMenuEnabled: true,
        publicOrderingEnabled: true,
        takeawayEnabled: true,
        deliveryEnabled: true,
        pickupLeadTimeMinutes: true,
        deliveryLeadTimeMinutes: true,
        latitude: true,
        longitude: true,
        operatingHours: {
          select: {
            id: true,
            fulfillmentType: true,
            dayOfWeek: true,
            opensAtMinutes: true,
            closesAtMinutes: true,
            isClosed: true,
          },
          orderBy: [
            { fulfillmentType: 'asc' },
            { dayOfWeek: 'asc' },
            { opensAtMinutes: 'asc' },
          ],
        },
        deliveryZones: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            coverageRules: {
              select: {
                id: true,
                zipCodePrefix: true,
                neighborhood: true,
                city: true,
                state: true,
                sortOrder: true,
              },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            },
            feeRules: {
              select: {
                id: true,
                minDistanceKm: true,
                maxDistanceKm: true,
                fee: true,
                minimumOrder: true,
              },
              orderBy: [{ minimumOrder: 'desc' }, { fee: 'asc' }],
            },
          },
          orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(Messages.UNIT_NOT_IN_TENANT);
    }

    return {
      id: unit.id,
      unitId: unit.id,
      publicDescription: unit.publicDescription ?? null,
      orderingTimeZone: unit.orderingTimeZone,
      publicMenuEnabled: unit.publicMenuEnabled,
      publicOrderingEnabled: unit.publicOrderingEnabled,
      takeawayEnabled: unit.takeawayEnabled,
      deliveryEnabled: unit.deliveryEnabled,
      pickupLeadTimeMinutes: unit.pickupLeadTimeMinutes,
      deliveryLeadTimeMinutes: unit.deliveryLeadTimeMinutes,
      latitude:
        unit.latitude === null ? null : decimalToNumberOrZero(unit.latitude),
      longitude:
        unit.longitude === null ? null : decimalToNumberOrZero(unit.longitude),
      operatingHours: unit.operatingHours.map((hour) => ({
        id: hour.id,
        fulfillmentType: hour.fulfillmentType,
        dayOfWeek: hour.dayOfWeek,
        opensAtMinutes: hour.opensAtMinutes,
        closesAtMinutes: hour.closesAtMinutes,
        isClosed: hour.isClosed,
      })),
      deliveryZones: unit.deliveryZones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        description: zone.description ?? null,
        isActive: zone.isActive,
        coverageRules: zone.coverageRules.map((rule) => ({
          id: rule.id,
          zipCodePrefix: rule.zipCodePrefix ?? null,
          neighborhood: rule.neighborhood ?? null,
          city: rule.city ?? null,
          state: rule.state ?? null,
          sortOrder: rule.sortOrder,
        })),
        feeRules: zone.feeRules.map((rule) => ({
          id: rule.id,
          minDistanceKm:
            rule.minDistanceKm === null
              ? null
              : decimalToNumberOrZero(rule.minDistanceKm),
          maxDistanceKm:
            rule.maxDistanceKm === null
              ? null
              : decimalToNumberOrZero(rule.maxDistanceKm),
          fee: decimalToNumberOrZero(rule.fee),
          minimumOrder:
            rule.minimumOrder === null
              ? null
              : decimalToNumberOrZero(rule.minimumOrder),
        })),
      })),
    };
  }

  async updateUnitOrdering(
    scope: RequestScope,
    input: UpdateUnitOrderingInput,
  ): Promise<UnitOrderingSettingsResponseDto> {
    const unit = await this.prisma.restaurantUnit.findFirst({
      where: {
        id: scope.unitId,
        tenantId: scope.tenantId,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!unit) {
      throw new NotFoundException(Messages.UNIT_NOT_IN_TENANT);
    }

    this.validateOperatingHours(input.operatingHours);
    this.validateDeliveryZones(input.deliveryZones);

    await this.prisma.$transaction(async (tx) => {
      await tx.restaurantUnit.update({
        where: {
          id: scope.unitId,
        },
        data: {
          ...(input.publicDescription !== undefined
            ? {
                publicDescription:
                  this.normalizationService.normalizeNullableField(
                    input.publicDescription,
                  ),
              }
            : {}),
          ...(input.orderingTimeZone !== undefined
            ? {
                orderingTimeZone:
                  this.normalizationService.normalizeRequiredField(
                    input.orderingTimeZone,
                    'timezone',
                  ),
              }
            : {}),
          ...(input.publicMenuEnabled !== undefined
            ? { publicMenuEnabled: input.publicMenuEnabled }
            : {}),
          ...(input.publicOrderingEnabled !== undefined
            ? { publicOrderingEnabled: input.publicOrderingEnabled }
            : {}),
          ...(input.takeawayEnabled !== undefined
            ? { takeawayEnabled: input.takeawayEnabled }
            : {}),
          ...(input.deliveryEnabled !== undefined
            ? { deliveryEnabled: input.deliveryEnabled }
            : {}),
          ...(input.pickupLeadTimeMinutes !== undefined
            ? { pickupLeadTimeMinutes: input.pickupLeadTimeMinutes }
            : {}),
          ...(input.deliveryLeadTimeMinutes !== undefined
            ? { deliveryLeadTimeMinutes: input.deliveryLeadTimeMinutes }
            : {}),
          ...(input.latitude !== undefined
            ? {
                latitude:
                  input.latitude === null
                    ? null
                    : new Prisma.Decimal(input.latitude.toFixed(7)),
              }
            : {}),
          ...(input.longitude !== undefined
            ? {
                longitude:
                  input.longitude === null
                    ? null
                    : new Prisma.Decimal(input.longitude.toFixed(7)),
              }
            : {}),
        },
      });

      if (input.operatingHours !== undefined) {
        await tx.unitOperatingHour.deleteMany({
          where: {
            unitId: scope.unitId,
          },
        });

        if (input.operatingHours.length > 0) {
          await tx.unitOperatingHour.createMany({
            data: input.operatingHours.map((hour) => ({
              unitId: scope.unitId,
              fulfillmentType: hour.fulfillmentType,
              dayOfWeek: hour.dayOfWeek,
              opensAtMinutes: hour.opensAtMinutes,
              closesAtMinutes: hour.closesAtMinutes,
              isClosed: hour.isClosed ?? false,
            })),
          });
        }
      }

      if (input.deliveryZones !== undefined) {
        const existingZones = await tx.deliveryZone.findMany({
          where: {
            unitId: scope.unitId,
          },
          select: {
            id: true,
          },
        });
        const handledZoneIds = new Set<string>();

        for (const zoneInput of input.deliveryZones) {
          const zoneId = await this.upsertDeliveryZone(
            tx,
            scope.unitId,
            zoneInput,
          );
          handledZoneIds.add(zoneId);
        }

        const zoneIdsToDeactivate = existingZones
          .map((zone) => zone.id)
          .filter((zoneId) => !handledZoneIds.has(zoneId));

        if (zoneIdsToDeactivate.length > 0) {
          await tx.deliveryZone.updateMany({
            where: {
              id: {
                in: zoneIdsToDeactivate,
              },
            },
            data: {
              isActive: false,
            },
          });
        }
      }
    });

    this.cache.invalidate(`public-menu:${unit.slug}`);

    this.auditLogger.log({
      action: 'settings.unit.ordering.updated',
      actorUserId: scope.userId,
      tenantId: scope.tenantId,
      unitId: scope.unitId,
      targetType: 'restaurant_unit',
      targetId: scope.unitId,
      details: {
        fields: Object.keys(input),
      },
    });

    return this.getUnitOrdering(scope);
  }

  private async upsertDeliveryZone(
    tx: Prisma.TransactionClient,
    unitId: string,
    input: UpdateDeliveryZoneInput,
  ): Promise<string> {
    const zoneId = input.id;
    let currentZoneId = zoneId;

    if (zoneId) {
      await tx.deliveryZone.update({
        where: {
          id: zoneId,
        },
        data: {
          name: input.name.trim(),
          description: input.description?.trim() ?? null,
          isActive: input.isActive ?? true,
        },
      });
      currentZoneId = zoneId;
      await tx.deliveryZoneCoverageRule.deleteMany({
        where: {
          deliveryZoneId: currentZoneId,
        },
      });
      await tx.deliveryFeeRule.deleteMany({
        where: {
          deliveryZoneId: currentZoneId,
        },
      });
    } else {
      const createdZone = await tx.deliveryZone.create({
        data: {
          unitId,
          name: input.name.trim(),
          description: input.description?.trim() ?? null,
          isActive: input.isActive ?? true,
        },
        select: {
          id: true,
        },
      });
      currentZoneId = createdZone.id;
    }

    if (input.coverageRules && input.coverageRules.length > 0) {
      await tx.deliveryZoneCoverageRule.createMany({
        data: input.coverageRules.map((rule) => ({
          deliveryZoneId: currentZoneId,
          zipCodePrefix: rule.zipCodePrefix ?? null,
          neighborhood: rule.neighborhood?.trim() ?? null,
          city: rule.city?.trim() ?? null,
          state: rule.state?.trim().toUpperCase() ?? null,
          sortOrder: rule.sortOrder ?? 0,
        })),
      });
    }

    if (input.feeRules && input.feeRules.length > 0) {
      await tx.deliveryFeeRule.createMany({
        data: input.feeRules.map((rule) => ({
          deliveryZoneId: currentZoneId,
          minDistanceKm:
            rule.minDistanceKm === undefined || rule.minDistanceKm === null
              ? null
              : new Prisma.Decimal(rule.minDistanceKm.toFixed(2)),
          maxDistanceKm:
            rule.maxDistanceKm === undefined || rule.maxDistanceKm === null
              ? null
              : new Prisma.Decimal(rule.maxDistanceKm.toFixed(2)),
          fee: new Prisma.Decimal(rule.fee.toFixed(2)),
          minimumOrder:
            rule.minimumOrder === undefined || rule.minimumOrder === null
              ? null
              : new Prisma.Decimal(rule.minimumOrder.toFixed(2)),
        })),
      });
    }

    return currentZoneId;
  }

  private validateOperatingHours(
    operatingHours?: UpdateUnitOrderingInput['operatingHours'],
  ): void {
    if (!operatingHours) {
      return;
    }

    const seenKeys = new Set<string>();

    for (const hour of operatingHours) {
      const key = `${hour.fulfillmentType}:${hour.dayOfWeek}`;

      if (seenKeys.has(key)) {
        throw new ForbiddenException(
          'Nao envie horarios duplicados para o mesmo dia e fulfillment.',
        );
      }

      seenKeys.add(key);

      if (!hour.isClosed && hour.closesAtMinutes <= hour.opensAtMinutes) {
        throw new ForbiddenException(
          'Horario de fechamento deve ser posterior ao de abertura.',
        );
      }
    }
  }

  private validateDeliveryZones(
    deliveryZones?: UpdateUnitOrderingInput['deliveryZones'],
  ): void {
    if (!deliveryZones) {
      return;
    }

    for (const zone of deliveryZones) {
      if ((zone.coverageRules?.length ?? 0) === 0) {
        throw new ForbiddenException(
          'Cada zona de entrega deve ter ao menos uma regra de cobertura.',
        );
      }

      if ((zone.feeRules?.length ?? 0) === 0) {
        throw new ForbiddenException(
          'Cada zona de entrega deve ter ao menos uma regra de taxa.',
        );
      }
    }
  }

  private getTenantIdOrThrow(user: AuthenticatedUser): string {
    const tenantId = user.auth?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(Messages.TENANT_CONTEXT_MISSING);
    }

    return tenantId;
  }
}
