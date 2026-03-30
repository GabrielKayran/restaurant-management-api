import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, OrderType, TableReservationStatus } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { OrdersRealtimePublisher } from '../orders-realtime/orders-realtime.publisher';
import { OpenTableOrderInput } from './dto/open-table-order.input';
import { OpenTableSessionInput } from './dto/open-table-session.input';
import { ReserveTableInput } from './dto/reserve-table.input';
import { TablesService } from './tables.service';

describe('TablesService', () => {
  let service: TablesService;
  let prisma: {
    restaurantTable: { findFirst: jest.Mock; findMany: jest.Mock };
    tableSession: { findFirst: jest.Mock; create: jest.Mock };
    tableReservation: { findFirst: jest.Mock; create: jest.Mock };
    order: { findFirst: jest.Mock; create: jest.Mock };
    orderStatusHistory: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let ordersRealtimePublisher: {
    publishOrderCreated: jest.Mock;
  };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    prisma = {
      restaurantTable: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      tableSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      tableReservation: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      order: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    ordersRealtimePublisher = {
      publishOrderCreated: jest.fn().mockResolvedValue(undefined),
    };

    service = new TablesService(
      prisma as unknown as PrismaService,
      ordersRealtimePublisher as unknown as OrdersRealtimePublisher,
    );
  });

  describe('openSession', () => {
    it('throws NotFoundException when table is not found in unit', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue(null);

      await expect(
        service.openSession(scope, 'table-1', {
          guestCount: 2,
        } as OpenTableSessionInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when a session is already open for the table', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue({ id: 'table-1' });
      prisma.tableSession.findFirst.mockResolvedValue({
        id: 'session-existing',
      });

      await expect(
        service.openSession(scope, 'table-1', {
          guestCount: 2,
        } as OpenTableSessionInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates and returns session id when table is available', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue({ id: 'table-1' });
      prisma.tableSession.findFirst.mockResolvedValue(null);
      prisma.tableSession.create.mockResolvedValue({ id: 'session-new' });

      const result = await service.openSession(scope, 'table-1', {
        guestCount: 3,
        notes: 'Aniversário',
      } as OpenTableSessionInput);

      expect(result).toEqual({ sessionId: 'session-new' });
      expect(prisma.tableSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tableId: 'table-1',
            unitId: scope.unitId,
            guestCount: 3,
          }),
        }),
      );
    });
  });

  describe('openOrder', () => {
    it('throws NotFoundException when table is not found in unit', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue(null);

      await expect(
        service.openOrder(scope, 'table-1', {} as OpenTableOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates an order linked to the open session', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue({ id: 'table-1' });

      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({ code: 5 }),
          create: jest.fn().mockResolvedValue({ id: 'order-new', code: 6 }),
        },
        tableSession: {
          findFirst: jest.fn().mockResolvedValue({ id: 'session-1' }),
        },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      const result = await service.openOrder(
        scope,
        'table-1',
        {} as OpenTableOrderInput,
      );

      expect(result).toEqual({ orderId: 'order-new', code: 6 });
      expect(tx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tableId: 'table-1',
            tableSessionId: 'session-1',
            type: OrderType.DINE_IN,
            status: OrderStatus.PENDING,
          }),
        }),
      );
      expect(ordersRealtimePublisher.publishOrderCreated).toHaveBeenCalledWith(
        'order-new',
      );
    });

    it('creates order with incremented code when previous orders exist', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue({ id: 'table-1' });

      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({ code: 10 }),
          create: jest.fn().mockResolvedValue({ id: 'order-11', code: 11 }),
        },
        tableSession: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      const result = await service.openOrder(
        scope,
        'table-1',
        {} as OpenTableOrderInput,
      );

      expect(result.code).toBe(11);
      expect(tx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 11 }),
        }),
      );
    });
  });

  describe('reserve', () => {
    const validStart = '2026-06-15T12:00:00.000Z';
    const validEnd = '2026-06-15T14:00:00.000Z';

    it('throws NotFoundException when table is not found in unit', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue(null);

      await expect(
        service.reserve(scope, 'table-1', {
          reservedForStart: validStart,
          reservedForEnd: validEnd,
          guestCount: 2,
          name: 'Silva',
        } as ReserveTableInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when end date is before start date', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue({ id: 'table-1' });

      await expect(
        service.reserve(scope, 'table-1', {
          reservedForStart: validEnd,
          reservedForEnd: validStart,
          guestCount: 2,
          name: 'Silva',
        } as ReserveTableInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when end date equals start date', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue({ id: 'table-1' });

      await expect(
        service.reserve(scope, 'table-1', {
          reservedForStart: validStart,
          reservedForEnd: validStart,
          guestCount: 2,
          name: 'Silva',
        } as ReserveTableInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when reservation conflicts with an existing one', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue({ id: 'table-1' });
      prisma.tableReservation.findFirst.mockResolvedValue({
        id: 'reservation-existing',
        status: TableReservationStatus.CONFIRMED,
      });

      await expect(
        service.reserve(scope, 'table-1', {
          reservedForStart: validStart,
          reservedForEnd: validEnd,
          guestCount: 2,
          name: 'Silva',
        } as ReserveTableInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates and returns reservation id when no conflict exists', async () => {
      prisma.restaurantTable.findFirst.mockResolvedValue({ id: 'table-1' });
      prisma.tableReservation.findFirst.mockResolvedValue(null);
      prisma.tableReservation.create.mockResolvedValue({
        id: 'reservation-new',
      });

      const result = await service.reserve(scope, 'table-1', {
        reservedForStart: validStart,
        reservedForEnd: validEnd,
        guestCount: 4,
        name: 'Ferreira',
        phone: '34999990000',
      } as ReserveTableInput);

      expect(result).toEqual({ reservationId: 'reservation-new' });
      expect(prisma.tableReservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tableId: 'table-1',
            unitId: scope.unitId,
            guestCount: 4,
            name: 'Ferreira',
          }),
        }),
      );
    });
  });
});
