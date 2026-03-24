import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { Messages } from '../common/i18n/messages';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { CategoryDetailsResponseDto } from './dto/category-details.response';
import { ProductCategorySummaryResponseDto } from './dto/category-summary.response';
import { CreateCategoryInput } from './dto/create-category.input';
import { CreateProductInput } from './dto/create-product.input';
import { CreateProductOptionGroupInput } from './dto/product-option-group.input';
import { CreateProductPriceInput } from './dto/product-price.input';
import { CreateProductVariantInput } from './dto/product-variant.input';
import {
  ProductDetailsResponseDto,
  ProductOptionGroupResponseDto,
  ProductOptionResponseDto,
  ProductPriceResponseDto,
  ProductVariantResponseDto,
} from './dto/product-details.response';
import { ProductListItemResponseDto } from './dto/product-list-item.response';
import { ProductsListQueryDto } from './dto/products-list.query';
import { UpdateCategoryInput } from './dto/update-category.input';
import { UpdateProductInput } from './dto/update-product.input';

type ProductDetailsRow = {
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
  variants: Array<{
    id: string;
    name: string;
    sku: string | null;
    priceDelta: Prisma.Decimal;
    isDefault: boolean;
  }>;
  optionGroups: Array<{
    id: string;
    name: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    sortOrder: number;
    options: Array<{
      id: string;
      name: string;
      priceDelta: Prisma.Decimal;
      isActive: boolean;
    }>;
  }>;
  prices: Array<{
    id: string;
    name: string;
    price: Prisma.Decimal;
    startsAt: Date | null;
    endsAt: Date | null;
  }>;
};

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
    const now = new Date();

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
          prices: {
            select: {
              price: true,
              startsAt: true,
              endsAt: true,
            },
            orderBy: [{ startsAt: 'desc' }, { price: 'asc' }],
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
      const salePrice = this.resolveSalePrice(
        product.basePrice,
        product.prices,
        now,
      );
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

  async listCategories(
    scope: RequestScope,
  ): Promise<CategoryDetailsResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        unitId: scope.unitId,
      },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
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
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map((category) => this.mapCategoryDetails(category));
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
      select: {
        id: true,
        name: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
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
    });

    if (!category) {
      throw new NotFoundException(Messages.CATEGORY_NOT_FOUND);
    }

    return this.mapCategoryDetails(category);
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

    return { success: true };
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
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            priceDelta: true,
            isDefault: true,
          },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        },
        optionGroups: {
          select: {
            id: true,
            name: true,
            minSelect: true,
            maxSelect: true,
            isRequired: true,
            sortOrder: true,
            options: {
              select: {
                id: true,
                name: true,
                priceDelta: true,
                isActive: true,
              },
              orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        prices: {
          select: {
            id: true,
            name: true,
            price: true,
            startsAt: true,
            endsAt: true,
          },
          orderBy: [{ startsAt: 'desc' }, { price: 'asc' }],
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
    this.validateProductConfiguration(input);

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
        variants:
          input.variants && input.variants.length > 0
            ? {
                create: this.mapVariantCreateInput(input.variants),
              }
            : undefined,
        optionGroups:
          input.optionGroups && input.optionGroups.length > 0
            ? {
                create: this.mapOptionGroupCreateInput(input.optionGroups),
              }
            : undefined,
        prices:
          input.prices && input.prices.length > 0
            ? {
                create: this.mapPriceCreateInput(input.prices),
              }
            : undefined,
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
    this.validateProductConfiguration(input);

    const baseData: Prisma.ProductUncheckedUpdateInput = {
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
    };

    const hasNestedUpdates =
      input.variants !== undefined ||
      input.optionGroups !== undefined ||
      input.prices !== undefined;

    if (!hasNestedUpdates) {
      await this.prisma.product.update({
        where: { id },
        data: baseData,
      });

      return this.getById(scope, id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: baseData,
      });

      if (input.variants !== undefined) {
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        if (input.variants.length > 0) {
          await tx.productVariant.createMany({
            data: this.mapVariantCreateManyInput(id, input.variants),
          });
        }
      }

      if (input.optionGroups !== undefined) {
        const existingGroupIds = await tx.productOptionGroup.findMany({
          where: { productId: id },
          select: { id: true },
        });

        if (existingGroupIds.length > 0) {
          await tx.productOption.deleteMany({
            where: {
              optionGroupId: {
                in: existingGroupIds.map((group) => group.id),
              },
            },
          });
        }

        await tx.productOptionGroup.deleteMany({
          where: { productId: id },
        });

        for (const group of this.mapOptionGroupCreateInput(
          input.optionGroups,
        )) {
          await tx.productOptionGroup.create({
            data: {
              productId: id,
              name: group.name,
              minSelect: group.minSelect,
              maxSelect: group.maxSelect,
              isRequired: group.isRequired,
              sortOrder: group.sortOrder,
              options: group.options,
            },
          });
        }
      }

      if (input.prices !== undefined) {
        await tx.productPrice.deleteMany({
          where: { productId: id },
        });

        if (input.prices.length > 0) {
          await tx.productPrice.createMany({
            data: this.mapPriceCreateManyInput(id, input.prices),
          });
        }
      }
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

    await this.prisma.$transaction(async (tx) => {
      const existingGroupIds = await tx.productOptionGroup.findMany({
        where: { productId: id },
        select: { id: true },
      });

      if (existingGroupIds.length > 0) {
        await tx.productOption.deleteMany({
          where: {
            optionGroupId: {
              in: existingGroupIds.map((group) => group.id),
            },
          },
        });
      }

      await tx.productPrice.deleteMany({
        where: { productId: id },
      });
      await tx.productVariant.deleteMany({
        where: { productId: id },
      });
      await tx.productOptionGroup.deleteMany({
        where: { productId: id },
      });
      await tx.product.delete({
        where: { id },
      });
    });

    return {
      success: true,
      mode: 'hard-delete',
    };
  }

  private mapProductDetails(
    product: ProductDetailsRow,
  ): ProductDetailsResponseDto {
    const salePrice = this.resolveSalePrice(product.basePrice, product.prices);
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
      basePrice: decimalToNumberOrZero(product.basePrice),
      salePrice,
      costPrice: cost,
      margin,
      marginPercentage,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      variants: product.variants.map(
        (variant): ProductVariantResponseDto => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          priceDelta: decimalToNumberOrZero(variant.priceDelta),
          isDefault: variant.isDefault,
        }),
      ),
      optionGroups: product.optionGroups.map(
        (group): ProductOptionGroupResponseDto => ({
          id: group.id,
          name: group.name,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          isRequired: group.isRequired,
          sortOrder: group.sortOrder,
          options: group.options.map(
            (option): ProductOptionResponseDto => ({
              id: option.id,
              name: option.name,
              priceDelta: decimalToNumberOrZero(option.priceDelta),
              isActive: option.isActive,
            }),
          ),
        }),
      ),
      prices: product.prices.map(
        (price): ProductPriceResponseDto => ({
          id: price.id,
          name: price.name,
          price: decimalToNumberOrZero(price.price),
          startsAt: price.startsAt,
          endsAt: price.endsAt,
        }),
      ),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private mapCategoryDetails(category: {
    id: string;
    name: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    _count: { products: number };
    products: Array<{ id: string }>;
  }): CategoryDetailsResponseDto {
    return {
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      productsCount: category._count.products,
      activeProductsCount: category.products.length,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private resolveSalePrice(
    basePrice: Prisma.Decimal,
    prices: Array<{
      price: Prisma.Decimal;
      startsAt: Date | null;
      endsAt: Date | null;
    }>,
    referenceDate: Date = new Date(),
  ): number {
    const activeScheduledPrice = prices.find((price) => {
      const startsAt = price.startsAt?.getTime() ?? Number.NEGATIVE_INFINITY;
      const endsAt = price.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const reference = referenceDate.getTime();
      return reference >= startsAt && reference <= endsAt;
    });

    return decimalToNumberOrZero(activeScheduledPrice?.price ?? basePrice);
  }

  private validateProductConfiguration(
    input: Pick<UpdateProductInput, 'variants' | 'optionGroups' | 'prices'>,
  ): void {
    if (input.variants) {
      const defaultVariants = input.variants.filter(
        (variant) => variant.isDefault,
      );

      if (defaultVariants.length > 1) {
        throw new BadRequestException(
          'Apenas uma variante pode ser marcada como padrao.',
        );
      }
    }

    if (input.optionGroups) {
      for (const group of input.optionGroups) {
        const minSelect = group.minSelect ?? 0;
        const maxSelect = group.maxSelect ?? 1;

        if (minSelect > maxSelect) {
          throw new BadRequestException(
            'O minimo de selecoes nao pode ser maior que o maximo.',
          );
        }
      }
    }

    if (input.prices) {
      for (const price of input.prices) {
        const startsAt = price.startsAt ? new Date(price.startsAt) : null;
        const endsAt = price.endsAt ? new Date(price.endsAt) : null;

        if (
          startsAt &&
          endsAt &&
          Number.isFinite(startsAt.getTime()) &&
          Number.isFinite(endsAt.getTime()) &&
          endsAt <= startsAt
        ) {
          throw new BadRequestException(
            'A data final do preco precisa ser posterior a data inicial.',
          );
        }
      }
    }
  }

  private mapVariantCreateInput(
    variants: CreateProductVariantInput[],
  ): Prisma.ProductVariantCreateWithoutProductInput[] {
    return variants.map((variant) => ({
      name: variant.name.trim(),
      sku: variant.sku?.trim(),
      priceDelta: new Prisma.Decimal(variant.priceDelta.toFixed(2)),
      isDefault: variant.isDefault ?? false,
    }));
  }

  private mapVariantCreateManyInput(
    productId: string,
    variants: CreateProductVariantInput[],
  ): Prisma.ProductVariantCreateManyInput[] {
    return variants.map((variant) => ({
      productId,
      name: variant.name.trim(),
      sku: variant.sku?.trim(),
      priceDelta: new Prisma.Decimal(variant.priceDelta.toFixed(2)),
      isDefault: variant.isDefault ?? false,
    }));
  }

  private mapOptionGroupCreateInput(
    optionGroups: CreateProductOptionGroupInput[],
  ): Prisma.ProductOptionGroupCreateWithoutProductInput[] {
    return optionGroups.map((group) => ({
      name: group.name.trim(),
      minSelect: group.minSelect ?? 0,
      maxSelect: group.maxSelect ?? 1,
      isRequired: group.isRequired ?? false,
      sortOrder: group.sortOrder ?? 0,
      options: {
        create: group.options.map((option) => ({
          name: option.name.trim(),
          priceDelta: new Prisma.Decimal(option.priceDelta.toFixed(2)),
          isActive: option.isActive ?? true,
        })),
      },
    }));
  }

  private mapPriceCreateInput(
    prices: CreateProductPriceInput[],
  ): Prisma.ProductPriceCreateWithoutProductInput[] {
    return prices.map((price) => ({
      name: price.name.trim(),
      price: new Prisma.Decimal(price.price.toFixed(2)),
      startsAt: price.startsAt ? new Date(price.startsAt) : undefined,
      endsAt: price.endsAt ? new Date(price.endsAt) : undefined,
    }));
  }

  private mapPriceCreateManyInput(
    productId: string,
    prices: CreateProductPriceInput[],
  ): Prisma.ProductPriceCreateManyInput[] {
    return prices.map((price) => ({
      productId,
      name: price.name.trim(),
      price: new Prisma.Decimal(price.price.toFixed(2)),
      startsAt: price.startsAt ? new Date(price.startsAt) : undefined,
      endsAt: price.endsAt ? new Date(price.endsAt) : undefined,
    }));
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
