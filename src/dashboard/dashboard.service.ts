import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { resolveDateRange } from '../common/utils/date-range.util';
import { DashboardDateRangeQuery } from './dto/dashboard-date-range.query';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary.response';
import { RecentOrderResponseDto } from './dto/recent-order.response';
import { RecentOrdersQuery } from './dto/recent-orders.query';
import { SalesOverviewItemResponseDto } from './dto/sales-overview-item.response';
import { TopProductResponseDto } from './dto/top-product.response';
import { TopProductsQuery } from './dto/top-products.query';

@Injectable()
export class DashboardService {
  private readonly canceledStatus = OrderStatus.CANCELLED;

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    scope: RequestScope,
    query: DashboardDateRangeQuery,
  ): Promise<DashboardSummaryResponseDto> {
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );

    const [orderAggregation, prepOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          unitId: scope.unitId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: this.canceledStatus,
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),
      this.prisma.order.findMany({
        where: {
          unitId: scope.unitId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          confirmedAt: {
            not: null,
          },
          readyAt: {
            not: null,
          },
        },
        select: {
          confirmedAt: true,
          readyAt: true,
        },
      }),
    ]);

    const salesToday = decimalToNumberOrZero(orderAggregation._sum.total);
    const ordersToday = orderAggregation._count.id;
    const averageTicketToday =
      ordersToday > 0 ? Number((salesToday / ordersToday).toFixed(2)) : 0;

    const prepDurations = prepOrders
      .map((order) => {
        if (!order.confirmedAt || !order.readyAt) {
          return null;
        }

        return order.readyAt.getTime() - order.confirmedAt.getTime();
      })
      .filter((value): value is number => value !== null && value >= 0);

    const avgPreparationMs =
      prepDurations.length > 0
        ? prepDurations.reduce((acc, value) => acc + value, 0) /
          prepDurations.length
        : 0;

    return {
      salesToday,
      ordersToday,
      averageTicketToday,
      averagePreparationTimeMinutes: Number(
        (avgPreparationMs / 60000).toFixed(2),
      ),
    };
  }

  async getSalesOverview(
    scope: RequestScope,
    query: DashboardDateRangeQuery,
  ): Promise<SalesOverviewItemResponseDto[]> {
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );

    const orders = await this.prisma.order.findMany({
      where: {
        unitId: scope.unitId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: this.canceledStatus,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const grouped = new Map<string, { sales: number; orders: number }>();

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const current = grouped.get(key) ?? { sales: 0, orders: 0 };
      current.sales += decimalToNumberOrZero(order.total);
      current.orders += 1;
      grouped.set(key, current);
    }

    return [...grouped.entries()].map(([date, value]) => ({
      date,
      sales: Number(value.sales.toFixed(2)),
      orders: value.orders,
    }));
  }

  async getTopProducts(
    scope: RequestScope,
    query: TopProductsQuery,
  ): Promise<TopProductResponseDto[]> {
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );

    const rows = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: {
          unitId: scope.unitId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: this.canceledStatus,
          },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: query.limit ?? 5,
    });

    return rows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      quantitySold: row._sum.quantity ?? 0,
      totalSales: decimalToNumberOrZero(
        row._sum.totalPrice as Prisma.Decimal | null,
      ),
    }));
  }

  async getRecentOrders(
    scope: RequestScope,
    query: RecentOrdersQuery,
  ): Promise<RecentOrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        unitId: scope.unitId,
      },
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        createdAt: true,
        total: true,
        customer: {
          select: {
            name: true,
          },
        },
        table: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      take: query.limit ?? 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      id: order.id,
      code: order.code,
      type: order.type,
      status: order.status,
      customerName: order.customer?.name ?? null,
      tableName: order.table?.name ?? null,
      total: decimalToNumberOrZero(order.total),
      createdAt: order.createdAt,
      itemsCount: order._count.items,
    }));
  }
}
