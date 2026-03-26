import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { RequestScope } from '../common/models/request-scope.model';
import { CreateOrderInput } from './dto/create-order.input';
import { CreateOrderItemInput } from './dto/create-order-item.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { UpdateOrderStatusInput } from './dto/order-status.input';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    order: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    restaurantTable: { findFirst: jest.Mock };
    $transaction: jest.Mock;
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
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      restaurantTable: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new OrdersService(prisma as unknown as PrismaService);
  });

  describe('getById', () => {
    it('throws NotFoundException when order is not found', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.getById(scope, 'order-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns order details when found', async () => {
      const mockOrder = {
        id: 'order-1',
        code: 1,
        type: OrderType.DINE_IN,
        status: OrderStatus.PENDING,
        notes: null,
        createdAt: new Date(),
        subtotal: new Prisma.Decimal('50.00'),
        discount: new Prisma.Decimal('0.00'),
        deliveryFee: new Prisma.Decimal('0.00'),
        total: new Prisma.Decimal('50.00'),
        customer: null,
        table: { name: 'Mesa 1' },
        items: [],
        statusHistory: [],
      };

      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.getById(scope, 'order-1');

      expect(result.id).toBe('order-1');
      expect(result.code).toBe(1);
      expect(result.total).toBe(50);
    });
  });

  describe('create', () => {
    it('throws BadRequestException when no items are provided', async () => {
      await expect(
        service.create(scope, {
          type: OrderType.TAKEAWAY,
          items: [],
        } as CreateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when DINE_IN type has no tableId', async () => {
      await expect(
        service.create(scope, {
          type: OrderType.DINE_IN,
          items: [
            { productId: 'product-1', quantity: 1 } as CreateOrderItemInput,
          ],
        } as CreateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when products are not found in the unit', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        product: { findMany: jest.fn().mockResolvedValue([]) },
        restaurantTable: { findFirst: jest.fn() },
        productVariant: { findFirst: jest.fn() },
        productOption: { findFirst: jest.fn() },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.create(scope, {
          type: OrderType.TAKEAWAY,
          items: [
            { productId: 'product-1', quantity: 1 } as CreateOrderItemInput,
          ],
        } as CreateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when product is inactive', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'product-1',
              name: 'Burger',
              basePrice: new Prisma.Decimal('10.00'),
              isActive: false,
              prices: [],
            },
          ]),
        },
        restaurantTable: { findFirst: jest.fn() },
        productVariant: { findFirst: jest.fn() },
        productOption: { findFirst: jest.fn() },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.create(scope, {
          type: OrderType.TAKEAWAY,
          items: [
            { productId: 'product-1', quantity: 1 } as CreateOrderItemInput,
          ],
        } as CreateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when variant is invalid for product', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'product-1',
              name: 'Burger',
              basePrice: new Prisma.Decimal('10.00'),
              isActive: true,
              prices: [],
            },
          ]),
        },
        restaurantTable: { findFirst: jest.fn() },
        productVariant: { findFirst: jest.fn().mockResolvedValue(null) },
        productOption: { findFirst: jest.fn() },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.create(scope, {
          type: OrderType.TAKEAWAY,
          items: [
            {
              productId: 'product-1',
              variantId: 'variant-1',
              quantity: 1,
            } as CreateOrderItemInput,
          ],
        } as CreateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when table is not found for DINE_IN order', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'product-1',
              name: 'Burger',
              basePrice: new Prisma.Decimal('10.00'),
              isActive: true,
              prices: [],
            },
          ]),
        },
        restaurantTable: { findFirst: jest.fn().mockResolvedValue(null) },
        productVariant: { findFirst: jest.fn() },
        productOption: { findFirst: jest.fn() },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.create(scope, {
          type: OrderType.DINE_IN,
          tableId: 'table-1',
          items: [
            { productId: 'product-1', quantity: 1 } as CreateOrderItemInput,
          ],
        } as CreateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when option is invalid for product', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'product-1',
              name: 'Burger',
              basePrice: new Prisma.Decimal('10.00'),
              isActive: true,
              prices: [],
            },
          ]),
        },
        restaurantTable: {
          findFirst: jest.fn().mockResolvedValue({ id: 'table-1' }),
        },
        productVariant: { findFirst: jest.fn().mockResolvedValue(null) },
        productOption: { findFirst: jest.fn().mockResolvedValue(null) },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.create(scope, {
          type: OrderType.DINE_IN,
          tableId: 'table-1',
          items: [
            {
              productId: 'product-1',
              quantity: 1,
              options: [{ productOptionId: 'option-1', quantity: 1 }],
            } as CreateOrderItemInput,
          ],
        } as CreateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('applies active scheduled prices when calculating order totals', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'order-1' }),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'product-1',
              name: 'Burger',
              basePrice: new Prisma.Decimal('10.00'),
              isActive: true,
              prices: [
                {
                  price: new Prisma.Decimal('7.50'),
                  startsAt: null,
                  endsAt: null,
                },
              ],
            },
          ]),
        },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        code: 1,
        type: OrderType.TAKEAWAY,
        status: OrderStatus.PENDING,
        notes: null,
        createdAt: new Date(),
        subtotal: new Prisma.Decimal('15.00'),
        discount: new Prisma.Decimal('0.00'),
        deliveryFee: new Prisma.Decimal('0.00'),
        total: new Prisma.Decimal('15.00'),
        customer: null,
        table: null,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            productName: 'Burger',
            variantName: null,
            quantity: 2,
            unitPrice: new Prisma.Decimal('7.50'),
            totalPrice: new Prisma.Decimal('15.00'),
            notes: null,
            options: [],
          },
        ],
        statusHistory: [],
      });

      const result = await service.create(scope, {
        type: OrderType.TAKEAWAY,
        items: [
          { productId: 'product-1', quantity: 2 } as CreateOrderItemInput,
        ],
      } as CreateOrderInput);

      const createPayload = tx.order.create.mock.calls[0][0].data;
      const createdItem = createPayload.items.create[0];

      expect(createPayload.subtotal.toString()).toBe('15');
      expect(createPayload.total.toString()).toBe('15');
      expect(createdItem.unitPrice.toString()).toBe('7.5');
      expect(createdItem.totalPrice.toString()).toBe('15');
      expect(result.items[0].unitPrice).toBe(7.5);
      expect(result.total).toBe(15);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.update(scope, 'order-1', {} as UpdateOrderInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when updating a cancelled order', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
      });

      await expect(
        service.update(scope, 'order-1', {} as UpdateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when changing type to DINE_IN without tableId', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CONFIRMED,
      });

      await expect(
        service.update(scope, 'order-1', {
          type: OrderType.DINE_IN,
        } as UpdateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when tableId does not belong to unit', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CONFIRMED,
      });
      prisma.restaurantTable.findFirst.mockResolvedValue(null);

      await expect(
        service.update(scope, 'order-1', {
          type: OrderType.DINE_IN,
          tableId: 'table-1',
        } as UpdateOrderInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException when order does not exist', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.updateStatus(scope, 'order-1', {
          status: OrderStatus.CONFIRMED,
        } as UpdateOrderStatusInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when transitioning out of cancelled status', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'order-1',
            status: OrderStatus.CANCELLED,
          }),
          update: jest.fn(),
        },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      await expect(
        service.updateStatus(scope, 'order-1', {
          status: OrderStatus.CONFIRMED,
        } as UpdateOrderStatusInput),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('delegates to updateStatus with CANCELLED status', async () => {
      const tx = {
        order: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'order-1',
            status: OrderStatus.CONFIRMED,
          }),
          update: jest.fn(),
        },
        orderStatusHistory: { create: jest.fn() },
      };

      prisma.$transaction.mockImplementation((fn) => fn(tx));

      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        code: 1,
        type: OrderType.DINE_IN,
        status: OrderStatus.CANCELLED,
        notes: null,
        createdAt: new Date(),
        subtotal: new Prisma.Decimal('50.00'),
        discount: new Prisma.Decimal('0.00'),
        deliveryFee: new Prisma.Decimal('0.00'),
        total: new Prisma.Decimal('50.00'),
        customer: null,
        table: null,
        items: [],
        statusHistory: [],
      });

      const result = await service.cancel(scope, 'order-1', 'Customer request');

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OrderStatus.CANCELLED }),
        }),
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });
});
