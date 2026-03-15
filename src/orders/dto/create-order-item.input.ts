import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemOptionInput {
  @ApiProperty()
  @IsUUID('4', { message: 'validation.orders.optionIdInvalid' })
  productOptionId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.orders.quantityMustBeInteger' })
  @Min(1, { message: 'validation.orders.quantityMin' })
  @Max(20, { message: 'validation.orders.quantityMax20' })
  quantity: number = 1;
}

export class CreateOrderItemInput {
  @ApiProperty()
  @IsUUID('4', { message: 'validation.orders.productIdInvalid' })
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.orders.variantIdInvalid' })
  variantId?: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'validation.orders.quantityMustBeInteger' })
  @Min(1, { message: 'validation.orders.quantityMin' })
  @Max(200, { message: 'validation.orders.quantityMax200' })
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.common.notesMustBeString' })
  notes: string;

  @ApiPropertyOptional({ type: [CreateOrderItemOptionInput] })
  @IsOptional()
  @IsArray({ message: 'validation.orders.optionsMustBeArray' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemOptionInput)
  options: CreateOrderItemOptionInput[];
}
