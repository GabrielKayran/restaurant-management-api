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
  @IsUUID('4', { message: 'ID da opção inválido.' })
  productOptionId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade mínima é 1.' })
  @Max(20, { message: 'A quantidade máxima é 20.' })
  quantity: number = 1;
}

export class CreateOrderItemInput {
  @ApiProperty()
  @IsUUID('4', { message: 'ID do produto inválido.' })
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID da variante inválido.' })
  variantId?: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade mínima é 1.' })
  @Max(200, { message: 'A quantidade máxima é 200.' })
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto.' })
  notes: string;

  @ApiPropertyOptional({ type: [CreateOrderItemOptionInput] })
  @IsOptional()
  @IsArray({ message: 'As opções devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemOptionInput)
  options: CreateOrderItemOptionInput[];
}
