import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { MemoryCacheService } from '../../common/services/memory-cache.service';
import {
  PUBLIC_CATALOG_PRODUCT_SELECT,
  PUBLIC_MENU_CACHE_TTL_MS,
  PUBLIC_MENU_CATEGORY_SELECT,
  getTimeContext,
  mapPublicProduct,
  mapPublicStore,
} from '../helpers';
import { PublicMenuCategoryResponseDto, PublicMenuResponseDto } from '../dto';
import { PublicOrderingContextService } from './public-ordering-context.service';

@Injectable()
export class PublicMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
    private readonly contextService: PublicOrderingContextService,
  ) {}

  async getPublicMenu(unitSlug: string): Promise<PublicMenuResponseDto> {
    const cacheKey = `public-menu:${unitSlug}`;
    const cached = this.cache.get<PublicMenuResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const unit = await this.contextService.getUnitBySlug(unitSlug);

    if (!unit.publicMenuEnabled) {
      throw new NotFoundException(
        'Cardapio publico indisponivel para esta unidade.',
      );
    }

    const timeContext = getTimeContext(unit.orderingTimeZone);
    const [categories, uncategorizedProducts] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          unitId: unit.id,
          products: {
            some: {
              isActive: true,
            },
          },
        },
        select: PUBLIC_MENU_CATEGORY_SELECT,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.product.findMany({
        where: {
          unitId: unit.id,
          categoryId: null,
          isActive: true,
        },
        select: PUBLIC_CATALOG_PRODUCT_SELECT,
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    const categoryResponses: PublicMenuCategoryResponseDto[] = categories.map(
      (category) => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        products: category.products.map((product) =>
          mapPublicProduct(unit, product, timeContext),
        ),
      }),
    );

    if (uncategorizedProducts.length > 0) {
      categoryResponses.push({
        id: 'uncategorized',
        name: 'Sem categoria',
        sortOrder: 9999,
        products: uncategorizedProducts.map((product) =>
          mapPublicProduct(unit, product, timeContext),
        ),
      });
    }

    const response: PublicMenuResponseDto = {
      store: mapPublicStore(unit, timeContext),
      categories: categoryResponses,
      generatedAt: timeContext.now,
      cacheTtlSeconds: PUBLIC_MENU_CACHE_TTL_MS / 1000,
    };

    return this.cache.set(cacheKey, response, PUBLIC_MENU_CACHE_TTL_MS);
  }
}
