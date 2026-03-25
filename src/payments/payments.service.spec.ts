import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { AuditLoggerService } from '../common/services/audit-logger.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    payment: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let auditLogger: { log: jest.Mock };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    prisma = {
      payment: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    auditLogger = {
      log: jest.fn(),
    };

    service = new PaymentsService(
      prisma as unknown as PrismaService,
      auditLogger as unknown as AuditLoggerService,
    );
  });

  describe('create', () => {
    it('throws NotFoundException when order is not found', async () => {
      const tx = {
        order: { findFirst: jest.fn().mockResolvedValue(null) },
        payment: { create: jest.fn() },
        cashRegister: { findFirst: jest.fn() },
        cashMovement: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.create(scope, {
          orderId: 'order-1',
          method: PaymentMethod.CASH,
          amount: 50,
          reference: undefined,
          markAsPaid: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when order is cancelled', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'order-1',
            code: 1,
            status: OrderStatus.CANCELLED,
            total: new Prisma.Decimal('100.00'),
            payments: [],
          }),
        },
        payment: { create: jest.fn() },
        cashRegister: { findFirst: jest.fn() },
        cashMovement: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.create(scope, {
          orderId: 'order-1',
          method: PaymentMethod.CASH,
          amount: 50,
          reference: undefined,
          markAsPaid: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when payment amount exceeds remaining order balance', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'order-1',
            code: 1,
            status: OrderStatus.CONFIRMED,
            total: new Prisma.Decimal('100.00'),
            payments: [{ amount: new Prisma.Decimal('80.00') }],
          }),
        },
        payment: { create: jest.fn() },
        cashRegister: { findFirst: jest.fn() },
        cashMovement: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.create(scope, {
          orderId: 'order-1',
          method: PaymentMethod.CASH,
          amount: 50,
          reference: undefined,
          markAsPaid: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates payment and registers cash movement when register is open', async () => {
      const paymentId = 'payment-1';
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'order-1',
            code: 1,
            status: OrderStatus.CONFIRMED,
            total: new Prisma.Decimal('100.00'),
            payments: [],
          }),
        },
        payment: { create: jest.fn().mockResolvedValue({ id: paymentId }) },
        cashRegister: {
          findFirst: jest.fn().mockResolvedValue({ id: 'register-1' }),
        },
        cashMovement: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        orderId: 'order-1',
        method: PaymentMethod.CASH,
        amount: new Prisma.Decimal('100.00'),
        status: PaymentStatus.PAID,
        reference: null,
        paidAt: new Date(),
        createdAt: new Date(),
        order: { code: 1 },
      });

      const result = await service.create(scope, {
        orderId: 'order-1',
        method: PaymentMethod.CASH,
        amount: 100,
        reference: undefined,
        markAsPaid: true,
      });

      expect(tx.cashMovement.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(paymentId);
      expect(result.amount).toBe(100);
    });

    it('skips cash movement when no cash register is open', async () => {
      const paymentId = 'payment-2';
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'order-1',
            code: 2,
            status: OrderStatus.CONFIRMED,
            total: new Prisma.Decimal('100.00'),
            payments: [],
          }),
        },
        payment: { create: jest.fn().mockResolvedValue({ id: paymentId }) },
        cashRegister: { findFirst: jest.fn().mockResolvedValue(null) },
        cashMovement: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        orderId: 'order-1',
        method: PaymentMethod.CASH,
        amount: new Prisma.Decimal('100.00'),
        status: PaymentStatus.PAID,
        reference: null,
        paidAt: new Date(),
        createdAt: new Date(),
        order: { code: 2 },
      });

      await service.create(scope, {
        orderId: 'order-1',
        method: PaymentMethod.CASH,
        amount: 100,
        reference: undefined,
        markAsPaid: true,
      });

      expect(tx.cashMovement.create).not.toHaveBeenCalled();
    });

    it('creates payment with PENDING status when markAsPaid is false', async () => {
      const paymentId = 'payment-3';
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'order-1',
            code: 3,
            status: OrderStatus.CONFIRMED,
            total: new Prisma.Decimal('100.00'),
            payments: [],
          }),
        },
        payment: { create: jest.fn().mockResolvedValue({ id: paymentId }) },
        cashRegister: { findFirst: jest.fn() },
        cashMovement: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        orderId: 'order-1',
        method: PaymentMethod.CREDIT_CARD,
        amount: new Prisma.Decimal('100.00'),
        status: PaymentStatus.PENDING,
        reference: null,
        paidAt: null,
        createdAt: new Date(),
        order: { code: 3 },
      });

      const result = await service.create(scope, {
        orderId: 'order-1',
        method: PaymentMethod.CREDIT_CARD,
        amount: 100,
        reference: undefined,
        markAsPaid: false,
      });

      expect(tx.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PaymentStatus.PENDING }),
        }),
      );
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(tx.cashMovement.create).not.toHaveBeenCalled();
    });
  });
});
