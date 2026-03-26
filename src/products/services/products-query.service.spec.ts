import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../../common/models/request-scope.model';
import { ProductsListQueryDto } from '../dto';
import { ProductsQueryService } from './products-query.service';

describe('ProductsQueryService', () => {
  let service: ProductsQueryService;
  let prisma: {
    product: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  const mockProductRow = (
    overrides: Partial<{
      costPrice: Prisma.Decimal | null;
      prices: Array<{
        id: string;
        name: string;
        price: Prisma.Decimal;
        startsAt: Date | null;
        endsAt: Date | null;
      }>;
    }> = {},
  ) => ({
    id: 'product-1',
    name: 'Burger',
    description: null,
    categoryId: 'category-1',
    sku: null,
    basePrice: new Prisma.Decimal('25.00'),
    costPrice: overrides.costPrice ?? null,
    imageUrl: null,
    isActive: true,
    isAvailableForTakeaway: true,
    isAvailableForDelivery: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { name: 'Burgers' },
    variants: [],
    optionGroups: [],
    prices: overrides.prices ?? [],
    availabilityWindows: [],
  });

  beforeEach(() => {
    prisma = {
      product: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    service = new ProductsQueryService(prisma as unknown as PrismaService);
  });

  describe('getById', () => {
    it('throws NotFoundException when product does not exist in unit', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.getById(scope, 'product-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the active scheduled sale price and recalculates margin from it', async () => {
      prisma.product.findFirst.mockResolvedValue(
        mockProductRow({
          costPrice: new Prisma.Decimal('15.00'),
          prices: [
            {
              id: 'price-1',
              name: 'Lunch promo',
              price: new Prisma.Decimal('20.00'),
              startsAt: new Date('2026-03-25T00:00:00.000Z'),
              endsAt: new Date('2026-03-27T00:00:00.000Z'),
            },
          ],
        }),
      );

      const result = await service.getById(scope, 'product-1');

      expect(result.salePrice).toBe(20);
      expect(result.margin).toBe(5);
      expect(result.marginPercentage).toBe(25);
    });
  });

  describe('list', () => {
    it('builds filters and calculates financials and stock', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          name: 'Burger',
          basePrice: new Prisma.Decimal('25.00'),
          costPrice: new Prisma.Decimal('10.00'),
          isActive: true,
          category: { name: 'Burgers' },
          prices: [
            {
              price: new Prisma.Decimal('20.00'),
              startsAt: new Date('2026-03-25T00:00:00.000Z'),
              endsAt: new Date('2026-03-27T00:00:00.000Z'),
            },
          ],
          recipe: {
            items: [
              {
                quantity: new Prisma.Decimal('2.000'),
                ingredient: {
                  stockItems: [
                    {
                      currentQuantity: new Prisma.Decimal('10.000'),
                    },
                  ],
                },
              },
            ],
          },
        },
      ]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductsListQueryDto = {
        page: 2,
        limit: 5,
        search: 'burg',
        categoryId: 'category-1',
        isActive: true,
      };

      const result = await service.list(scope, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            unitId: 'unit-1',
            name: {
              contains: 'burg',
              mode: 'insensitive',
            },
            categoryId: 'category-1',
            isActive: true,
          },
          skip: 5,
          take: 5,
        }),
      );
      expect(result.data).toEqual([
        expect.objectContaining({
          id: 'product-1',
          salePrice: 20,
          cost: 10,
          margin: 10,
          marginPercentage: 50,
          stock: 5,
        }),
      ]);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(1);
    });
  });
});
