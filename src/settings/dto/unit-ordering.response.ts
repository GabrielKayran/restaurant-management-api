import { ApiProperty } from '@nestjs/swagger';
import { FulfillmentMethod } from '@prisma/client';

export class UnitOperatingHourResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: FulfillmentMethod })
  fulfillmentType: FulfillmentMethod;

  @ApiProperty()
  dayOfWeek: number;

  @ApiProperty()
  opensAtMinutes: number;

  @ApiProperty()
  closesAtMinutes: number;

  @ApiProperty()
  isClosed: boolean;
}

export class DeliveryZoneCoverageRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  zipCodePrefix: string | null;

  @ApiProperty({ nullable: true })
  neighborhood: string | null;

  @ApiProperty({ nullable: true })
  city: string | null;

  @ApiProperty({ nullable: true })
  state: string | null;

  @ApiProperty()
  sortOrder: number;
}

export class DeliveryFeeRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  minDistanceKm: number | null;

  @ApiProperty({ nullable: true })
  maxDistanceKm: number | null;

  @ApiProperty()
  fee: number;

  @ApiProperty({ nullable: true })
  minimumOrder: number | null;
}

export class DeliveryZoneResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [DeliveryZoneCoverageRuleResponseDto] })
  coverageRules: DeliveryZoneCoverageRuleResponseDto[];

  @ApiProperty({ type: [DeliveryFeeRuleResponseDto] })
  feeRules: DeliveryFeeRuleResponseDto[];
}

export class UnitOrderingSettingsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  unitId: string;

  @ApiProperty({ nullable: true })
  publicDescription: string | null;

  @ApiProperty()
  orderingTimeZone: string;

  @ApiProperty()
  publicMenuEnabled: boolean;

  @ApiProperty()
  publicOrderingEnabled: boolean;

  @ApiProperty()
  takeawayEnabled: boolean;

  @ApiProperty()
  deliveryEnabled: boolean;

  @ApiProperty()
  pickupLeadTimeMinutes: number;

  @ApiProperty()
  deliveryLeadTimeMinutes: number;

  @ApiProperty({ nullable: true })
  latitude: number | null;

  @ApiProperty({ nullable: true })
  longitude: number | null;

  @ApiProperty({ type: [UnitOperatingHourResponseDto] })
  operatingHours: UnitOperatingHourResponseDto[];

  @ApiProperty({ type: [DeliveryZoneResponseDto] })
  deliveryZones: DeliveryZoneResponseDto[];
}
