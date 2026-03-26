import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderChannel } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import {
  mapPersistedOrderItem,
  mapStatusHistory,
  PUBLIC_ORDER_TRACKING_SELECT,
} from '../helpers';
import { PublicOrderTrackingResponseDto } from '../dto';

@Injectable()
export class PublicOrderStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicOrderStatus(
    publicToken: string,
  ): Promise<PublicOrderTrackingResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        publicToken,
        channel: OrderChannel.PUBLIC_CATALOG,
      },
      select: PUBLIC_ORDER_TRACKING_SELECT,
    });

    if (!order?.publicToken) {
      throw new NotFoundException('Pedido publico nao encontrado.');
    }

    const [firstPayment] = order.payments;

    return {
      publicToken: order.publicToken,
      orderId: order.id,
      code: order.code,
      channel: order.channel,
      type: order.type,
      status: order.status,
      customerName: order.customer?.name ?? null,
      customerPhone: order.customer?.phone ?? null,
      deliveryZoneName: order.deliveryZone?.name ?? null,
      paymentMethod: firstPayment?.method ?? null,
      address: order.address
        ? {
            street: order.address.street,
            number: order.address.number,
            neighborhood: order.address.neighborhood ?? null,
            zipCode: order.address.zipCode,
            reference: order.address.reference ?? null,
          }
        : null,
      notes: order.notes ?? null,
      createdAt: order.createdAt,
      subtotal: Number(order.subtotal.toString()),
      deliveryFee: Number(order.deliveryFee.toString()),
      total: Number(order.total.toString()),
      items: order.items.map(mapPersistedOrderItem),
      history: order.statusHistory.map(mapStatusHistory),
    };
  }
}
