import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  TableReservationStatus,
  TableSessionStatus,
} from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { Messages } from '../common/i18n/messages';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import { OpenTableOrderInput } from './dto/open-table-order.input';
import { OpenTableSessionInput } from './dto/open-table-session.input';
import { ReserveTableInput } from './dto/reserve-table.input';
import { TableCardResponseDto } from './dto/table-card.response';
import { TableViewStatus, TablesListQueryDto } from './dto/tables-list.query';
import { TablesSummaryResponseDto } from './dto/table-summary.response';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(scope: RequestScope): Promise<TablesSummaryResponseDto> {
    const tables = await this.buildTableCards(scope.unitId);

    return {
      availableTables: tables.filter(
        (table) => table.status === TableViewStatus.AVAILABLE,
      ).length,
      occupiedTables: tables.filter(
        (table) => table.status === TableViewStatus.OCCUPIED,
      ).length,
      reservedTables: tables.filter(
        (table) => table.status === TableViewStatus.RESERVED,
      ).length,
    };
  }

  async list(
    scope: RequestScope,
    query: TablesListQueryDto,
  ): Promise<TableCardResponseDto[]> {
    const tables = await this.buildTableCards(scope.unitId);

    if (!query.status) {
      return tables;
    }

    return tables.filter((table) => table.status === query.status);
  }

  async getById(
    scope: RequestScope,
    id: string,
  ): Promise<TableCardResponseDto> {
    const tables = await this.buildTableCards(scope.unitId, id);
    const table = tables[0];

    if (!table) {
      throw new NotFoundException(Messages.TABLE_NOT_FOUND);
    }

    return table;
  }

  async openSession(
    scope: RequestScope,
    tableId: string,
    input: OpenTableSessionInput,
  ): Promise<{ sessionId: string }> {
    const table = await this.ensureTable(scope.unitId, tableId);

    const openSession = await this.prisma.tableSession.findFirst({
      where: {
        tableId: table.id,
        status: TableSessionStatus.OPEN,
      },
      select: { id: true },
    });

    if (openSession) {
      throw new BadRequestException(Messages.TABLE_SESSION_ALREADY_OPEN);
    }

    const session = await this.prisma.tableSession.create({
      data: {
        unitId: scope.unitId,
        tableId: table.id,
        guestCount: input.guestCount,
        notes: input.notes,
      },
      select: {
        id: true,
      },
    });

    return {
      sessionId: session.id,
    };
  }

  async openOrder(
    scope: RequestScope,
    tableId: string,
    input: OpenTableOrderInput,
  ): Promise<{ orderId: string; code: number }> {
    await this.ensureTable(scope.unitId, tableId);

    const result = await this.prisma.$transaction(async (tx) => {
      const [lastOrder, session] = await Promise.all([
        tx.order.findFirst({
          where: { unitId: scope.unitId },
          select: { code: true },
          orderBy: { code: 'desc' },
        }),
        tx.tableSession.findFirst({
          where: {
            tableId,
            unitId: scope.unitId,
            status: TableSessionStatus.OPEN,
          },
          select: {
            id: true,
          },
        }),
      ]);

      const created = await tx.order.create({
        data: {
          unitId: scope.unitId,
          tableId,
          tableSessionId: session?.id,
          customerId: input.customerId,
          createdByUserId: scope.userId,
          code: (lastOrder?.code ?? 0) + 1,
          type: OrderType.DINE_IN,
          status: OrderStatus.PENDING,
          subtotal: 0,
          discount: 0,
          deliveryFee: 0,
          total: 0,
          notes: input.notes,
        },
        select: {
          id: true,
          code: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          fromStatus: null,
          toStatus: OrderStatus.PENDING,
          reason: 'Order created from table',
          changedByUserId: scope.userId,
        },
      });

      return created;
    });

    return {
      orderId: result.id,
      code: result.code,
    };
  }

  async reserve(
    scope: RequestScope,
    tableId: string,
    input: ReserveTableInput,
  ): Promise<{ reservationId: string }> {
    await this.ensureTable(scope.unitId, tableId);

    const start = new Date(input.reservedForStart);
    const end = new Date(input.reservedForEnd);

    if (end <= start) {
      throw new BadRequestException(Messages.RESERVATION_END_BEFORE_START);
    }

    const overlap = await this.prisma.tableReservation.findFirst({
      where: {
        tableId,
        unitId: scope.unitId,
        status: {
          in: [
            TableReservationStatus.PENDING,
            TableReservationStatus.CONFIRMED,
          ],
        },
        AND: [
          {
            reservedForStart: {
              lt: end,
            },
          },
          {
            reservedForEnd: {
              gt: start,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (overlap) {
      throw new BadRequestException(Messages.RESERVATION_CONFLICT);
    }

    const reservation = await this.prisma.tableReservation.create({
      data: {
        unitId: scope.unitId,
        tableId,
        customerId: input.customerId,
        name: input.name.trim(),
        phone: input.phone?.trim(),
        guestCount: input.guestCount,
        reservedForStart: start,
        reservedForEnd: end,
        notes: input.notes,
      },
      select: {
        id: true,
      },
    });

    return {
      reservationId: reservation.id,
    };
  }

  private async buildTableCards(
    unitId: string,
    tableId?: string,
  ): Promise<TableCardResponseDto[]> {
    const now = new Date();
    const tables = await this.prisma.restaurantTable.findMany({
      where: {
        unitId,
        isActive: true,
        ...(tableId ? { id: tableId } : {}),
      },
      select: {
        id: true,
        name: true,
        seats: true,
        sessions: {
          where: {
            status: TableSessionStatus.OPEN,
          },
          select: {
            openedAt: true,
            orders: {
              where: {
                status: {
                  in: [
                    OrderStatus.PENDING,
                    OrderStatus.CONFIRMED,
                    OrderStatus.PREPARING,
                    OrderStatus.READY,
                  ],
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              select: {
                code: true,
                total: true,
              },
              take: 1,
            },
          },
          take: 1,
          orderBy: {
            openedAt: 'desc',
          },
        },
        reservations: {
          where: {
            status: {
              in: [
                TableReservationStatus.PENDING,
                TableReservationStatus.CONFIRMED,
              ],
            },
            reservedForEnd: {
              gte: now,
            },
          },
          select: {
            reservedForStart: true,
          },
          orderBy: {
            reservedForStart: 'asc',
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tables.map((table) => {
      const openSession = table.sessions[0] ?? null;
      const activeOrder = openSession?.orders[0] ?? null;
      const reservation = table.reservations[0] ?? null;

      let status = TableViewStatus.AVAILABLE;

      if (openSession) {
        status = TableViewStatus.OCCUPIED;
      } else if (reservation) {
        status = TableViewStatus.RESERVED;
      }

      const elapsedMinutes = openSession
        ? Math.max(
            0,
            Math.floor((Date.now() - openSession.openedAt.getTime()) / 60000),
          )
        : null;

      return {
        id: table.id,
        name: table.name,
        seats: table.seats ?? null,
        status,
        activeOrderCode: activeOrder?.code ?? null,
        elapsedMinutes,
        totalAmount: activeOrder
          ? decimalToNumberOrZero(activeOrder.total)
          : null,
        reservedForStart: reservation?.reservedForStart ?? null,
      };
    });
  }

  private async ensureTable(
    unitId: string,
    tableId: string,
  ): Promise<{ id: string }> {
    const table = await this.prisma.restaurantTable.findFirst({
      where: { id: tableId, unitId, isActive: true },
      select: { id: true },
    });

    if (!table) {
      throw new NotFoundException(Messages.TABLE_NOT_FOUND);
    }

    return table;
  }
}
