import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../../common/models/request-scope.model';
import { ProductMenuCacheService } from './product-menu-cache.service';
import { ProductCategoriesService } from './product-categories.service';

describe('ProductCategoriesService', () => {
  let service: ProductCategoriesService;
  let prisma: {
    category: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    product: {
      count: jest.Mock;
    };
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
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        count: jest.fn(),
      },
    };

    menuCache = {
      invalidatePublicMenu: jest.fn(),
    };

    service = new ProductCategoriesService(
      prisma as unknown as PrismaService,
      menuCache as unknown as ProductMenuCacheService,
    );
  });

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

  it('throws NotFoundException when category is not found', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(service.getCategoryById(scope, 'category-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a category and invalidates the public menu cache', async () => {
    prisma.category.create.mockResolvedValue({ id: 'category-1' });
    prisma.category.findFirst.mockResolvedValue({
      id: 'category-1',
      name: 'Burgers',
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { products: 0 },
      products: [],
    });

    const result = await service.createCategory(scope, {
      name: '  Burgers  ',
      sortOrder: 3,
    });

    expect(result.name).toBe('Burgers');
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          unitId: 'unit-1',
          name: 'Burgers',
          sortOrder: 3,
        },
      }),
    );
    expect(menuCache.invalidatePublicMenu).toHaveBeenCalledWith('unit-1');
  });

  it('blocks category removal when linked products exist', async () => {
    prisma.category.findFirst.mockResolvedValue({
      id: 'category-1',
      name: 'Burgers',
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { products: 1 },
      products: [{ id: 'product-1' }],
    });
    prisma.product.count.mockResolvedValue(1);

    await expect(service.removeCategory(scope, 'category-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.category.delete).not.toHaveBeenCalled();
  });
});
