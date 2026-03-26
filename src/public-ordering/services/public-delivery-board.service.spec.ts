import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../../common/models/request-scope.model';
import { PublicDeliveryBoardService } from './public-delivery-board.service';

describe('PublicDeliveryBoardService', () => {
  let service: PublicDeliveryBoardService;
  let prisma: {
    order: { findMany: jest.Mock };
  };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    prisma = {
      order: {
        findMany: jest.fn(),
      },
    };

    service = new PublicDeliveryBoardService(
      prisma as unknown as PrismaService,
    );
  });

  it('groups delivery orders by status columns', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        publicToken: 'token-1',
        code: 11,
        status: OrderStatus.PENDING,
        total: new Prisma.Decimal('58.00'),
        notes: null,
        createdAt: new Date(),
        customer: { name: 'Maria', phone: '34999998888' },
        courier: null,
        address: {
          street: 'Rua A',
          number: '123',
          neighborhood: 'Centro',
          zipCode: '38400100',
          reference: null,
        },
        deliveryZone: { name: 'Centro' },
        _count: { items: 2 },
      },
    ]);

    const result = await service.getDeliveryBoard(scope, {
      includeCompleted: false,
    } as any);

    expect(result.columns[0].status).toBe(OrderStatus.PENDING);
    expect(result.columns[0].orders[0].code).toBe(11);
    expect(result.columns[0].orders[0].total).toBe(58);
  });
});
