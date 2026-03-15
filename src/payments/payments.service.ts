import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashMovementType,
  CashRegisterStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { Messages } from '../common/i18n/messages';
import { PaginationResponse } from '../common/pagination';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { resolveDateRange } from '../common/utils/date-range.util';
import { CreatePaymentInput } from './dto/create-payment.input';
import { PaymentItemResponseDto } from './dto/payment-item.response';
import { PaymentsListQueryDto } from './dto/payments-list.query';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    scope: RequestScope,
    query: PaymentsListQueryDto,
  ): Promise<PaginationResponse<PaymentItemResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const { startDate, endDate } = resolveDateRange(
      query.startDate,
      query.endDate,
    );

    const where: Prisma.PaymentWhereInput = {
      order: {
        unitId: scope.unitId,
      },
      ...(query.status ? { status: query.status } : {}),
      ...(query.method ? { method: query.method } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: {
          id: true,
          orderId: true,
          method: true,
          amount: true,
          status: true,
          reference: true,
          paidAt: true,
          createdAt: true,
          order: {
            select: {
              code: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return new PaginationResponse(
      items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        orderCode: item.order.code,
        method: item.method,
        status: item.status,
        amount: decimalToNumberOrZero(item.amount),
        reference: item.reference ?? null,
        paidAt: item.paidAt,
        createdAt: item.createdAt,
      })),
      total,
      page,
      limit,
    );
  }

  async create(
    scope: RequestScope,
    input: CreatePaymentInput,
  ): Promise<PaymentItemResponseDto> {
    const createdId = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: input.orderId,
          unitId: scope.unitId,
        },
        select: {
          id: true,
          code: true,
          status: true,
          total: true,
          payments: {
            where: {
              status: PaymentStatus.PAID,
            },
            select: {
              amount: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(Messages.ORDER_NOT_FOUND);
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException(Messages.ORDER_CANCELLED_PAYMENT);
      }

      const alreadyPaid = order.payments.reduce(
        (acc, payment) => acc + decimalToNumberOrZero(payment.amount),
        0,
      );
      const orderTotal = decimalToNumberOrZero(order.total);
      const amount = Number(input.amount.toFixed(2));
      const remaining = Number((orderTotal - alreadyPaid).toFixed(2));

      if (amount > remaining) {
        throw new BadRequestException(Messages.PAYMENT_EXCEEDS_REMAINING);
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          userId: scope.userId,
          method: input.method,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          status:
            input.markAsPaid === false
              ? PaymentStatus.PENDING
              : PaymentStatus.PAID,
          paidAt: input.markAsPaid === false ? null : new Date(),
          reference: input.reference?.trim(),
        },
        select: {
          id: true,
        },
      });

      if (input.markAsPaid !== false) {
        const openRegister = await tx.cashRegister.findFirst({
          where: {
            unitId: scope.unitId,
            status: CashRegisterStatus.OPEN,
          },
          orderBy: {
            openedAt: 'desc',
          },
          select: {
            id: true,
          },
        });

        if (openRegister) {
          await tx.cashMovement.create({
            data: {
              unitId: scope.unitId,
              cashRegisterId: openRegister.id,
              userId: scope.userId,
              type: CashMovementType.SALE,
              amount: new Prisma.Decimal(amount.toFixed(2)),
              description: Messages.PAYMENT_DESCRIPTION_FOR_ORDER(order.code),
            },
          });
        }
      }

      return payment.id;
    });

    const payment = await this.prisma.payment.findUnique({
      where: { id: createdId },
      select: {
        id: true,
        orderId: true,
        method: true,
        amount: true,
        status: true,
        reference: true,
        paidAt: true,
        createdAt: true,
        order: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(Messages.PAYMENT_LOAD_ERROR);
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      orderCode: payment.order.code,
      method: payment.method,
      status: payment.status,
      amount: decimalToNumberOrZero(payment.amount),
      reference: payment.reference ?? null,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }
}
