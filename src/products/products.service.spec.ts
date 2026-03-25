import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { MemoryCacheService } from '../common/services/memory-cache.service';
import { RequestScope } from '../common/models/request-scope.model';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    category: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    restaurantUnit: { findUnique: jest.Mock };
    orderItem: { count: jest.Mock };
    productVariant: { deleteMany: jest.Mock; createMany: jest.Mock };
    productOptionGroup: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    productOption: { deleteMany: jest.Mock };
    productPrice: { deleteMany: jest.Mock; createMany: jest.Mock };
    productAvailabilityWindow: { deleteMany: jest.Mock; createMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let cache: { invalidate: jest.Mock };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  const mockProductRow = (
    overrides: Partial<{
      id: string;
      name: string;
      isActive: boolean;
      categoryId: string | null;
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
    id: overrides.id ?? 'product-1',
    name: overrides.name ?? 'Burger',
    description: null,
    categoryId: overrides.categoryId ?? null,
    sku: null,
    basePrice: new Prisma.Decimal('25.00'),
    costPrice: overrides.costPrice ?? null,
    prices: overrides.prices ?? [],
    imageUrl: null,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: overrides.categoryId ? { name: 'Burgers' } : null,
    variants: [],
    optionGroups: [],
    availabilityWindows: [],
    isAvailableForTakeaway: true,
    isAvailableForDelivery: true,
  });

  beforeEach(() => {
    prisma = {
      product: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      restaurantUnit: {
        findUnique: jest.fn().mockResolvedValue({ slug: 'loja-centro' }),
      },
      orderItem: {
        count: jest.fn(),
      },
      productVariant: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      productOptionGroup: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      productOption: {
        deleteMany: jest.fn(),
      },
      productPrice: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      productAvailabilityWindow: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    cache = {
      invalidate: jest.fn(),
    };

    service = new ProductsService(
      prisma as unknown as PrismaService,
      cache as unknown as MemoryCacheService,
    );
  });

  describe('getById', () => {
    it('throws NotFoundException when product does not exist in unit', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.getById(scope, 'product-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns product details with margin calculated', async () => {
      prisma.product.findFirst.mockResolvedValue(
        mockProductRow({ costPrice: new Prisma.Decimal('15.00') }),
      );

      const result = await service.getById(scope, 'product-1');

      expect(result.id).toBe('product-1');
      expect(result.basePrice).toBe(25);
      expect(result.costPrice).toBe(15);
      expect(result.margin).toBe(10);
      expect(result.marginPercentage).toBe(40);
    });

    it('returns null margin and marginPercentage when costPrice is not set', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProductRow());

      const result = await service.getById(scope, 'product-1');

      expect(result.costPrice).toBeNull();
      expect(result.margin).toBeNull();
      expect(result.marginPercentage).toBeNull();
    });
  });

  describe('create', () => {
    it('throws BadRequestException when category does not belong to unit', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create(scope, {
          name: 'Burger',
          basePrice: 25.9,
          categoryId: 'category-1',
          isActive: true,
        } as CreateProductInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates product when category is valid', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'category-1' });
      prisma.product.create.mockResolvedValue({ id: 'product-new' });
      prisma.product.findFirst.mockResolvedValue(
        mockProductRow({ id: 'product-new', categoryId: 'category-1' }),
      );

      const result = await service.create(scope, {
        name: 'Burger',
        basePrice: 25.9,
        categoryId: 'category-1',
        isActive: true,
      } as CreateProductInput);

      expect(result.id).toBe('product-new');
    });

    it('creates product with variants, option groups and scheduled prices', async () => {
      prisma.product.create.mockResolvedValue({ id: 'product-rich' });
      prisma.product.findFirst.mockResolvedValue(
        mockProductRow({
          id: 'product-rich',
          prices: [
            {
              id: 'price-1',
              name: 'Promocao',
              price: new Prisma.Decimal('22.00'),
              startsAt: null,
              endsAt: null,
            },
          ],
        }),
      );

      const result = await service.create(scope, {
        name: 'Burger',
        basePrice: 25.9,
        isActive: true,
        variants: [{ name: 'Duplo', priceDelta: 8, isDefault: true }],
        optionGroups: [
          {
            name: 'Adicionais',
            options: [{ name: 'Bacon', priceDelta: 4 }],
          },
        ],
        prices: [{ name: 'Promocao', price: 22 }],
      } as CreateProductInput);

      expect(result.id).toBe('product-rich');
      expect(prisma.product.create).toHaveBeenCalled();
    });

    it('creates product without category when categoryId is not provided', async () => {
      prisma.product.create.mockResolvedValue({ id: 'product-no-cat' });
      prisma.product.findFirst.mockResolvedValue(
        mockProductRow({ id: 'product-no-cat' }),
      );

      const result = await service.create(scope, {
        name: 'Generic',
        basePrice: 10,
        isActive: true,
      } as CreateProductInput);

      expect(prisma.category.findFirst).not.toHaveBeenCalled();
      expect(result.id).toBe('product-no-cat');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when product does not exist', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update(scope, 'product-1', {
          name: 'Updated',
        } as UpdateProductInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when new category does not belong to unit', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProductRow());
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.update(scope, 'product-1', {
          categoryId: 'bad-category',
        } as UpdateProductInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when product does not exist', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.remove(scope, 'product-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deactivates product when order items reference it', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProductRow());
      prisma.orderItem.count.mockResolvedValue(3);
      prisma.product.update.mockResolvedValue({});

      const result = await service.remove(scope, 'product-1');

      expect(result).toEqual({ success: true, mode: 'deactivated' });
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: { isActive: false },
        }),
      );
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });

    it('hard deletes product when no order items reference it', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProductRow());
      prisma.orderItem.count.mockResolvedValue(0);
      prisma.productOptionGroup.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (callback) =>
        callback({
          productOptionGroup: prisma.productOptionGroup,
          productOption: prisma.productOption,
          productPrice: prisma.productPrice,
          productAvailabilityWindow: prisma.productAvailabilityWindow,
          productVariant: prisma.productVariant,
          product: prisma.product,
        }),
      );
      prisma.product.delete.mockResolvedValue({});

      const result = await service.remove(scope, 'product-1');

      expect(result).toEqual({ success: true, mode: 'hard-delete' });
      expect(prisma.product.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'product-1' } }),
      );
    });
  });

  describe('categories', () => {
    it('lists categories ordered with product counters', async () => {
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'category-1',
          name: 'Hamburgueres',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { products: 2 },
          products: [{ id: 'product-1' }],
        },
      ]);

      const result = await service.listCategories(scope);

      expect(result[0].productsCount).toBe(2);
      expect(result[0].activeProductsCount).toBe(1);
    });
  });
});
