import { OrderStatus, OrderType } from '@prisma/client';

export class OrderItemOptionResponseDto {
  id: string;
  optionName: string;
  quantity: number;
  priceDelta: number;
}

export class OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  options: OrderItemOptionResponseDto[];
}

export class OrderStatusHistoryResponseDto {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string | null;
  changedAt: Date;
  changedByUserId: string | null;
}

export class OrderDetailsResponseDto {
  id: string;
  code: number;
  type: OrderType;
  status: OrderStatus;
  customerName: string | null;
  tableName: string | null;
  notes: string | null;
  createdAt: Date;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  items: OrderItemResponseDto[];
  history: OrderStatusHistoryResponseDto[];
}
