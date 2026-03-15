import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CashRegisterStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { Messages } from '../common/i18n/messages';
import { PaginationResponse } from '../common/pagination';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { resolveDateRange } from '../common/utils/date-range.util';
import { CloseCashRegisterInput } from './dto/close-cash-register.input';
import { CashRegisterSummaryResponseDto } from './dto/cash-register-summary.response';
import { CashRegisterTransactionsQueryDto } from './dto/cash-register-transactions.query';
import { CashTransactionResponseDto } from './dto/cash-transaction.response';
import { PaymentMethodSummaryResponseDto } from './dto/payment-method-summary.response';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    scope: RequestScope,
  ): Promise<CashRegisterSummaryResponseDto> {
    const openRegister = await this.prisma.cashRegister.findFirst({
      where: {
        unitId: scope.unitId,
        status: CashRegisterStatus.OPEN,
      },
      select: {
        id: true,
        openedAt: true,
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    const { startDate, endDate } = openRegister
      ? { startDate: openRegister.openedAt, endDate: new Date() }
      : resolveDateRange();

    const [paidPayments, pendingAggregation] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          order: {
            unitId: scope.unitId,
          },
          status: PaymentStatus.PAID,
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          amount: true,
          orderId: true,
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          order: {
            unitId: scope.unitId,
          },
          status: PaymentStatus.PENDING,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalSales = paidPayments.reduce(
      (acc, payment) => acc + decimalToNumberOrZero(payment.amount),
      0,
    );
    const totalOrders = new Set(paidPayments.map((payment) => payment.orderId))
      .size;

    return {
      totalSales: Number(totalSales.toFixed(2)),
      totalOrders,
      averageTicket:
        totalOrders > 0 ? Number((totalSales / totalOrders).toFixed(2)) : 0,
      pendingPayments: decimalToNumberOrZero(pendingAggregation._sum.amount),
      hasOpenRegister: !!openRegister,
      registerId: openRegister?.id ?? null,
      openedAt: openRegister?.openedAt ?? null,
    };
  }

  async paymentMethodsSummary(
    scope: RequestScope,
  ): Promise<PaymentMethodSummaryResponseDto[]> {
    const openRegister = await this.prisma.cashRegister.findFirst({
      where: {
        unitId: scope.unitId,
        status: CashRegisterStatus.OPEN,
      },
      select: {
        openedAt: true,
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    const { startDate, endDate } = openRegister
      ? { startDate: openRegister.openedAt, endDate: new Date() }
      : resolveDateRange();

    const rows = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        order: {
          unitId: scope.unitId,
        },
        status: PaymentStatus.PAID,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        method: 'asc',
      },
    });

    return rows.map((row) => ({
      method: row.method,
      totalAmount: decimalToNumberOrZero(row._sum.amount),
      transactions: row._count._all,
    }));
  }

  async transactions(
    scope: RequestScope,
    query: CashRegisterTransactionsQueryDto,
  ): Promise<PaginationResponse<CashTransactionResponseDto>> {
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
            OR: [
              {
                paidAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                paidAt: null,
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: {
          id: true,
          orderId: true,
          amount: true,
          method: true,
          status: true,
          paidAt: true,
          order: {
            select: {
              code: true,
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return new PaginationResponse(
      items.map((item) => ({
        paymentId: item.id,
        orderId: item.orderId,
        orderCode: item.order.code,
        amount: decimalToNumberOrZero(item.amount),
        method: item.method,
        status: item.status,
        customerName: item.order.customer?.name ?? null,
        paidAt: item.paidAt,
      })),
      total,
      page,
      limit,
    );
  }

  async close(
    scope: RequestScope,
    input: CloseCashRegisterInput,
  ): Promise<{ registerId: string; closingValue: number }> {
    const register = await this.prisma.cashRegister.findFirst({
      where: {
        unitId: scope.unitId,
        status: CashRegisterStatus.OPEN,
      },
      select: {
        id: true,
        openedAt: true,
        openingFloat: true,
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    if (!register) {
      throw new NotFoundException(Messages.CASH_REGISTER_NOT_OPEN);
    }

    const paidSales = await this.prisma.payment.aggregate({
      where: {
        order: {
          unitId: scope.unitId,
        },
        status: PaymentStatus.PAID,
        paidAt: {
          gte: register.openedAt,
          lte: new Date(),
        },
      },
      _sum: {
        amount: true,
      },
    });

    const expectedClosingValue =
      decimalToNumberOrZero(register.openingFloat) +
      decimalToNumberOrZero(paidSales._sum.amount);

    const closingValue =
      typeof input.declaredClosingValue === 'number'
        ? Number(input.declaredClosingValue.toFixed(2))
        : Number(expectedClosingValue.toFixed(2));

    if (closingValue < 0) {
      throw new BadRequestException(Messages.CASH_REGISTER_NEGATIVE_CLOSING);
    }

    await this.prisma.cashRegister.update({
      where: {
        id: register.id,
      },
      data: {
        status: CashRegisterStatus.CLOSED,
        closedAt: new Date(),
        closedById: scope.userId,
        closingValue: new Prisma.Decimal(closingValue.toFixed(2)),
      },
    });

    return {
      registerId: register.id,
      closingValue,
    };
  }
}
