import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { OrdersRealtimeGateway } from './orders-realtime.gateway';

@Injectable()
export class OrdersRealtimePublisher {
  private readonly logger = new Logger(OrdersRealtimePublisher.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersRealtimeGateway: OrdersRealtimeGateway,
  ) {}

  async publishOrderCreated(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          code: true,
          unitId: true,
          channel: true,
          type: true,
          status: true,
          total: true,
          createdAt: true,
          sourceReference: true,
          customer: {
            select: {
              name: true,
            },
          },
          table: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!order) {
        return;
      }

      this.ordersRealtimeGateway.emitOrderCreated({
        id: order.id,
        code: order.code,
        unitId: order.unitId,
        channel: order.channel,
        type: order.type,
        status: order.status,
        total: decimalToNumberOrZero(order.total),
        customerName: order.customer?.name ?? null,
        tableName: order.table?.name ?? null,
        createdAt: order.createdAt,
        sourceReference: order.sourceReference ?? null,
      });
    } catch (error) {
      this.logFailure('order.created', orderId, error);
    }
  }

  async publishOrderStatusUpdated(
    orderId: string,
    previousStatus: OrderStatus | null,
  ): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          unitId: true,
          status: true,
          statusHistory: {
            select: {
              fromStatus: true,
              changedAt: true,
            },
            orderBy: {
              changedAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!order) {
        return;
      }

      const latestStatusHistory = order.statusHistory[0];

      this.ordersRealtimeGateway.emitOrderStatusUpdated({
        id: order.id,
        unitId: order.unitId,
        status: order.status,
        previousStatus:
          previousStatus ?? latestStatusHistory?.fromStatus ?? null,
        changedAt: latestStatusHistory?.changedAt ?? new Date(),
      });
    } catch (error) {
      this.logFailure('order.status.updated', orderId, error);
    }
  }

  private logFailure(
    event: 'order.created' | 'order.status.updated',
    orderId: string,
    error: unknown,
  ): void {
    this.logger.error(
      JSON.stringify({
        event,
        orderId,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : String(error),
      }),
    );
  }
}
