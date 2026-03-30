import { OrderChannel, OrderStatus, OrderType } from '@prisma/client';

export interface OrderCreatedRealtimeEvent {
  id: string;
  code: number;
  unitId: string;
  channel: OrderChannel;
  type: OrderType;
  status: OrderStatus;
  total: number;
  customerName: string | null;
  tableName: string | null;
  createdAt: Date;
  sourceReference: string | null;
}

export interface OrderStatusUpdatedRealtimeEvent {
  id: string;
  unitId: string;
  status: OrderStatus;
  previousStatus: OrderStatus | null;
  changedAt: Date;
}
