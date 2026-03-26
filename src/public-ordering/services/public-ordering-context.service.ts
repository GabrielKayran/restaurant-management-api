import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  ORDERING_UNIT_SELECT,
  OrderingUnitContext,
  ProductCatalogRow,
  PUBLIC_CATALOG_PRODUCT_SELECT,
} from '../helpers';
import { PrismaDb } from '../helpers';

@Injectable()
export class PublicOrderingContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getUnitBySlug(unitSlug: string): Promise<OrderingUnitContext> {
    const unit = await this.prisma.restaurantUnit.findFirst({
      where: {
        slug: unitSlug,
        isActive: true,
      },
      select: ORDERING_UNIT_SELECT,
    });

    if (!unit) {
      throw new NotFoundException('Unidade publica nao encontrada.');
    }

    return unit;
  }

  async loadProductMap(
    db: PrismaDb,
    unitId: string,
    productIds: string[],
  ): Promise<Map<string, ProductCatalogRow>> {
    const uniqueProductIds = [...new Set(productIds)];
    const products = await db.product.findMany({
      where: {
        unitId,
        id: {
          in: uniqueProductIds,
        },
      },
      select: PUBLIC_CATALOG_PRODUCT_SELECT,
    });

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException(
        'Um ou mais produtos sao invalidos para esta unidade.',
      );
    }

    return new Map(products.map((product) => [product.id, product]));
  }
}
