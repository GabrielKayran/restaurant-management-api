import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderStatusInput {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus, { message: 'validation.orders.statusInvalid' })
  status: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'validation.orders.reasonMustBeString' })
  @MaxLength(255, { message: 'validation.orders.reasonMaxLength255' })
  reason: string;
}
