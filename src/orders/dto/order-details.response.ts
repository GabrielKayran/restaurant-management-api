import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, OrderType } from '@prisma/client';

export class OrderItemOptionResponseDto {
  @ApiProperty({
    description: 'Option unique identifier.',
    example: '98af8a86-c2f4-4067-b7b1-77b0400e6367',
  })
  id: string;

  @ApiProperty({
    description: 'Option display name.',
    example: 'Extra cheese',
  })
  optionName: string;

  @ApiProperty({
    description: 'Option quantity.',
    example: 1,
  })
  quantity: number;

  @ApiProperty({
    description: 'Price increment applied by this option.',
    example: 4.5,
  })
  priceDelta: number;
}

export class OrderItemResponseDto {
  @ApiProperty({
    description: 'Order item unique identifier.',
    example: '4f445f3c-b9b4-4206-b2cc-134a5136db53',
  })
  id: string;

  @ApiProperty({
    description: 'Product identifier.',
    example: '2a0717c7-a4d8-4c3d-bcf6-c174a0c94a11',
  })
  productId: string;

  @ApiProperty({
    description: 'Product name at order time.',
    example: 'Cheeseburger',
  })
  productName: string;

  @ApiProperty({
    description: 'Variant name when a product variation was selected.',
    example: 'Large',
    nullable: true,
  })
  variantName: string | null;

  @ApiProperty({
    description: 'Ordered quantity.',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price applied to the order item.',
    example: 24.9,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Total item amount after multiplying quantity and unit price.',
    example: 49.8,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Item-specific notes.',
    example: 'No onions',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Selected options for this order item.',
    type: OrderItemOptionResponseDto,
    isArray: true,
  })
  options: OrderItemOptionResponseDto[];
}

export class OrderStatusHistoryResponseDto {
  @ApiProperty({
    description: 'Status history entry identifier.',
    example: 'f35d5f05-cf34-4be7-b6cc-7da72a19f7ec',
  })
  id: string;

  @ApiProperty({
    description: 'Previous status before transition.',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    nullable: true,
  })
  fromStatus: OrderStatus | null;

  @ApiProperty({
    description: 'Resulting status after transition.',
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
  })
  toStatus: OrderStatus;

  @ApiProperty({
    description: 'Reason for status change when available.',
    example: 'Payment confirmed',
    nullable: true,
  })
  reason: string | null;

  @ApiProperty({
    description: 'Timestamp of the status transition.',
    example: '2026-03-15T18:40:12.090Z',
    format: 'date-time',
  })
  changedAt: Date;

  @ApiProperty({
    description: 'User identifier who triggered the status transition.',
    example: '7a294469-c179-4eb4-be2d-8fc01dd17493',
    nullable: true,
  })
  changedByUserId: string | null;
}

export class OrderDetailsResponseDto {
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
    description: 'Order type.',
    enum: OrderType,
    example: OrderType.DELIVERY,
  })
  type: OrderType;

  @ApiProperty({
    description: 'Current order status.',
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Customer name when linked to a customer profile.',
    example: 'Maria Oliveira',
    nullable: true,
  })
  customerName: string | null;

  @ApiProperty({
    description: 'Table name when linked to a table.',
    example: 'Table 05',
    nullable: true,
  })
  tableName: string | null;

  @ApiProperty({
    description: 'General notes associated with the order.',
    example: 'Deliver to side entrance',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Order creation date and time.',
    example: '2026-03-15T18:25:33.417Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({ description: 'Subtotal amount.', example: 92.0 })
  subtotal: number;

  @ApiProperty({ description: 'Discount amount.', example: 4.5 })
  discount: number;

  @ApiProperty({ description: 'Delivery fee amount.', example: 10.0 })
  deliveryFee: number;

  @ApiProperty({ description: 'Final total amount.', example: 97.5 })
  total: number;

  @ApiProperty({
    description: 'Ordered items.',
    type: OrderItemResponseDto,
    isArray: true,
  })
  items: OrderItemResponseDto[];

  @ApiProperty({
    description: 'Status transition history entries.',
    type: OrderStatusHistoryResponseDto,
    isArray: true,
  })
  history: OrderStatusHistoryResponseDto[];
}
