import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import { Messages } from '../common/i18n/messages';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { resolveDateRange } from '../common/utils/date-range.util';
import { CreateOrderInput } from './dto/create-order.input';
import {
  CreateOrderItemInput,
  CreateOrderItemOptionInput,
} from './dto/create-order-item.input';
import {
  OrderDetailsResponseDto,
  OrderItemOptionResponseDto,
  OrderItemResponseDto,
} from './dto/order-details.response';
import { OrderListItemResponseDto } from './dto/order-list-item.response';
import { UpdateOrderStatusInput } from './dto/order-status.input';
import { OrdersListQueryDto } from './dto/orders-list.query';
import { UpdateOrderInput } from './dto/update-order.input';

type ProductRow = {
  id: string;
  name: string;
  basePrice: Prisma.Decimal;
  isActive: boolean;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    scope: RequestScope,
    query: OrdersListQueryDto,
  ): Promise<PaginationResponse<OrderListItemResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildOrderListWhere(scope, query);

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          type: true,
          total: true,
          createdAt: true,
          customer: { select: { name: true } },
          table: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return new PaginationResponse(
      items.map((item) => ({
        id: item.id,
        code: item.code,
        status: item.status,
        type: item.type,
        customerName: item.customer?.name ?? null,
        tableName: item.table?.name ?? null,
        itemsCount: item._count.items,
        total: decimalToNumberOrZero(item.total),
        createdAt: item.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async getById(
    scope: RequestScope,
    id: string,
  ): Promise<OrderDetailsResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, unitId: scope.unitId },
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        notes: true,
        createdAt: true,
        subtotal: true,
        discount: true,
        deliveryFee: true,
        total: true,
        customer: { select: { name: true } },
        table: { select: { name: true } },
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            notes: true,
            options: {
              select: {
                id: true,
                optionName: true,
                quantity: true,
                priceDelta: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
        statusHistory: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            reason: true,
            changedAt: true,
            changedByUserId: true,
          },
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(Messages.ORDER_NOT_FOUND);
    }

    return {
      id: order.id,
      code: order.code,
      type: order.type,
      status: order.status,
      customerName: order.customer?.name ?? null,
      tableName: order.table?.name ?? null,
      notes: order.notes ?? null,
      createdAt: order.createdAt,
      subtotal: decimalToNumberOrZero(order.subtotal),
      discount: decimalToNumberOrZero(order.discount),
      deliveryFee: decimalToNumberOrZero(order.deliveryFee),
      total: decimalToNumberOrZero(order.total),
      items: order.items.map(
        (item): OrderItemResponseDto => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName ?? null,
          quantity: item.quantity,
          unitPrice: decimalToNumberOrZero(item.unitPrice),
          totalPrice: decimalToNumberOrZero(item.totalPrice),
          notes: item.notes ?? null,
          options: item.options.map(
            (option): OrderItemOptionResponseDto => ({
              id: option.id,
              optionName: option.optionName,
              quantity: option.quantity,
              priceDelta: decimalToNumberOrZero(option.priceDelta),
            }),
          ),
        }),
      ),
      history: order.statusHistory,
    };
  }

  async create(
    scope: RequestScope,
    input: CreateOrderInput,
  ): Promise<OrderDetailsResponseDto> {
    if (!input.items?.length) {
      throw new BadRequestException(Messages.ORDER_MUST_HAVE_ITEMS);
    }

    if (input.type === OrderType.DINE_IN && !input.tableId) {
      throw new BadRequestException(Messages.DINE_IN_REQUIRES_TABLE);
    }

    const createdId = await this.prisma.$transaction(async (tx) => {
      const [lastOrder, productMap] = await Promise.all([
        tx.order.findFirst({
          where: { unitId: scope.unitId },
          orderBy: { code: 'desc' },
          select: { code: true },
        }),
        this.validateAndFetchProducts(tx, scope.unitId, input.items),
      ]);

      if (input.tableId) {
        await this.ensureTableInUnit(tx, input.tableId, scope.unitId);
      }

      const { itemData, subtotal } = await this.buildOrderItemsData(
        tx,
        input.items,
        productMap,
      );

      const createdOrder = await tx.order.create({
        data: {
          unitId: scope.unitId,
          customerId: input.customerId,
          tableId: input.tableId,
          addressId: input.addressId,
          courierId: input.courierId,
          createdByUserId: scope.userId,
          code: (lastOrder?.code ?? 0) + 1,
          type: input.type,
          status: OrderStatus.PENDING,
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          discount: new Prisma.Decimal(0),
          deliveryFee: new Prisma.Decimal(0),
          total: new Prisma.Decimal(subtotal.toFixed(2)),
          notes: input.notes,
          items: { create: itemData },
        },
        select: { id: true },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: createdOrder.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING,
          reason: 'Order created',
          changedByUserId: scope.userId,
        },
      });

      return createdOrder.id;
    });

    return this.getById(scope, createdId);
  }

  async update(
    scope: RequestScope,
    id: string,
    input: UpdateOrderInput,
  ): Promise<OrderDetailsResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, unitId: scope.unitId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException(Messages.ORDER_NOT_FOUND);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(Messages.CANCELLED_ORDER_UPDATE);
    }

    if ((input.type ?? null) === OrderType.DINE_IN && !input.tableId) {
      throw new BadRequestException(Messages.DINE_IN_REQUIRES_TABLE);
    }

    if (input.tableId) {
      await this.ensureTableInUnit(this.prisma, input.tableId, scope.unitId);
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        type: input.type,
        customerId: input.customerId,
        tableId: input.tableId,
        notes: input.notes,
      },
    });

    return this.getById(scope, id);
  }

  async updateStatus(
    scope: RequestScope,
    id: string,
    input: UpdateOrderStatusInput,
  ): Promise<OrderDetailsResponseDto> {
    const orderId = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, unitId: scope.unitId },
        select: { id: true, status: true },
      });

      if (!order) {
        throw new NotFoundException(Messages.ORDER_NOT_FOUND);
      }

      if (
        order.status === OrderStatus.CANCELLED &&
        input.status !== OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(Messages.CANCELLED_ORDER_STATUS);
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: input.status,
          ...this.resolveStatusTimestamps(input.status),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: input.status,
          reason: input.reason,
          changedByUserId: scope.userId,
        },
      });

      return order.id;
    });

    return this.getById(scope, orderId);
  }

  async cancel(
    scope: RequestScope,
    id: string,
    reason?: string,
  ): Promise<OrderDetailsResponseDto> {
    return this.updateStatus(scope, id, {
      status: OrderStatus.CANCELLED,
      reason,
    });
  }

  // === Private helpers ===

  private buildOrderListWhere(
    scope: RequestScope,
    query: OrdersListQueryDto,
  ): Prisma.OrderWhereInput {
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );
    const codeSearch = Number(query.search);

    return {
      unitId: scope.unitId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.startDate || query.endDate
        ? { createdAt: { gte: startDate, lte: endDate } }
        : {}),
      ...(query.search
        ? {
            OR: [
              ...(Number.isInteger(codeSearch) ? [{ code: codeSearch }] : []),
              {
                customer: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                table: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
  }

  private resolveStatusTimestamps(
    status: OrderStatus,
  ): Prisma.OrderUpdateInput {
    const data: Prisma.OrderUpdateInput = {};
    if (status === OrderStatus.CONFIRMED) data.confirmedAt = new Date();
    if (status === OrderStatus.PREPARING) data.preparingAt = new Date();
    if (status === OrderStatus.READY) data.readyAt = new Date();
    if (status === OrderStatus.DELIVERED) data.deliveredAt = new Date();
    if (status === OrderStatus.CANCELLED) data.cancelledAt = new Date();
    return data;
  }

  private async ensureTableInUnit(
    db: Prisma.TransactionClient,
    tableId: string,
    unitId: string,
  ): Promise<void> {
    const table = await db.restaurantTable.findFirst({
      where: { id: tableId, unitId, isActive: true },
      select: { id: true },
    });

    if (!table) {
      throw new BadRequestException(Messages.TABLE_NOT_FOUND);
    }
  }

  private async validateAndFetchProducts(
    tx: Prisma.TransactionClient,
    unitId: string,
    items: CreateOrderItemInput[],
  ): Promise<Map<string, ProductRow>> {
    const products = await tx.product.findMany({
      where: {
        unitId,
        id: { in: items.map((item) => item.productId) },
      },
      select: { id: true, name: true, basePrice: true, isActive: true },
    });

    if (products.length !== items.length) {
      throw new BadRequestException(Messages.PRODUCTS_INVALID_FOR_UNIT);
    }

    return new Map(products.map((p) => [p.id, p]));
  }

  private async resolveVariant(
    tx: Prisma.TransactionClient,
    productId: string,
    variantId: string,
  ) {
    const variant = await tx.productVariant.findFirst({
      where: { id: variantId, productId },
      select: { id: true, name: true, priceDelta: true },
    });

    if (!variant) {
      throw new BadRequestException(Messages.VARIANT_INVALID);
    }

    return variant;
  }

  private async resolveItemOptions(
    tx: Prisma.TransactionClient,
    productId: string,
    options: CreateOrderItemOptionInput[],
  ): Promise<{
    optionData: Prisma.OrderItemOptionUncheckedCreateWithoutOrderItemInput[];
    optionsTotalPerUnit: number;
  }> {
    const optionData: Prisma.OrderItemOptionUncheckedCreateWithoutOrderItemInput[] =
      [];
    let optionsTotalPerUnit = 0;

    for (const optionInput of options) {
      const option = await tx.productOption.findFirst({
        where: {
          id: optionInput.productOptionId,
          isActive: true,
          optionGroup: { productId },
        },
        select: { id: true, name: true, priceDelta: true },
      });

      if (!option) {
        throw new BadRequestException(Messages.OPTION_INVALID);
      }

      const optionQty = optionInput.quantity ?? 1;
      optionsTotalPerUnit +=
        decimalToNumberOrZero(option.priceDelta) * optionQty;

      optionData.push({
        productOptionId: option.id,
        optionName: option.name,
        priceDelta: option.priceDelta,
        quantity: optionQty,
      });
    }

    return { optionData, optionsTotalPerUnit };
  }

  private async buildOrderItemsData(
    tx: Prisma.TransactionClient,
    items: CreateOrderItemInput[],
    productMap: Map<string, ProductRow>,
  ): Promise<{
    itemData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[];
    subtotal: number;
  }> {
    const itemData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product || !product.isActive) {
        throw new BadRequestException(Messages.PRODUCT_INACTIVE);
      }

      const variant = item.variantId
        ? await this.resolveVariant(tx, item.productId, item.variantId)
        : null;

      const { optionData, optionsTotalPerUnit } = item.options?.length
        ? await this.resolveItemOptions(tx, item.productId, item.options)
        : { optionData: [], optionsTotalPerUnit: 0 };

      const unitPrice =
        decimalToNumberOrZero(product.basePrice) +
        decimalToNumberOrZero(variant?.priceDelta) +
        optionsTotalPerUnit;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      itemData.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        variantName: variant?.name,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice.toFixed(2)),
        totalPrice: new Prisma.Decimal(totalPrice.toFixed(2)),
        notes: item.notes,
        options: { create: optionData },
      });
    }

    return { itemData, subtotal };
  }
}
