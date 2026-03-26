import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { Messages } from '../../common/i18n/messages';
import { RequestScope } from '../../common/models/request-scope.model';
import { PaginationResponse } from '../../common/pagination';
import {
  ProductDetailsResponseDto,
  ProductListItemResponseDto,
  ProductsListQueryDto,
} from '../dto';
import {
  buildProductListSelect,
  mapProductDetails,
  mapProductListItem,
  ProductListRow,
  productDetailsSelect,
} from '../helpers';

@Injectable()
export class ProductsQueryService {
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

    const [products, total] = (await Promise.all([
      this.prisma.product.findMany({
        where,
        select: buildProductListSelect(scope.unitId),
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ])) as unknown as [ProductListRow[], number];

    return new PaginationResponse(
      products.map((product) => mapProductListItem(product, now)),
      total,
      page,
      limit,
    );
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
      ...productDetailsSelect,
    });

    if (!product) {
      throw new NotFoundException(Messages.PRODUCT_NOT_FOUND);
    }

    return mapProductDetails(product);
  }
}
