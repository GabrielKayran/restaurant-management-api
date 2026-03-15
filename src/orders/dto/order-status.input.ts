import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderStatusInput {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus, { message: 'Status do pedido inválido.' })
  status: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'O motivo deve ser um texto.' })
  @MaxLength(255, { message: 'O motivo pode ter no máximo 255 caracteres.' })
  reason: string;
}
