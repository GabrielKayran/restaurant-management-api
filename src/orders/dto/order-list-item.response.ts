import { OrderStatus, OrderType } from '@prisma/client';

export class OrderListItemResponseDto {
  id: string;
  code: number;
  status: OrderStatus;
  type: OrderType;
  customerName: string | null;
  tableName: string | null;
  itemsCount: number;
  total: number;
  createdAt: Date;
}
