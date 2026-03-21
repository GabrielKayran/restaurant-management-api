import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { resolveDateRange } from '../common/utils/date-range.util';
import { DashboardDateRangeQuery } from './dto/dashboard-date-range.query';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary.response';
import { OrdersByStatusResponseDto } from './dto/orders-by-status.response';
import {
  PreparationTimeTrendGroupBy,
  PreparationTimeTrendQuery,
} from './dto/preparation-time-trend.query';
import { PreparationTimeTrendResponseDto } from './dto/preparation-time-trend.response';
import { PaymentsByMethodResponseDto } from './dto/payments-by-method.response';
import { RecentOrderResponseDto } from './dto/recent-order.response';
import { RecentOrdersQuery } from './dto/recent-orders.query';
import { SalesByHourResponseDto } from './dto/sales-by-hour.response';
import { SalesOverviewItemResponseDto } from './dto/sales-overview-item.response';
import { TopProductResponseDto } from './dto/top-product.response';
import { TopProductsQuery } from './dto/top-products.query';

@Injectable()
export class DashboardService {
  private readonly canceledStatus = OrderStatus.CANCELLED;
  private readonly paidPaymentStatus = PaymentStatus.PAID;

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

  async getOrdersByStatus(
    scope: RequestScope,
    query: DashboardDateRangeQuery,
  ): Promise<OrdersByStatusResponseDto[]> {
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );

    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: {
        unitId: scope.unitId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        status: 'asc',
      },
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }

  async getPaymentsByMethod(
    scope: RequestScope,
    query: DashboardDateRangeQuery,
  ): Promise<PaymentsByMethodResponseDto[]> {
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );

    const rows = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        order: {
          unitId: scope.unitId,
        },
        status: this.paidPaymentStatus,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        method: 'asc',
      },
    });

    return rows.map((row) => ({
      method: row.method,
      count: row._count._all,
      totalAmount: decimalToNumberOrZero(row._sum.amount),
    }));
  }

  async getSalesByHour(
    scope: RequestScope,
    query: DashboardDateRangeQuery,
  ): Promise<SalesByHourResponseDto[]> {
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );

    const rows = await this.prisma.$queryRaw<
      Array<{
        hour: number;
        orders: number;
        sales: Prisma.Decimal | number | string | null;
      }>
    >(Prisma.sql`
      SELECT
        EXTRACT(HOUR FROM o."createdAt")::int AS "hour",
        COUNT(*)::int AS "orders",
        COALESCE(SUM(o."total"), 0) AS "sales"
      FROM "Order" o
      WHERE o."unitId" = ${scope.unitId}
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o."status" <> CAST(${this.canceledStatus} AS "OrderStatus")
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    return rows.map((row) => ({
      hour: this.parseInteger(row.hour),
      orders: this.parseInteger(row.orders),
      sales: this.parseNumber(row.sales),
    }));
  }

  async getPreparationTimeTrend(
    scope: RequestScope,
    query: PreparationTimeTrendQuery,
  ): Promise<PreparationTimeTrendResponseDto[]> {
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );

    const groupBy = query.groupBy ?? PreparationTimeTrendGroupBy.DAY;
    const rows = await this.prisma.$queryRaw<
      Array<{
        bucket: string;
        averageMinutes: Prisma.Decimal | number | string | null;
        p90Minutes: Prisma.Decimal | number | string | null;
      }>
    >(
      groupBy === PreparationTimeTrendGroupBy.HOUR
        ? Prisma.sql`
            SELECT
              TO_CHAR(DATE_TRUNC('hour', o."readyAt"), 'YYYY-MM-DD"T"HH24:00:00') AS "bucket",
              ROUND(AVG(EXTRACT(EPOCH FROM (o."readyAt" - o."confirmedAt")) / 60)::numeric, 2) AS "averageMinutes",
              ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (
                ORDER BY EXTRACT(EPOCH FROM (o."readyAt" - o."confirmedAt")) / 60
              )::numeric, 2) AS "p90Minutes"
            FROM "Order" o
            WHERE o."unitId" = ${scope.unitId}
              AND o."createdAt" >= ${startDate}
              AND o."createdAt" <= ${endDate}
              AND o."status" <> CAST(${this.canceledStatus} AS "OrderStatus")
              AND o."confirmedAt" IS NOT NULL
              AND o."readyAt" IS NOT NULL
              AND o."readyAt" >= o."confirmedAt"
            GROUP BY 1
            ORDER BY 1 ASC
          `
        : Prisma.sql`
            SELECT
              TO_CHAR(DATE_TRUNC('day', o."readyAt"), 'YYYY-MM-DD') AS "bucket",
              ROUND(AVG(EXTRACT(EPOCH FROM (o."readyAt" - o."confirmedAt")) / 60)::numeric, 2) AS "averageMinutes",
              ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (
                ORDER BY EXTRACT(EPOCH FROM (o."readyAt" - o."confirmedAt")) / 60
              )::numeric, 2) AS "p90Minutes"
            FROM "Order" o
            WHERE o."unitId" = ${scope.unitId}
              AND o."createdAt" >= ${startDate}
              AND o."createdAt" <= ${endDate}
              AND o."status" <> CAST(${this.canceledStatus} AS "OrderStatus")
              AND o."confirmedAt" IS NOT NULL
              AND o."readyAt" IS NOT NULL
              AND o."readyAt" >= o."confirmedAt"
            GROUP BY 1
            ORDER BY 1 ASC
          `,
    );

    return rows.map((row) => ({
      bucket: row.bucket,
      averageMinutes: this.parseNumber(row.averageMinutes),
      p90Minutes: this.parseNumber(row.p90Minutes),
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

  private parseNumber(value: Prisma.Decimal | number | string | null): number {
    if (value === null) {
      return 0;
    }

    if (value instanceof Prisma.Decimal) {
      return Number(value.toString());
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parseInteger(value: number | string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
  }
}
