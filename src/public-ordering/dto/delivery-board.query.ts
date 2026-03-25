import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class DeliveryBoardQueryDto {
  @ApiPropertyOptional({
    description: 'Filtro textual por codigo, cliente, telefone ou endereco.',
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser texto.' })
  search?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status invalido.' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Inclui colunas de pedidos entregues e cancelados.',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'includeCompleted deve ser booleano.' })
  includeCompleted: boolean = false;
}
