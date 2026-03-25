import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { CreateProductOptionGroupInput } from './product-option-group.input';
import { CreateProductPriceInput } from './product-price.input';
import { CreateProductAvailabilityWindowInput } from './product-availability.input';
import { CreateProductVariantInput } from './product-variant.input';

export class CreateProductInput {
  @ApiProperty()
  @IsString({ message: 'validation.products.nameMustBeString' })
  @MaxLength(120, { message: 'validation.products.nameMaxLength120' })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.products.categoryIdInvalid' })
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.products.descriptionMustBeString' })
  @MaxLength(1000, {
    message: 'validation.products.descriptionMaxLength1000',
  })
  description: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'validation.products.basePriceDecimal',
    },
  )
  @Min(0, { message: 'validation.products.basePriceMin' })
  basePrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'validation.products.costPriceDecimal' },
  )
  @Min(0, { message: 'validation.products.costPriceMin' })
  costPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.products.skuMustBeString' })
  sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.products.imageUrlMustBeString' })
  imageUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'validation.products.isActiveBoolean' })
  isActive: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'validation.products.isAvailableForTakeawayBoolean' })
  isAvailableForTakeaway?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'validation.products.isAvailableForDeliveryBoolean' })
  isAvailableForDelivery?: boolean;

  @ApiPropertyOptional({ type: [CreateProductVariantInput] })
  @IsOptional()
  @IsArray({ message: 'As variantes devem ser uma lista.' })
  @Type(() => CreateProductVariantInput)
  variants?: CreateProductVariantInput[];

  @ApiPropertyOptional({ type: [CreateProductOptionGroupInput] })
  @IsOptional()
  @IsArray({ message: 'Os grupos de adicionais devem ser uma lista.' })
  @Type(() => CreateProductOptionGroupInput)
  optionGroups?: CreateProductOptionGroupInput[];

  @ApiPropertyOptional({ type: [CreateProductPriceInput] })
  @IsOptional()
  @IsArray({ message: 'Os precos agendados devem ser uma lista.' })
  @Type(() => CreateProductPriceInput)
  prices?: CreateProductPriceInput[];

  @ApiPropertyOptional({ type: [CreateProductAvailabilityWindowInput] })
  @IsOptional()
  @IsArray({ message: 'As janelas de disponibilidade devem ser uma lista.' })
  @Type(() => CreateProductAvailabilityWindowInput)
  availabilityWindows?: CreateProductAvailabilityWindowInput[];
}
