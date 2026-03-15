import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

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
}
