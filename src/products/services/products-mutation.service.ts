import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { Messages } from '../../common/i18n/messages';
import { RequestScope } from '../../common/models/request-scope.model';
import {
  CreateProductInput,
  ProductDetailsResponseDto,
  UpdateProductInput,
} from '../dto';
import {
  buildProductCreateData,
  buildProductUpdateData,
  mapAvailabilityWindowCreateManyInput,
  mapOptionGroupCreateInput,
  mapPriceCreateManyInput,
  mapVariantCreateManyInput,
  validateProductConfiguration,
} from '../helpers';
import { ProductMenuCacheService } from './product-menu-cache.service';
import { ProductsQueryService } from './products-query.service';

type ProductTransaction = Prisma.TransactionClient;

@Injectable()
export class ProductsMutationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryService: ProductsQueryService,
    private readonly menuCache: ProductMenuCacheService,
  ) {}

  async create(
    scope: RequestScope,
    input: CreateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    await this.assertCategory(scope.unitId, input.categoryId);
    validateProductConfiguration(input);

    const created = await this.prisma.product.create({
      data: buildProductCreateData(scope.unitId, input),
      select: {
        id: true,
      },
    });

    await this.menuCache.invalidatePublicMenu(scope.unitId);

    return this.queryService.getById(scope, created.id);
  }

  async update(
    scope: RequestScope,
    id: string,
    input: UpdateProductInput,
  ): Promise<ProductDetailsResponseDto> {
    await this.queryService.getById(scope, id);
    await this.assertCategory(scope.unitId, input.categoryId);
    validateProductConfiguration(input);

    const baseData = buildProductUpdateData(input);
    const hasNestedUpdates =
      input.variants !== undefined ||
      input.optionGroups !== undefined ||
      input.prices !== undefined ||
      input.availabilityWindows !== undefined;

    if (!hasNestedUpdates) {
      await this.prisma.product.update({
        where: { id },
        data: baseData,
      });

      await this.menuCache.invalidatePublicMenu(scope.unitId);

      return this.queryService.getById(scope, id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: baseData,
      });

      await this.syncVariants(tx, id, input.variants);
      await this.syncOptionGroups(tx, id, input.optionGroups);
      await this.syncPrices(tx, id, input.prices);
      await this.syncAvailabilityWindows(tx, id, input.availabilityWindows);
    });

    await this.menuCache.invalidatePublicMenu(scope.unitId);

    return this.queryService.getById(scope, id);
  }

  async remove(
    scope: RequestScope,
    id: string,
  ): Promise<{ success: true; mode: 'hard-delete' | 'deactivated' }> {
    await this.queryService.getById(scope, id);

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

      await this.menuCache.invalidatePublicMenu(scope.unitId);

      return {
        success: true,
        mode: 'deactivated',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await this.deleteNestedRelations(tx, id);
      await tx.product.delete({
        where: { id },
      });
    });

    await this.menuCache.invalidatePublicMenu(scope.unitId);

    return {
      success: true,
      mode: 'hard-delete',
    };
  }

  private async syncVariants(
    tx: ProductTransaction,
    productId: string,
    variants: UpdateProductInput['variants'],
  ): Promise<void> {
    if (variants === undefined) {
      return;
    }

    await tx.productVariant.deleteMany({
      where: { productId },
    });

    if (variants.length > 0) {
      await tx.productVariant.createMany({
        data: mapVariantCreateManyInput(productId, variants),
      });
    }
  }

  private async syncOptionGroups(
    tx: ProductTransaction,
    productId: string,
    optionGroups: UpdateProductInput['optionGroups'],
  ): Promise<void> {
    if (optionGroups === undefined) {
      return;
    }

    await this.deleteNestedOptions(tx, productId);

    await tx.productOptionGroup.deleteMany({
      where: { productId },
    });

    for (const group of mapOptionGroupCreateInput(optionGroups)) {
      await tx.productOptionGroup.create({
        data: {
          productId,
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

  private async syncPrices(
    tx: ProductTransaction,
    productId: string,
    prices: UpdateProductInput['prices'],
  ): Promise<void> {
    if (prices === undefined) {
      return;
    }

    await tx.productPrice.deleteMany({
      where: { productId },
    });

    if (prices.length > 0) {
      await tx.productPrice.createMany({
        data: mapPriceCreateManyInput(productId, prices),
      });
    }
  }

  private async syncAvailabilityWindows(
    tx: ProductTransaction,
    productId: string,
    availabilityWindows: UpdateProductInput['availabilityWindows'],
  ): Promise<void> {
    if (availabilityWindows === undefined) {
      return;
    }

    await tx.productAvailabilityWindow.deleteMany({
      where: { productId },
    });

    if (availabilityWindows.length > 0) {
      await tx.productAvailabilityWindow.createMany({
        data: mapAvailabilityWindowCreateManyInput(
          productId,
          availabilityWindows,
        ),
      });
    }
  }

  private async deleteNestedRelations(
    tx: ProductTransaction,
    productId: string,
  ): Promise<void> {
    await this.deleteNestedOptions(tx, productId);

    await tx.productPrice.deleteMany({
      where: { productId },
    });
    await tx.productAvailabilityWindow.deleteMany({
      where: { productId },
    });
    await tx.productVariant.deleteMany({
      where: { productId },
    });
    await tx.productOptionGroup.deleteMany({
      where: { productId },
    });
  }

  private async deleteNestedOptions(
    tx: ProductTransaction,
    productId: string,
  ): Promise<void> {
    const existingGroupIds = await tx.productOptionGroup.findMany({
      where: { productId },
      select: { id: true },
    });

    if (existingGroupIds.length === 0) {
      return;
    }

    await tx.productOption.deleteMany({
      where: {
        optionGroupId: {
          in: existingGroupIds.map((group) => group.id),
        },
      },
    });
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
