import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, OrderType } from '@prisma/client';

export class OrderListItemResponseDto {
  @ApiProperty({
    description: 'Order unique identifier.',
    example: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
  })
  id: string;

  @ApiProperty({
    description: 'Sequential order code visible to staff.',
    example: 1042,
  })
  code: number;

  @ApiProperty({
    description: 'Current order status.',
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Order type.',
    enum: OrderType,
    example: OrderType.DELIVERY,
  })
  type: OrderType;

  @ApiProperty({
    description: 'Customer name when linked to a customer profile.',
    example: 'Maria Oliveira',
    nullable: true,
  })
  customerName: string | null;

  @ApiProperty({
    description: 'Table name when linked to a table session.',
    example: 'Table 05',
    nullable: true,
  })
  tableName: string | null;

  @ApiProperty({
    description: 'Number of items in the order.',
    example: 3,
  })
  itemsCount: number;

  @ApiProperty({
    description: 'Order total amount.',
    example: 97.5,
  })
  total: number;

  @ApiProperty({
    description: 'Order creation date and time.',
    example: '2026-03-15T18:25:33.417Z',
    format: 'date-time',
  })
  createdAt: Date;
}
