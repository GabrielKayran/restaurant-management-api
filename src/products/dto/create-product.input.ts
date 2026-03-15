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
  @IsString({ message: 'O nome do produto deve ser um texto.' })
  @MaxLength(120, { message: 'O nome pode ter no máximo 120 caracteres.' })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID de categoria inválido.' })
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(1000, {
    message: 'A descrição pode ter no máximo 1000 caracteres.',
  })
  description: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'O preço de venda deve ser um número com até 2 casas decimais.',
    },
  )
  @Min(0, { message: 'O preço de venda não pode ser negativo.' })
  basePrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O custo deve ser um número com até 2 casas decimais.' },
  )
  @Min(0, { message: 'O custo não pode ser negativo.' })
  costPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'O SKU deve ser um texto.' })
  sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'A URL da imagem deve ser um texto.' })
  imageUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'O campo ativo deve ser verdadeiro ou falso.' })
  isActive: boolean;
}
