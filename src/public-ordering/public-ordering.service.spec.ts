import { BadRequestException, ConflictException } from '@nestjs/common';
import {
  OrderChannel,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AuditLoggerService } from '../common/services/audit-logger.service';
import { MemoryCacheService } from '../common/services/memory-cache.service';
import { PublicCheckoutInput } from './dto/public-checkout.input';
import { PublicOrderingService } from './public-ordering.service';

describe('PublicOrderingService', () => {
  let service: PublicOrderingService;
  let prisma: {
    restaurantUnit: { findFirst: jest.Mock };
    category: { findMany: jest.Mock };
    product: { findMany: jest.Mock };
    deliveryZone: { findMany: jest.Mock };
    order: { findFirst: jest.Mock; create: jest.Mock };
    customer: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    address: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    orderStatusHistory: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let cache: { get: jest.Mock; set: jest.Mock; invalidate: jest.Mock };
  let auditLogger: { log: jest.Mock };

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

  const product = {
    id: 'product-1',
    name: 'X-Burger',
    description: null,
    imageUrl: null,
    basePrice: new Prisma.Decimal('25.00'),
    isActive: true,
    isAvailableForTakeaway: true,
    isAvailableForDelivery: true,
    variants: [],
    optionGroups: [],
    prices: [],
    availabilityWindows: [],
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
      restaurantUnit: { findFirst: jest.fn() },
      category: { findMany: jest.fn() },
      product: { findMany: jest.fn() },
      deliveryZone: { findMany: jest.fn() },
      order: { findFirst: jest.fn(), create: jest.fn() },
      customer: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      address: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      orderStatusHistory: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    cache = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn((_: string, value: unknown) => value),
      invalidate: jest.fn(),
    };

    auditLogger = {
      log: jest.fn(),
    };

    service = new PublicOrderingService(
      prisma as unknown as PrismaService,
      cache as unknown as MemoryCacheService,
      auditLogger as unknown as AuditLoggerService,
    );
  });

  it('recalculates subtotal, delivery fee and total on quote', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue(unit);
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.deliveryZone.findMany.mockResolvedValue([
      {
        id: 'zone-1',
        name: 'Centro',
        description: null,
        coverageRules: [
          {
            zipCodePrefix: '38400',
            neighborhood: null,
            city: null,
            state: null,
            sortOrder: 0,
          },
        ],
        feeRules: [
          {
            minDistanceKm: null,
            maxDistanceKm: null,
            fee: new Prisma.Decimal('8.00'),
            minimumOrder: null,
          },
        ],
      },
    ]);

    const result = await service.quoteCheckout('loja-centro', input);

    expect(result.subtotal).toBe(50);
    expect(result.deliveryFee).toBe(8);
    expect(result.total).toBe(58);
    expect(result.delivery.zoneName).toBe('Centro');
  });

  it('rejects unavailable product for delivery', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue(unit);
    prisma.product.findMany.mockResolvedValue([
      {
        ...product,
        isAvailableForDelivery: false,
      },
    ]);

    await expect(service.quoteCheckout('loja-centro', input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns existing public order when idempotency key already matches the same payload', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue(unit);
    const payloadHash = (service as any).hashPublicOrderPayload(input);

    prisma.order.findFirst
      .mockResolvedValueOnce({
        publicToken: 'token-1',
        idempotencyHash: payloadHash,
      })
      .mockResolvedValueOnce({
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
        items: [],
        statusHistory: [],
        payments: [{ method: PaymentMethod.PIX }],
      });

    const result = await service.createPublicOrder(
      'loja-centro',
      input,
      'idem-1',
    );

    expect(result.publicToken).toBe('token-1');
  });

  it('creates a public order with pending payment and server-side totals', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue(unit);
    prisma.order.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'order-1',
      publicToken: 'token-new',
      code: 11,
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
      items: [],
      statusHistory: [],
      payments: [{ method: PaymentMethod.PIX }],
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
      product: {
        findMany: jest.fn().mockResolvedValue([product]),
      },
      deliveryZone: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'zone-1',
            name: 'Centro',
            description: null,
            coverageRules: [
              {
                zipCodePrefix: '38400',
                neighborhood: null,
                city: null,
                state: null,
                sortOrder: 0,
              },
            ],
            feeRules: [
              {
                minDistanceKm: null,
                maxDistanceKm: null,
                fee: new Prisma.Decimal('8.00'),
                minimumOrder: null,
              },
            ],
          },
        ]),
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
  });

  it('rejects idempotency key reuse with different payload', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue(unit);
    prisma.order.findFirst.mockResolvedValue({
      publicToken: 'token-1',
      idempotencyHash: 'different-hash',
    });

    await expect(
      service.createPublicOrder('loja-centro', input, 'idem-3'),
    ).rejects.toThrow(ConflictException);
  });
});
