import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateOrderInput {
  @ApiPropertyOptional({ enum: OrderType })
  @IsOptional()
  @IsEnum(OrderType, { message: 'Tipo de pedido inválido.' })
  type: OrderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente inválido.' })
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID da mesa inválido.' })
  tableId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto.' })
  notes: string;
}
