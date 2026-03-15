import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { Messages } from '../common/i18n/messages';
import { PaginationResponse } from '../common/pagination';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { ProductCategorySummaryResponseDto } from './dto/category-summary.response';
import { CreateProductInput } from './dto/create-product.input';
import { ProductDetailsResponseDto } from './dto/product-details.response';
import { ProductListItemResponseDto } from './dto/product-list-item.response';
import { ProductsListQueryDto } from './dto/products-list.query';
import { UpdateProductInput } from './dto/update-product.input';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    scope: RequestScope,
    query: ProductsListQueryDto,
  ): Promise<PaginationResponse<ProductListItemResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      unitId: scope.unitId,
      ...(query.search
        ? {
            name: {
              contains: query.search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(typeof query.isActive === 'boolean'
        ? { isActive: query.isActive }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          basePrice: true,
          costPrice: true,
          isActive: true,
          category: {
            select: {
              name: true,
            },
          },
          recipe: {
            select: {
              items: {
                select: {
                  quantity: true,
                  ingredient: {
                    select: {
                      stockItems: {
                        where: {
                          unitId: scope.unitId,
                        },
                        select: {
                          currentQuantity: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = products.map((product) => {
      const salePrice = decimalToNumberOrZero(product.basePrice);
      const cost = product.costPrice
        ? decimalToNumberOrZero(product.costPrice)
        : null;
      const margin =
        cost === null ? null : Number((salePrice - cost).toFixed(2));
      const marginPercentage =
        margin === null || salePrice === 0
          ? null
          : Number(((margin / salePrice) * 100).toFixed(2));

      let stock: number | null = null;
      if (product.recipe?.items?.length) {
        const maxUnitsByIngredient = product.recipe.items
          .map((item) => {
            const stockQty = decimalToNumberOrZero(
              item.ingredient.stockItems[0]?.currentQuantity ?? null,
            );
            const ingredientPerProduct = decimalToNumberOrZero(item.quantity);

            if (ingredientPerProduct <= 0) {
              return Number.POSITIVE_INFINITY;
            }

            return Math.floor(stockQty / ingredientPerProduct);
          })
          .filter((value) => Number.isFinite(value));

        stock = maxUnitsByIngredient.length
          ? Math.min(...maxUnitsByIngredient)
          : null;
      }

      return {
        id: product.id,
        name: product.name,
        category: product.category?.name ?? null,
        salePrice,
        cost,
        margin,
        marginPercentage,
        stock,
        isActive: product.isActive,
      };
    });

    return new PaginationResponse(data, total, page, limit);
  }

  async categoriesSummary(
    scope: RequestScope,
  ): Promise<ProductCategorySummaryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        unitId: scope.unitId,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true,
          },
        },
        products: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
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

  async getById(
    scope: RequestScope,
    id: string,
  ): Promise<ProductDetailsResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        unitId: scope.unitId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        sku: true,
        basePrice: true,
        costPrice: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(Messages.PRODUCT_NOT_FOUND);
    }

    return this.mapProductDetails(product);
  }

  async create(
    scope: RequestScope,
    input: CreateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    await this.assertCategory(scope.unitId, input.categoryId);

    const created = await this.prisma.product.create({
      data: {
        unitId: scope.unitId,
        categoryId: input.categoryId,
        name: input.name.trim(),
        description: input.description?.trim(),
        sku: input.sku?.trim(),
        basePrice: new Prisma.Decimal(input.basePrice.toFixed(2)),
        costPrice:
          typeof input.costPrice === 'number'
            ? new Prisma.Decimal(input.costPrice.toFixed(2))
            : undefined,
        imageUrl: input.imageUrl?.trim(),
        isActive: input.isActive ?? true,
      },
      select: {
        id: true,
      },
    });

    return this.getById(scope, created.id);
  }

  async update(
    scope: RequestScope,
    id: string,
    input: UpdateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    await this.getById(scope, id);
    await this.assertCategory(scope.unitId, input.categoryId);

    await this.prisma.product.update({
      where: { id },
      data: {
        categoryId: input.categoryId,
        name: input.name?.trim(),
        description: input.description?.trim(),
        sku: input.sku?.trim(),
        basePrice:
          typeof input.basePrice === 'number'
            ? new Prisma.Decimal(input.basePrice.toFixed(2))
            : undefined,
        costPrice:
          typeof input.costPrice === 'number'
            ? new Prisma.Decimal(input.costPrice.toFixed(2))
            : undefined,
        imageUrl: input.imageUrl?.trim(),
        isActive: input.isActive,
      },
    });

    return this.getById(scope, id);
  }

  async remove(
    scope: RequestScope,
    id: string,
  ): Promise<{ success: true; mode: 'hard-delete' | 'deactivated' }> {
    await this.getById(scope, id);

    const orderItems = await this.prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          unitId: scope.unitId,
        },
      },
    });

    if (orderItems > 0) {
      await this.prisma.product.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      return {
        success: true,
        mode: 'deactivated',
      };
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      mode: 'hard-delete',
    };
  }

  private mapProductDetails(product: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    sku: string | null;
    basePrice: Prisma.Decimal;
    costPrice: Prisma.Decimal | null;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    category: { name: string } | null;
  }): ProductDetailsResponseDto {
    const salePrice = decimalToNumberOrZero(product.basePrice);
    const cost = product.costPrice
      ? decimalToNumberOrZero(product.costPrice)
      : null;
    const margin = cost === null ? null : Number((salePrice - cost).toFixed(2));
    const marginPercentage =
      margin === null || salePrice === 0
        ? null
        : Number(((margin / salePrice) * 100).toFixed(2));

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? null,
      sku: product.sku,
      basePrice: salePrice,
      costPrice: cost,
      margin,
      marginPercentage,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private async assertCategory(
    unitId: string,
    categoryId?: string,
  ): Promise<void> {
    if (!categoryId) {
      return;
    }

    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        unitId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new BadRequestException(Messages.CATEGORY_NOT_FOUND);
    }
  }
}
