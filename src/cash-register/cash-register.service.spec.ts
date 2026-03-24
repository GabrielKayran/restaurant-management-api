import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CashRegisterStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { CloseCashRegisterInput } from './dto/close-cash-register.input';
import { CashRegisterService } from './cash-register.service';

describe('CashRegisterService', () => {
  let service: CashRegisterService;
  let prisma: {
    cashRegister: {
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    payment: {
      findMany: jest.Mock;
      aggregate: jest.Mock;
      groupBy: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    prisma = {
      cashRegister: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new CashRegisterService(prisma as unknown as PrismaService);
  });

  describe('getSummary', () => {
    it('returns summary with hasOpenRegister false when no register is open', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.getSummary(scope);

      expect(result.hasOpenRegister).toBe(false);
      expect(result.registerId).toBeNull();
      expect(result.totalSales).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.averageTicket).toBe(0);
    });

    it('calculates totals correctly from paid payments', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue({
        id: 'register-1',
        openedAt: new Date(),
      });

      prisma.payment.findMany.mockResolvedValue([
        { amount: new Prisma.Decimal('50.00'), orderId: 'order-1' },
        { amount: new Prisma.Decimal('30.00'), orderId: 'order-1' },
        { amount: new Prisma.Decimal('70.00'), orderId: 'order-2' },
      ]);

      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('20.00') },
      });

      const result = await service.getSummary(scope);

      expect(result.hasOpenRegister).toBe(true);
      expect(result.registerId).toBe('register-1');
      expect(result.totalSales).toBe(150);
      expect(result.totalOrders).toBe(2);
      expect(result.averageTicket).toBe(75);
      expect(result.pendingPayments).toBe(20);
    });
  });

  describe('open', () => {
    it('throws BadRequestException when a register is already open', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue({ id: 'register-1' });

      await expect(service.open(scope, { openingFloat: 50 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('opens a new register with the informed opening float', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);
      prisma.cashRegister.create.mockResolvedValue({ id: 'register-2' });

      const result = await service.open(scope, { openingFloat: 75.5 });

      expect(result).toEqual({
        registerId: 'register-2',
        openingFloat: 75.5,
      });
      expect(prisma.cashRegister.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            unitId: scope.unitId,
            openedById: scope.userId,
            status: CashRegisterStatus.OPEN,
          }),
        }),
      );
    });
  });

  describe('close', () => {
    it('throws NotFoundException when no open cash register exists', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);

      await expect(
        service.close(scope, {} as CloseCashRegisterInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when declared closing value is negative', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue({
        id: 'register-1',
        openedAt: new Date(),
        openingFloat: new Prisma.Decimal('200.00'),
      });

      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('500.00') },
      });

      await expect(
        service.close(scope, {
          declaredClosingValue: -10,
        } as CloseCashRegisterInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('closes the register with the declared closing value', async () => {
      const openedAt = new Date();
      prisma.cashRegister.findFirst.mockResolvedValue({
        id: 'register-1',
        openedAt,
        openingFloat: new Prisma.Decimal('200.00'),
      });

      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('500.00') },
      });

      prisma.cashRegister.update.mockResolvedValue({});

      const result = await service.close(scope, {
        declaredClosingValue: 680,
      } as CloseCashRegisterInput);

      expect(result).toEqual({ registerId: 'register-1', closingValue: 680 });
      expect(prisma.cashRegister.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'register-1' },
          data: expect.objectContaining({
            status: CashRegisterStatus.CLOSED,
            closedById: scope.userId,
          }),
        }),
      );
    });

    it('uses expected closing value when no declared value is provided', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue({
        id: 'register-1',
        openedAt: new Date(),
        openingFloat: new Prisma.Decimal('200.00'),
      });

      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('500.00') },
      });

      prisma.cashRegister.update.mockResolvedValue({});

      const result = await service.close(scope, {} as CloseCashRegisterInput);

      expect(result.closingValue).toBe(700);
    });

    it('uses zero as paid sales when aggregate sum is null', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue({
        id: 'register-1',
        openedAt: new Date(),
        openingFloat: new Prisma.Decimal('150.00'),
      });

      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      prisma.cashRegister.update.mockResolvedValue({});

      const result = await service.close(scope, {} as CloseCashRegisterInput);

      expect(result.closingValue).toBe(150);
    });
  });

  describe('paymentMethodsSummary', () => {
    it('returns grouped payment method totals', async () => {
      prisma.cashRegister.findFirst.mockResolvedValue(null);

      prisma.payment.groupBy.mockResolvedValue([
        {
          method: 'CASH',
          _sum: { amount: new Prisma.Decimal('300.00') },
          _count: { _all: 5 },
        },
        {
          method: 'CREDIT_CARD',
          _sum: { amount: new Prisma.Decimal('700.00') },
          _count: { _all: 10 },
        },
      ]);

      const result = await service.paymentMethodsSummary(scope);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        method: 'CASH',
        totalAmount: 300,
        transactions: 5,
      });
      expect(result[1]).toMatchObject({
        method: 'CREDIT_CARD',
        totalAmount: 700,
        transactions: 10,
      });
    });
  });
});
