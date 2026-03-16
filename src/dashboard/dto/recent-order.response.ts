import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, OrderType } from '@prisma/client';

export class RecentOrderResponseDto {
  @ApiProperty({
    description: 'Order unique identifier.',
    example: 'd6145c3b-34a9-440f-95f3-105498c8ce67',
  })
  id: string;

  @ApiProperty({
    description: 'Sequential order code visible to staff.',
    example: 1024,
  })
  code: number;

  @ApiProperty({
    description: 'Order type.',
    enum: OrderType,
    example: OrderType.DINE_IN,
  })
  type: OrderType;

  @ApiProperty({
    description: 'Current order status.',
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Customer name when the order is associated to a customer.',
    example: 'John Doe',
    nullable: true,
  })
  customerName: string | null;

  @ApiProperty({
    description: 'Table name when the order is associated to a table.',
    example: 'Table 12',
    nullable: true,
  })
  tableName: string | null;

  @ApiProperty({
    description: 'Order total amount.',
    example: 89.9,
  })
  total: number;

  @ApiProperty({
    description: 'Order creation date and time.',
    example: '2026-03-15T18:25:33.417Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Number of items in the order.',
    example: 4,
  })
  itemsCount: number;
}
