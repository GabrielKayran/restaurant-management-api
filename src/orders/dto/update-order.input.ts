import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateOrderInput {
  @ApiPropertyOptional({ enum: OrderType })
  @IsOptional()
  @IsEnum(OrderType, { message: 'validation.orders.typeInvalid' })
  type: OrderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.orders.customerIdInvalid' })
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.orders.tableIdInvalid' })
  tableId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.common.notesMustBeString' })
  notes: string;
}
