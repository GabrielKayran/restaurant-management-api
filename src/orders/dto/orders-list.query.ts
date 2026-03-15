import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class OrdersListQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página mínima é 1.' })
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro.' })
  @Min(1, { message: 'O limite mínimo é 1.' })
  @Max(100, { message: 'O limite máximo é 100.' })
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Código do pedido, nome da mesa ou nome do cliente',
  })
  @IsOptional()
  @IsString({ message: 'A busca deve ser um texto.' })
  search: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status do pedido inválido.' })
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Data de início (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de início inválida.' })
  startDate: string;

  @ApiPropertyOptional({ description: 'Data de fim (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim inválida.' })
  endDate: string;
}
