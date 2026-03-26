import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { MemoryCacheService } from '../../common/services/memory-cache.service';
import { PublicMenuService } from './public-menu.service';
import { PublicOrderingContextService } from './public-ordering-context.service';

describe('PublicMenuService', () => {
  let service: PublicMenuService;
  let prisma: {
    category: { findMany: jest.Mock };
    product: { findMany: jest.Mock };
  };
  let cache: { get: jest.Mock; set: jest.Mock };
  let contextService: { getUnitBySlug: jest.Mock };

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

  beforeEach(() => {
    prisma = {
      category: { findMany: jest.fn() },
      product: { findMany: jest.fn() },
    };

    cache = {
      get: jest.fn(),
      set: jest.fn((_: string, value: unknown) => value),
    };

    contextService = {
      getUnitBySlug: jest.fn(),
    };

    service = new PublicMenuService(
      prisma as unknown as PrismaService,
      cache as unknown as MemoryCacheService,
      contextService as unknown as PublicOrderingContextService,
    );
  });

  it('returns cached menu when available', async () => {
    cache.get.mockReturnValue({ categories: [] });

    const result = await service.getPublicMenu('loja-centro');

    expect(result).toEqual({ categories: [] });
    expect(contextService.getUnitBySlug).not.toHaveBeenCalled();
  });

  it('builds menu with categorized and uncategorized products', async () => {
    contextService.getUnitBySlug.mockResolvedValue(unit);
    prisma.category.findMany.mockResolvedValue([
      {
        id: 'category-1',
        name: 'Burgers',
        sortOrder: 0,
        products: [product],
      },
    ]);
    prisma.product.findMany.mockResolvedValue([product]);

    const result = await service.getPublicMenu('loja-centro');

    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].products[0].name).toBe('X-Burger');
    expect(result.categories[1].id).toBe('uncategorized');
    expect(cache.set).toHaveBeenCalled();
  });

  it('throws when the unit has public menu disabled', async () => {
    contextService.getUnitBySlug.mockResolvedValue({
      ...unit,
      publicMenuEnabled: false,
    });

    await expect(service.getPublicMenu('loja-centro')).rejects.toThrow(
      NotFoundException,
    );
  });
});
