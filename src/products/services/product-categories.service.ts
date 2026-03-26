import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Messages } from '../../common/i18n/messages';
import { RequestScope } from '../../common/models/request-scope.model';
import {
  CategoryDetailsResponseDto,
  CreateCategoryInput,
  ProductCategorySummaryResponseDto,
  UpdateCategoryInput,
} from '../dto';
import {
  categoryDetailsSelect,
  categorySummarySelect,
  mapCategoryDetails,
} from '../helpers';
import { ProductMenuCacheService } from './product-menu-cache.service';

@Injectable()
export class ProductCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuCache: ProductMenuCacheService,
  ) {}

  async categoriesSummary(
    scope: RequestScope,
  ): Promise<ProductCategorySummaryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        unitId: scope.unitId,
      },
      ...categorySummarySelect,
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return categories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      productsCount: category._count.products,
      activeProductsCount: category.products.length,
    }));
  }

  async listCategories(
    scope: RequestScope,
  ): Promise<CategoryDetailsResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        unitId: scope.unitId,
      },
      ...categoryDetailsSelect,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map(mapCategoryDetails);
  }

  async getCategoryById(
    scope: RequestScope,
    id: string,
  ): Promise<CategoryDetailsResponseDto> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        unitId: scope.unitId,
      },
      ...categoryDetailsSelect,
    });

    if (!category) {
      throw new NotFoundException(Messages.CATEGORY_NOT_FOUND);
    }

    return mapCategoryDetails(category);
  }

  async createCategory(
    scope: RequestScope,
    input: CreateCategoryInput,
  ): Promise<CategoryDetailsResponseDto> {
    const category = await this.prisma.category.create({
      data: {
        unitId: scope.unitId,
        name: input.name.trim(),
        sortOrder: input.sortOrder ?? 0,
      },
      select: {
        id: true,
      },
    });

    await this.menuCache.invalidatePublicMenu(scope.unitId);

    return this.getCategoryById(scope, category.id);
  }

  async updateCategory(
    scope: RequestScope,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryDetailsResponseDto> {
    await this.getCategoryById(scope, id);

    await this.prisma.category.update({
      where: {
        id,
      },
      data: {
        name: input.name?.trim(),
        sortOrder: input.sortOrder,
      },
    });

    await this.menuCache.invalidatePublicMenu(scope.unitId);

    return this.getCategoryById(scope, id);
  }

  async removeCategory(
    scope: RequestScope,
    id: string,
  ): Promise<{ success: true }> {
    await this.getCategoryById(scope, id);

    const linkedProducts = await this.prisma.product.count({
      where: {
        unitId: scope.unitId,
        categoryId: id,
      },
    });

    if (linkedProducts > 0) {
      throw new BadRequestException(
        'Nao e possivel remover uma categoria com produtos vinculados.',
      );
    }

    await this.prisma.category.delete({
      where: {
        id,
      },
    });

    await this.menuCache.invalidatePublicMenu(scope.unitId);

    return { success: true };
  }
}
