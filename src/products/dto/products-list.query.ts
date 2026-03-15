import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ProductsListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página mínima é 1.' })
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro.' })
  @Min(1, { message: 'O limite mínimo é 1.' })
  @Max(100, { message: 'O limite máximo é 100.' })
  limit: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'A busca deve ser um texto.' })
  search: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID de categoria inválido.' })
  categoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'O filtro de ativo deve ser verdadeiro ou falso.' })
  isActive: boolean;
}
