import { ApiProperty } from '@nestjs/swagger';
import {
  OrderChannel,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '@prisma/client';
import {
  OrderItemResponseDto,
  OrderStatusHistoryResponseDto,
} from '../../orders/dto/order-details.response';

export class PublicOrderAddressResponseDto {
  @ApiProperty({ example: 'Rua das Flores', nullable: true })
  street: string | null;

  @ApiProperty({ example: '123', nullable: true })
  number: string | null;

  @ApiProperty({ example: 'Centro', nullable: true })
  neighborhood: string | null;

  @ApiProperty({ example: '38400100', nullable: true })
  zipCode: string | null;

  @ApiProperty({ example: 'Casa azul', nullable: true })
  reference: string | null;
}

export class PublicOrderTrackingResponseDto {
  @ApiProperty({ example: 'public-token' })
  publicToken: string;

  @ApiProperty({ example: 'order-id' })
  orderId: string;

  @ApiProperty({ example: 1042 })
  code: number;

  @ApiProperty({ enum: OrderChannel, example: OrderChannel.PUBLIC_CATALOG })
  channel: OrderChannel;

  @ApiProperty({ enum: OrderType, example: OrderType.DELIVERY })
  type: OrderType;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PREPARING })
  status: OrderStatus;

  @ApiProperty({ example: 'Maria Oliveira', nullable: true })
  customerName: string | null;

  @ApiProperty({ example: '34999998888', nullable: true })
  customerPhone: string | null;

  @ApiProperty({ example: 'Centro', nullable: true })
  deliveryZoneName: string | null;

  @ApiProperty({ enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod | null;

  @ApiProperty({ type: PublicOrderAddressResponseDto, nullable: true })
  address: PublicOrderAddressResponseDto | null;

  @ApiProperty({ example: 'Entregar na portaria', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2026-03-25T20:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 62.8 })
  subtotal: number;

  @ApiProperty({ example: 8 })
  deliveryFee: number;

  @ApiProperty({ example: 70.8 })
  total: number;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ type: [OrderStatusHistoryResponseDto] })
  history: OrderStatusHistoryResponseDto[];
}
