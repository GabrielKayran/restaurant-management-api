import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: {
    customer: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    address: {
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    prisma = {
      customer: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      address: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new CustomersService(prisma as unknown as PrismaService);
  });

  it('throws NotFoundException when customer is not found', async () => {
    prisma.customer.findFirst.mockResolvedValue(null);

    await expect(service.getById(scope, 'customer-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lists paginated customers', async () => {
    prisma.customer.findMany.mockResolvedValue([
      {
        id: 'customer-1',
        name: 'Maria Oliveira',
        phone: '34999998888',
        email: 'maria@email.com',
        document: null,
        createdAt: new Date(),
        _count: { orders: 3 },
      },
    ]);
    prisma.customer.count.mockResolvedValue(1);

    const result = await service.list(scope, {} as never);

    expect(result.total).toBe(1);
    expect(result.data[0].name).toBe('Maria Oliveira');
  });

  it('creates a customer and returns details', async () => {
    prisma.customer.create.mockResolvedValue({ id: 'customer-1' });
    prisma.customer.findFirst.mockResolvedValue({
      id: 'customer-1',
      name: 'Maria Oliveira',
      phone: null,
      email: null,
      document: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      addresses: [],
    });

    const result = await service.create(scope, {
      name: 'Maria Oliveira',
    });

    expect(result.id).toBe('customer-1');
    expect(prisma.customer.create).toHaveBeenCalled();
  });
});
