import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FulfillmentMethod } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../../common/models/request-scope.model';
import { CreateProductInput, UpdateProductInput } from '../dto';
import { ProductMenuCacheService } from './product-menu-cache.service';
import { ProductsMutationService } from './products-mutation.service';
import { ProductsQueryService } from './products-query.service';

describe('ProductsMutationService', () => {
  let service: ProductsMutationService;
  let prisma: {
    product: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    category: {
      findFirst: jest.Mock;
    };
    orderItem: {
      count: jest.Mock;
    };
    productVariant: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    productOptionGroup: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    productOption: {
      deleteMany: jest.Mock;
    };
    productPrice: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    productAvailabilityWindow: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let queryService: {
    getById: jest.Mock;
  };
  let menuCache: {
    invalidatePublicMenu: jest.Mock;
  };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    prisma = {
      product: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
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

    queryService = {
      getById: jest.fn(),
    };

    menuCache = {
      invalidatePublicMenu: jest.fn(),
    };

    service = new ProductsMutationService(
      prisma as unknown as PrismaService,
      queryService as unknown as ProductsQueryService,
      menuCache as unknown as ProductMenuCacheService,
    );
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

    it('creates product with nested relations and refreshes the public menu cache', async () => {
      prisma.product.create.mockResolvedValue({ id: 'product-rich' });
      queryService.getById.mockResolvedValue({ id: 'product-rich' });

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
        availabilityWindows: [
          {
            fulfillmentType: FulfillmentMethod.TAKEAWAY,
            dayOfWeek: 1,
            startsAtMinutes: 600,
            endsAtMinutes: 900,
          },
        ],
      } as CreateProductInput);

      expect(result).toEqual({ id: 'product-rich' });
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Burger',
            variants: expect.objectContaining({
              create: [
                expect.objectContaining({
                  name: 'Duplo',
                  isDefault: true,
                }),
              ],
            }),
            optionGroups: expect.objectContaining({
              create: [
                expect.objectContaining({
                  name: 'Adicionais',
                }),
              ],
            }),
            prices: expect.objectContaining({
              create: [
                expect.objectContaining({
                  name: 'Promocao',
                }),
              ],
            }),
            availabilityWindows: expect.objectContaining({
              create: [
                expect.objectContaining({
                  fulfillmentType: FulfillmentMethod.TAKEAWAY,
                }),
              ],
            }),
          }),
        }),
      );
      expect(menuCache.invalidatePublicMenu).toHaveBeenCalledWith('unit-1');
      expect(queryService.getById).toHaveBeenCalledWith(scope, 'product-rich');
    });
  });

  describe('update', () => {
    it('throws NotFoundException when product does not exist', async () => {
      queryService.getById.mockRejectedValue(new NotFoundException());

      await expect(
        service.update(scope, 'product-1', {
          name: 'Updated',
        } as UpdateProductInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('validates configuration before touching the database', async () => {
      queryService.getById.mockResolvedValue({ id: 'product-1' });

      await expect(
        service.update(scope, 'product-1', {
          variants: [
            { name: 'A', priceDelta: 1, isDefault: true },
            { name: 'B', priceDelta: 2, isDefault: true },
          ],
        } as UpdateProductInput),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.product.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('syncs nested relations inside a transaction when nested payloads are provided', async () => {
      queryService.getById
        .mockResolvedValueOnce({ id: 'product-1' })
        .mockResolvedValueOnce({ id: 'product-1', name: 'Updated' });
      prisma.productOptionGroup.findMany.mockResolvedValue([{ id: 'group-1' }]);
      prisma.$transaction.mockImplementation(async (callback) =>
        callback({
          product: prisma.product,
          productVariant: prisma.productVariant,
          productOptionGroup: prisma.productOptionGroup,
          productOption: prisma.productOption,
          productPrice: prisma.productPrice,
          productAvailabilityWindow: prisma.productAvailabilityWindow,
        }),
      );

      const result = await service.update(scope, 'product-1', {
        name: ' Updated ',
        variants: [{ name: 'Duplo', priceDelta: 8, isDefault: true }],
        optionGroups: [
          {
            name: 'Adicionais',
            options: [{ name: 'Bacon', priceDelta: 4 }],
          },
        ],
        prices: [{ name: 'Promocao', price: 22 }],
        availabilityWindows: [
          {
            fulfillmentType: FulfillmentMethod.DELIVERY,
            dayOfWeek: 5,
            startsAtMinutes: 660,
            endsAtMinutes: 900,
          },
        ],
      } as UpdateProductInput);

      expect(result).toEqual({ id: 'product-1', name: 'Updated' });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: expect.objectContaining({
            name: 'Updated',
          }),
        }),
      );
      expect(prisma.productVariant.createMany).toHaveBeenCalled();
      expect(prisma.productOption.deleteMany).toHaveBeenCalled();
      expect(prisma.productOptionGroup.create).toHaveBeenCalled();
      expect(prisma.productPrice.createMany).toHaveBeenCalled();
      expect(prisma.productAvailabilityWindow.createMany).toHaveBeenCalled();
      expect(menuCache.invalidatePublicMenu).toHaveBeenCalledWith('unit-1');
    });
  });

  describe('remove', () => {
    it('deactivates product when order items reference it', async () => {
      queryService.getById.mockResolvedValue({ id: 'product-1' });
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
      queryService.getById.mockResolvedValue({ id: 'product-1' });
      prisma.orderItem.count.mockResolvedValue(0);
      prisma.productOptionGroup.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (callback) =>
        callback({
          product: prisma.product,
          productVariant: prisma.productVariant,
          productOptionGroup: prisma.productOptionGroup,
          productOption: prisma.productOption,
          productPrice: prisma.productPrice,
          productAvailabilityWindow: prisma.productAvailabilityWindow,
        }),
      );
      prisma.product.delete.mockResolvedValue({});

      const result = await service.remove(scope, 'product-1');

      expect(result).toEqual({ success: true, mode: 'hard-delete' });
      expect(prisma.product.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'product-1' } }),
      );
      expect(menuCache.invalidatePublicMenu).toHaveBeenCalledWith('unit-1');
    });
  });
});
