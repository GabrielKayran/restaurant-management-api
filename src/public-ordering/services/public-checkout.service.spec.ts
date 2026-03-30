import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  FulfillmentMethod,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import { OrdersRealtimePublisher } from '../../orders-realtime/orders-realtime.publisher';
import { hashPublicOrderPayload } from '../helpers';
import { PublicCheckoutInput } from '../dto';
import { PublicCheckoutComputationService } from './public-checkout-computation.service';
import { PublicCheckoutService } from './public-checkout.service';
import { PublicOrderingContextService } from './public-ordering-context.service';
import { PublicOrderStatusService } from './public-order-status.service';

describe('PublicCheckoutService', () => {
  let service: PublicCheckoutService;
  let prisma: {
    order: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let auditLogger: { log: jest.Mock };
  let contextService: { getUnitBySlug: jest.Mock };
  let computationService: { buildCheckout: jest.Mock };
  let orderStatusService: { getPublicOrderStatus: jest.Mock };
  let ordersRealtimePublisher: { publishOrderCreated: jest.Mock };

  const unit = {
    id: 'unit-1',
    tenantId: 'tenant-1',
    name: 'Loja Centro',
    slug: 'loja-centro',
    phone: '3433310001',
    publicDescription: null,
    orderingTimeZone: 'America/Sao_Paulo',
    publicMenuEnabled: true,
    publicOrderingEnabled: true,
    takeawayEnabled: true,
    deliveryEnabled: true,
    pickupLeadTimeMinutes: 20,
    deliveryLeadTimeMinutes: 45,
    latitude: null,
    longitude: null,
    operatingHours: [],
  };

  const input: PublicCheckoutInput = {
    type: OrderType.DELIVERY,
    customer: {
      name: 'Maria',
      phone: '34999998888',
      email: 'maria@email.com',
    },
    address: {
      street: 'Rua A',
      number: '123',
      neighborhood: 'Centro',
      city: 'Uberlandia',
      state: 'MG',
      zipCode: '38400100',
      reference: 'Portao azul',
    },
    items: [
      { productId: 'product-1', quantity: 2, notes: undefined, options: [] },
    ],
    paymentMethod: PaymentMethod.PIX,
  };

  beforeEach(() => {
    prisma = {
      order: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    auditLogger = {
      log: jest.fn(),
    };

    contextService = {
      getUnitBySlug: jest.fn(),
    };

    computationService = {
      buildCheckout: jest.fn(),
    };

    orderStatusService = {
      getPublicOrderStatus: jest.fn(),
    };
    ordersRealtimePublisher = {
      publishOrderCreated: jest.fn().mockResolvedValue(undefined),
    };

    service = new PublicCheckoutService(
      prisma as unknown as PrismaService,
      auditLogger as unknown as AuditLoggerService,
      contextService as unknown as PublicOrderingContextService,
      computationService as unknown as PublicCheckoutComputationService,
      orderStatusService as unknown as PublicOrderStatusService,
      ordersRealtimePublisher as unknown as OrdersRealtimePublisher,
    );
  });

  it('rejects missing idempotency key', async () => {
    await expect(
      service.createPublicOrder('loja-centro', input),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns existing public order when idempotency key already matches the same payload', async () => {
    contextService.getUnitBySlug.mockResolvedValue(unit);
    prisma.order.findFirst.mockResolvedValue({
      publicToken: 'token-1',
      idempotencyHash: hashPublicOrderPayload(input),
    });
    orderStatusService.getPublicOrderStatus.mockResolvedValue({
      publicToken: 'token-1',
    });

    const result = await service.createPublicOrder(
      'loja-centro',
      input,
      'idem-1',
    );

    expect(result.publicToken).toBe('token-1');
    expect(orderStatusService.getPublicOrderStatus).toHaveBeenCalledWith(
      'token-1',
    );
    expect(ordersRealtimePublisher.publishOrderCreated).not.toHaveBeenCalled();
  });

  it('rejects idempotency key reuse with different payload', async () => {
    contextService.getUnitBySlug.mockResolvedValue(unit);
    prisma.order.findFirst.mockResolvedValue({
      publicToken: 'token-1',
      idempotencyHash: 'different-hash',
    });

    await expect(
      service.createPublicOrder('loja-centro', input, 'idem-3'),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a public order with pending payment and server-side totals', async () => {
    contextService.getUnitBySlug.mockResolvedValue(unit);
    prisma.order.findFirst.mockResolvedValueOnce(null);
    computationService.buildCheckout.mockResolvedValue({
      fulfillmentType: FulfillmentMethod.DELIVERY,
      items: [],
      itemData: [],
      subtotal: 50,
      delivery: {
        zoneId: 'zone-1',
        zoneName: 'Centro',
        distanceKm: null,
        fee: 8,
      },
      total: 58,
    });
    orderStatusService.getPublicOrderStatus.mockResolvedValue({
      publicToken: 'token-new',
    });

    const tx = {
      order: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ code: 10 }),
        create: jest.fn().mockResolvedValue({
          id: 'order-1',
          publicToken: 'token-new',
        }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'customer-1' }),
        update: jest.fn(),
      },
      address: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'address-1' }),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await service.createPublicOrder('loja-centro', input, 'idem-2');

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: new Prisma.Decimal('50.00'),
          deliveryFee: new Prisma.Decimal('8.00'),
          total: new Prisma.Decimal('58.00'),
          payments: {
            create: expect.objectContaining({
              method: PaymentMethod.PIX,
              status: PaymentStatus.PENDING,
            }),
          },
        }),
      }),
    );
    expect(auditLogger.log).toHaveBeenCalledTimes(1);
    expect(ordersRealtimePublisher.publishOrderCreated).toHaveBeenCalledWith(
      'order-1',
    );
    expect(orderStatusService.getPublicOrderStatus).toHaveBeenCalledWith(
      'token-new',
    );
  });
});
