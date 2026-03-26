import { NotFoundException } from '@nestjs/common';
import {
  OrderChannel,
  OrderStatus,
  OrderType,
  PaymentMethod,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { PublicOrderStatusService } from './public-order-status.service';

describe('PublicOrderStatusService', () => {
  let service: PublicOrderStatusService;
  let prisma: {
    order: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      order: {
        findFirst: jest.fn(),
      },
    };

    service = new PublicOrderStatusService(prisma as unknown as PrismaService);
  });

  it('throws NotFoundException when public token does not exist', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(service.getPublicOrderStatus('token-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('maps persisted order status payload', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      publicToken: 'token-1',
      code: 10,
      channel: OrderChannel.PUBLIC_CATALOG,
      type: OrderType.DELIVERY,
      status: OrderStatus.PENDING,
      notes: null,
      createdAt: new Date(),
      subtotal: new Prisma.Decimal('50.00'),
      deliveryFee: new Prisma.Decimal('8.00'),
      total: new Prisma.Decimal('58.00'),
      customer: { name: 'Maria', phone: '34999998888' },
      address: {
        street: 'Rua A',
        number: '123',
        neighborhood: 'Centro',
        zipCode: '38400100',
        reference: null,
      },
      deliveryZone: { name: 'Centro' },
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          productName: 'X-Burger',
          variantName: null,
          quantity: 2,
          unitPrice: new Prisma.Decimal('25.00'),
          totalPrice: new Prisma.Decimal('50.00'),
          notes: null,
          options: [],
        },
      ],
      statusHistory: [
        {
          id: 'history-1',
          fromStatus: null,
          toStatus: OrderStatus.PENDING,
          reason: 'Pedido publico criado.',
          changedAt: new Date(),
          changedByUserId: null,
        },
      ],
      payments: [{ method: PaymentMethod.PIX }],
    });

    const result = await service.getPublicOrderStatus('token-1');

    expect(result.publicToken).toBe('token-1');
    expect(result.subtotal).toBe(50);
    expect(result.paymentMethod).toBe(PaymentMethod.PIX);
    expect(result.items).toHaveLength(1);
    expect(result.history).toHaveLength(1);
  });
});
