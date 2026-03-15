import { OrderStatus, OrderType } from '@prisma/client';

export class RecentOrderResponseDto {
  id: string;
  code: number;
  type: OrderType;
  status: OrderStatus;
  customerName: string | null;
  tableName: string | null;
  total: number;
  createdAt: Date;
  itemsCount: number;
}
