import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductVariantInput {
  @ApiProperty({ example: 'Duplo' })
  @IsString({ message: 'O nome da variante deve ser um texto.' })
  @MaxLength(80, {
    message: 'O nome da variante pode ter no maximo 80 caracteres.',
  })
  name: string;

  @ApiPropertyOptional({ example: 'BURG-DUPLO' })
  @IsOptional()
  @IsString({ message: 'O SKU da variante deve ser um texto.' })
  @MaxLength(80, {
    message: 'O SKU da variante pode ter no maximo 80 caracteres.',
  })
  sku?: string;

  @ApiProperty({ example: 8.5, default: 0 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'O ajuste de preco da variante deve ser um numero com ate 2 casas decimais.',
    },
  )
  priceDelta: number = 0;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({
    message: 'O campo variante padrao deve ser verdadeiro ou falso.',
  })
  isDefault?: boolean;
}
