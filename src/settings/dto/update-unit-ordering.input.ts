import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { FulfillmentMethod } from '@prisma/client';
import {
  sanitizeStateCode,
  sanitizeTrimmedString,
  sanitizeZipCode,
} from '../../common/utils/sanitize.util';

export class UpdateUnitOperatingHourInput {
  @ApiPropertyOptional({ enum: FulfillmentMethod })
  @IsEnum(FulfillmentMethod, { message: 'Fulfillment invalido.' })
  fulfillmentType: FulfillmentMethod;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Dia da semana deve ser inteiro.' })
  @Min(0, { message: 'Dia da semana minimo e 0.' })
  @Max(6, { message: 'Dia da semana maximo e 6.' })
  dayOfWeek: number;

  @ApiPropertyOptional({ example: 660 })
  @Type(() => Number)
  @IsInt({ message: 'Abertura deve ser inteiro em minutos.' })
  @Min(0, { message: 'Abertura minima e 0.' })
  @Max(1439, { message: 'Abertura maxima e 1439.' })
  opensAtMinutes: number;

  @ApiPropertyOptional({ example: 1380 })
  @Type(() => Number)
  @IsInt({ message: 'Fechamento deve ser inteiro em minutos.' })
  @Min(1, { message: 'Fechamento minimo e 1.' })
  @Max(1440, { message: 'Fechamento maximo e 1440.' })
  closesAtMinutes: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isClosed deve ser booleano.' })
  isClosed?: boolean;
}

export class UpdateDeliveryZoneCoverageRuleInput {
  @ApiPropertyOptional({ example: '38400' })
  @IsOptional()
  @Transform(({ value }) => sanitizeZipCode(value))
  @Matches(/^\d{5,8}$/, {
    message: 'Prefixo de CEP deve conter entre 5 e 8 digitos.',
  })
  zipCodePrefix?: string | null;

  @ApiPropertyOptional({ example: 'Centro', nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Bairro deve ser texto.' })
  @MaxLength(120, { message: 'Bairro deve ter no maximo 120 caracteres.' })
  neighborhood?: string | null;

  @ApiPropertyOptional({ example: 'Uberlandia', nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Cidade deve ser texto.' })
  @MaxLength(120, { message: 'Cidade deve ter no maximo 120 caracteres.' })
  city?: string | null;

  @ApiPropertyOptional({ example: 'MG', nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeStateCode(value))
  @Matches(/^[A-Z]{2}$/, { message: 'Estado deve conter 2 letras.' })
  state?: string | null;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'sortOrder deve ser inteiro.' })
  @Min(0, { message: 'sortOrder minimo e 0.' })
  @Max(999, { message: 'sortOrder maximo e 999.' })
  sortOrder?: number;
}

export class UpdateDeliveryFeeRuleInput {
  @ApiPropertyOptional({ example: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Distancia minima deve ser numerica.' },
  )
  @Min(0, { message: 'Distancia minima deve ser positiva.' })
  minDistanceKm?: number | null;

  @ApiPropertyOptional({ example: 5, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Distancia maxima deve ser numerica.' },
  )
  @Min(0, { message: 'Distancia maxima deve ser positiva.' })
  maxDistanceKm?: number | null;

  @ApiPropertyOptional({ example: 8 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Taxa deve ser numerica.' })
  @Min(0, { message: 'Taxa deve ser positiva.' })
  fee: number;

  @ApiPropertyOptional({ example: 50, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Pedido minimo deve ser numerico.' },
  )
  @Min(0, { message: 'Pedido minimo deve ser positivo.' })
  minimumOrder?: number | null;
}

export class UpdateDeliveryZoneInput {
  @ApiPropertyOptional({ example: 'zone-id', nullable: true })
  @IsOptional()
  @IsUUID('4', { message: 'Id da zona invalido.' })
  id?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Nome da zona deve ser texto.' })
  @MaxLength(120, {
    message: 'Nome da zona deve ter no maximo 120 caracteres.',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Atende Centro e bairros proximos',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Descricao deve ser texto.' })
  @MaxLength(300, { message: 'Descricao deve ter no maximo 300 caracteres.' })
  description?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive deve ser booleano.' })
  isActive?: boolean;

  @ApiPropertyOptional({ type: [UpdateDeliveryZoneCoverageRuleInput] })
  @IsOptional()
  @IsArray({ message: 'coverageRules deve ser lista.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateDeliveryZoneCoverageRuleInput)
  coverageRules?: UpdateDeliveryZoneCoverageRuleInput[];

  @ApiPropertyOptional({ type: [UpdateDeliveryFeeRuleInput] })
  @IsOptional()
  @IsArray({ message: 'feeRules deve ser lista.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateDeliveryFeeRuleInput)
  feeRules?: UpdateDeliveryFeeRuleInput[];
}

export class UpdateUnitOrderingInput {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Descricao publica deve ser texto.' })
  @MaxLength(300, {
    message: 'Descricao publica deve ter no maximo 300 caracteres.',
  })
  publicDescription?: string | null;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Timezone deve ser texto.' })
  @MaxLength(64, { message: 'Timezone deve ter no maximo 64 caracteres.' })
  orderingTimeZone?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'publicMenuEnabled deve ser booleano.' })
  publicMenuEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'publicOrderingEnabled deve ser booleano.' })
  publicOrderingEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'takeawayEnabled deve ser booleano.' })
  takeawayEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'deliveryEnabled deve ser booleano.' })
  deliveryEnabled?: boolean;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pickupLeadTimeMinutes deve ser inteiro.' })
  @Min(0, { message: 'pickupLeadTimeMinutes minimo e 0.' })
  @Max(240, { message: 'pickupLeadTimeMinutes maximo e 240.' })
  pickupLeadTimeMinutes?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'deliveryLeadTimeMinutes deve ser inteiro.' })
  @Min(0, { message: 'deliveryLeadTimeMinutes minimo e 0.' })
  @Max(240, { message: 'deliveryLeadTimeMinutes maximo e 240.' })
  deliveryLeadTimeMinutes?: number;

  @ApiPropertyOptional({ example: -18.9141, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 7 }, { message: 'Latitude deve ser numerica.' })
  latitude?: number | null;

  @ApiPropertyOptional({ example: -48.2749, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 7 },
    { message: 'Longitude deve ser numerica.' },
  )
  longitude?: number | null;

  @ApiPropertyOptional({ type: [UpdateUnitOperatingHourInput] })
  @IsOptional()
  @IsArray({ message: 'operatingHours deve ser lista.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateUnitOperatingHourInput)
  operatingHours?: UpdateUnitOperatingHourInput[];

  @ApiPropertyOptional({ type: [UpdateDeliveryZoneInput] })
  @IsOptional()
  @IsArray({ message: 'deliveryZones deve ser lista.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateDeliveryZoneInput)
  deliveryZones?: UpdateDeliveryZoneInput[];
}
