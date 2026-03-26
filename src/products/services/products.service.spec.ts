import { RequestScope } from '../../common/models/request-scope.model';
import { ProductCategoriesService } from './product-categories.service';
import { ProductsMutationService } from './products-mutation.service';
import { ProductsQueryService } from './products-query.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let queryService: {
    list: jest.Mock;
    getById: jest.Mock;
  };
  let mutationService: {
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let categoriesService: {
    categoriesSummary: jest.Mock;
    listCategories: jest.Mock;
    getCategoryById: jest.Mock;
    createCategory: jest.Mock;
    updateCategory: jest.Mock;
    removeCategory: jest.Mock;
  };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    queryService = {
      list: jest.fn(),
      getById: jest.fn(),
    };

    mutationService = {
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    categoriesService = {
      categoriesSummary: jest.fn(),
      listCategories: jest.fn(),
      getCategoryById: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      removeCategory: jest.fn(),
    };

    service = new ProductsService(
      queryService as unknown as ProductsQueryService,
      mutationService as unknown as ProductsMutationService,
      categoriesService as unknown as ProductCategoriesService,
    );
  });

  it('delegates product reads to ProductsQueryService', async () => {
    queryService.getById.mockResolvedValue({ id: 'product-1' });

    const result = await service.getById(scope, 'product-1');

    expect(result).toEqual({ id: 'product-1' });
    expect(queryService.getById).toHaveBeenCalledWith(scope, 'product-1');
  });

  it('delegates product writes to ProductsMutationService', async () => {
    mutationService.remove.mockResolvedValue({
      success: true,
      mode: 'deactivated',
    });

    const result = await service.remove(scope, 'product-1');

    expect(result).toEqual({ success: true, mode: 'deactivated' });
    expect(mutationService.remove).toHaveBeenCalledWith(scope, 'product-1');
  });

  it('delegates category operations to ProductCategoriesService', async () => {
    categoriesService.listCategories.mockResolvedValue([{ id: 'category-1' }]);

    const result = await service.listCategories(scope);

    expect(result).toEqual([{ id: 'category-1' }]);
    expect(categoriesService.listCategories).toHaveBeenCalledWith(scope);
  });
});
