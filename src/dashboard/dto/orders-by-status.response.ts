import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class OrdersByStatusResponseDto {
  @ApiProperty({
    description: 'Order status bucket.',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Number of orders in this status.',
    example: 12,
  })
  count: number;
}
