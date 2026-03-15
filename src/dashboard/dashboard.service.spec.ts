import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { DashboardDateRangeQuery } from './dto/dashboard-date-range.query';
import { RecentOrdersQuery } from './dto/recent-orders.query';
import { TopProductsQuery } from './dto/top-products.query';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    order: {
      aggregate: jest.Mock;
      findMany: jest.Mock;
    };
    orderItem: {
      groupBy: jest.Mock;
    };
  };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  const today = new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    prisma = {
      order: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      orderItem: {
        groupBy: jest.fn(),
      },
    };

    service = new DashboardService(prisma as unknown as PrismaService);
  });

  describe('getSummary', () => {
    it('returns zero values when no orders exist', async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { total: null },
        _count: { id: 0 },
      });
      prisma.order.findMany.mockResolvedValue([]);

      const result = await service.getSummary(
        scope,
        {} as DashboardDateRangeQuery,
      );

      expect(result.salesToday).toBe(0);
      expect(result.ordersToday).toBe(0);
      expect(result.averageTicketToday).toBe(0);
      expect(result.averagePreparationTimeMinutes).toBe(0);
    });

    it('calculates average ticket correctly', async () => {
      prisma.order.aggregate.mockResolvedValue({
        _sum: { total: new Prisma.Decimal('300.00') },
        _count: { id: 4 },
      });
      prisma.order.findMany.mockResolvedValue([]);

      const result = await service.getSummary(
        scope,
        {} as DashboardDateRangeQuery,
      );

      expect(result.salesToday).toBe(300);
      expect(result.ordersToday).toBe(4);
      expect(result.averageTicketToday).toBe(75);
    });

    it('calculates average preparation time from confirmed and ready timestamps', async () => {
      const confirmedAt = new Date('2026-03-15T10:00:00.000Z');
      const readyAt = new Date('2026-03-15T10:15:00.000Z');

      prisma.order.aggregate.mockResolvedValue({
        _sum: { total: new Prisma.Decimal('100.00') },
        _count: { id: 1 },
      });

      prisma.order.findMany.mockResolvedValue([
        { confirmedAt, readyAt },
        { confirmedAt: null, readyAt: null },
      ]);

      const result = await service.getSummary(
        scope,
        {} as DashboardDateRangeQuery,
      );

      expect(result.averagePreparationTimeMinutes).toBe(15);
    });
  });

  describe('getSalesOverview', () => {
    it('returns empty array when no orders exist', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      const result = await service.getSalesOverview(
        scope,
        {} as DashboardDateRangeQuery,
      );

      expect(result).toEqual([]);
    });

    it('groups orders by date correctly', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          createdAt: new Date(`${today}T10:00:00.000Z`),
          total: new Prisma.Decimal('50.00'),
        },
        {
          createdAt: new Date(`${today}T14:00:00.000Z`),
          total: new Prisma.Decimal('75.00'),
        },
      ]);

      const result = await service.getSalesOverview(
        scope,
        {} as DashboardDateRangeQuery,
      );

      expect(result).toHaveLength(1);
      expect(result[0].orders).toBe(2);
      expect(result[0].sales).toBe(125);
    });

    it('produces one entry per distinct date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      prisma.order.findMany.mockResolvedValue([
        {
          createdAt: new Date(`${today}T10:00:00.000Z`),
          total: new Prisma.Decimal('100.00'),
        },
        {
          createdAt: new Date(`${yesterdayStr}T09:00:00.000Z`),
          total: new Prisma.Decimal('200.00'),
        },
      ]);

      const result = await service.getSalesOverview(
        scope,
        {} as DashboardDateRangeQuery,
      );

      expect(result).toHaveLength(2);
      const sales = Object.fromEntries(result.map((r) => [r.date, r.sales]));
      expect(sales[today]).toBe(100);
      expect(sales[yesterdayStr]).toBe(200);
    });
  });

  describe('getTopProducts', () => {
    it('returns empty array when no items have been sold', async () => {
      prisma.orderItem.groupBy.mockResolvedValue([]);

      const result = await service.getTopProducts(
        scope,
        {} as TopProductsQuery,
      );

      expect(result).toEqual([]);
    });

    it('maps grouped rows to top product response', async () => {
      prisma.orderItem.groupBy.mockResolvedValue([
        {
          productId: 'product-1',
          productName: 'Burger',
          _sum: {
            quantity: 25,
            totalPrice: new Prisma.Decimal('625.00'),
          },
        },
        {
          productId: 'product-2',
          productName: 'Soda',
          _sum: {
            quantity: 18,
            totalPrice: new Prisma.Decimal('90.00'),
          },
        },
      ]);

      const result = await service.getTopProducts(scope, {
        limit: 2,
      } as TopProductsQuery);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        productId: 'product-1',
        productName: 'Burger',
        quantitySold: 25,
        totalSales: 625,
      });
      expect(result[1]).toMatchObject({
        productId: 'product-2',
        productName: 'Soda',
        quantitySold: 18,
        totalSales: 90,
      });
    });
  });

  describe('getRecentOrders', () => {
    it('returns empty array when no recent orders exist', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      const result = await service.getRecentOrders(scope, {
        limit: 10,
      } as RecentOrdersQuery);

      expect(result).toEqual([]);
    });

    it('maps recent orders to response format', async () => {
      prisma.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          code: 42,
          type: OrderType.DINE_IN,
          status: OrderStatus.CONFIRMED,
          createdAt: new Date(),
          total: new Prisma.Decimal('120.00'),
          customer: { name: 'Ana Lima' },
          table: { name: 'Mesa 3' },
          _count: { items: 3 },
        },
        {
          id: 'order-2',
          code: 43,
          type: OrderType.DELIVERY,
          status: OrderStatus.PREPARING,
          createdAt: new Date(),
          total: new Prisma.Decimal('75.00'),
          customer: null,
          table: null,
          _count: { items: 2 },
        },
      ]);

      const result = await service.getRecentOrders(scope, {
        limit: 10,
      } as RecentOrdersQuery);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'order-1',
        code: 42,
        customerName: 'Ana Lima',
        tableName: 'Mesa 3',
        total: 120,
        itemsCount: 3,
      });
      expect(result[1]).toMatchObject({
        id: 'order-2',
        customerName: null,
        tableName: null,
        total: 75,
      });
    });
  });
});
