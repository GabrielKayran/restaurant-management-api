import { Injectable } from '@nestjs/common';
import { OrderStatus, OrderType } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../../common/models/request-scope.model';
import {
  DELIVERY_BOARD_ORDER_SELECT,
  mapDeliveryBoardOrderCard,
} from '../helpers';
import { DeliveryBoardQueryDto, DeliveryBoardResponseDto } from '../dto';

@Injectable()
export class PublicDeliveryBoardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeliveryBoard(
    scope: RequestScope,
    query: DeliveryBoardQueryDto,
  ): Promise<DeliveryBoardResponseDto> {
    const codeSearch = Number(query.search);
    const allowedStatuses = query.status
      ? [query.status]
      : query.includeCompleted
      ? [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
        ]
      : [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ];

    const orders = await this.prisma.order.findMany({
      where: {
        unitId: scope.unitId,
        type: OrderType.DELIVERY,
        status: {
          in: allowedStatuses,
        },
        ...(query.search
          ? {
              OR: [
                ...(Number.isFinite(codeSearch)
                  ? [{ code: Math.trunc(codeSearch) }]
                  : []),
                {
                  customer: {
                    name: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  customer: {
                    phone: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  address: {
                    street: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  address: {
                    neighborhood: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      select: DELIVERY_BOARD_ORDER_SELECT,
      orderBy: [{ createdAt: 'asc' }, { code: 'asc' }],
    });

    return {
      columns: allowedStatuses.map((status) => ({
        status,
        orders: orders
          .filter((order) => order.status === status)
          .map(mapDeliveryBoardOrderCard),
      })),
    };
  }
}
