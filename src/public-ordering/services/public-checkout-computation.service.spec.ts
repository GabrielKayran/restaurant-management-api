import { BadRequestException } from '@nestjs/common';
import { OrderType, PaymentMethod, Prisma } from '@prisma/client';
import { PublicCheckoutInput } from '../dto';
import { PublicCheckoutComputationService } from './public-checkout-computation.service';
import { PublicOrderingContextService } from './public-ordering-context.service';

describe('PublicCheckoutComputationService', () => {
  let service: PublicCheckoutComputationService;
  let contextService: { loadProductMap: jest.Mock };
  let db: {
    deliveryZone: { findMany: jest.Mock };
  };

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
    contextService = {
      loadProductMap: jest.fn(),
    };

    db = {
      deliveryZone: {
        findMany: jest.fn(),
      },
    };

    service = new PublicCheckoutComputationService(
      contextService as unknown as PublicOrderingContextService,
    );
  });

  it('recalculates subtotal, delivery fee and total on quote', async () => {
    contextService.loadProductMap.mockResolvedValue(
      new Map([['product-1', product]]),
    );
    db.deliveryZone.findMany.mockResolvedValue([
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

    const result = await service.buildCheckout(unit as any, input, db as any, {
      now: new Date(),
      dayOfWeek: 1,
      minutesOfDay: 720,
    });

    expect(result.subtotal).toBe(50);
    expect(result.delivery.fee).toBe(8);
    expect(result.total).toBe(58);
    expect(result.delivery.zoneName).toBe('Centro');
  });

  it('rejects unavailable product for delivery', async () => {
    contextService.loadProductMap.mockResolvedValue(
      new Map([
        [
          'product-1',
          {
            ...product,
            isAvailableForDelivery: false,
          },
        ],
      ]),
    );

    await expect(
      service.buildCheckout(unit as any, input, db as any, {
        now: new Date(),
        dayOfWeek: 1,
        minutesOfDay: 720,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
