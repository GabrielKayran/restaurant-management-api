import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  FulfillmentMethod,
  OrderChannel,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'nestjs-prisma';
import { AuditLoggerService } from '../../common/services/audit-logger.service';
import {
  sanitizePhone,
  sanitizeTrimmedString,
} from '../../common/utils/sanitize.util';
import { OrdersRealtimePublisher } from '../../orders-realtime/orders-realtime.publisher';
import {
  getTimeContext,
  hashPublicOrderPayload,
  mapPublicStore,
  OrderingUnitContext,
} from '../helpers';
import {
  PublicCheckoutInput,
  PublicCheckoutQuoteResponseDto,
  PublicOrderTrackingResponseDto,
} from '../dto';
import { PublicCheckoutComputationService } from './public-checkout-computation.service';
import { PublicOrderingContextService } from './public-ordering-context.service';
import { PublicOrderStatusService } from './public-order-status.service';

@Injectable()
export class PublicCheckoutService {
  private readonly logger = new Logger(PublicCheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
    private readonly contextService: PublicOrderingContextService,
    private readonly computationService: PublicCheckoutComputationService,
    private readonly orderStatusService: PublicOrderStatusService,
    private readonly ordersRealtimePublisher: OrdersRealtimePublisher,
  ) {}

  async quoteCheckout(
    unitSlug: string,
    input: PublicCheckoutInput,
  ): Promise<PublicCheckoutQuoteResponseDto> {
    try {
      const unit = await this.contextService.getUnitBySlug(unitSlug);
      const timeContext = getTimeContext(unit.orderingTimeZone);
      const computation = await this.computationService.buildCheckout(
        unit,
        input,
        this.prisma,
        timeContext,
      );

      return {
        store: mapPublicStore(unit, timeContext),
        type: input.type,
        items: computation.items,
        subtotal: computation.subtotal,
        deliveryFee: computation.delivery.fee,
        total: computation.total,
        delivery: {
          zoneId: computation.delivery.zoneId,
          zoneName: computation.delivery.zoneName,
          distanceKm: computation.delivery.distanceKm,
        },
      };
    } catch (error) {
      this.logFailure('public.checkout.quote.failed', error, {
        unitSlug,
        type: input.type,
      });
      throw error;
    }
  }

  async createPublicOrder(
    unitSlug: string,
    input: PublicCheckoutInput,
    idempotencyKey?: string,
  ): Promise<PublicOrderTrackingResponseDto> {
    const normalizedKey = sanitizeTrimmedString(idempotencyKey);

    if (!normalizedKey) {
      throw new BadRequestException(
        'Cabecalho Idempotency-Key e obrigatorio para criar pedidos publicos.',
      );
    }

    const unit = await this.contextService.getUnitBySlug(unitSlug);
    const payloadHash = hashPublicOrderPayload(input);
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        unitId: unit.id,
        idempotencyKey: normalizedKey,
      },
      select: {
        publicToken: true,
        idempotencyHash: true,
      },
    });

    if (existingOrder?.publicToken) {
      if (existingOrder.idempotencyHash !== payloadHash) {
        throw new ConflictException(
          'Idempotency-Key ja foi usada com um payload diferente.',
        );
      }

      return this.orderStatusService.getPublicOrderStatus(
        existingOrder.publicToken,
      );
    }

    try {
      const createdOrder = await this.prisma.$transaction(async (tx) => {
        const insideExistingOrder = await tx.order.findFirst({
          where: {
            unitId: unit.id,
            idempotencyKey: normalizedKey,
          },
          select: {
            publicToken: true,
            idempotencyHash: true,
          },
        });

        if (insideExistingOrder?.publicToken) {
          if (insideExistingOrder.idempotencyHash !== payloadHash) {
            throw new ConflictException(
              'Idempotency-Key ja foi usada com um payload diferente.',
            );
          }

          return {
            orderId: null,
            publicToken: insideExistingOrder.publicToken,
          };
        }

        const timeContext = getTimeContext(unit.orderingTimeZone);
        const computation = await this.computationService.buildCheckout(
          unit,
          input,
          tx,
          timeContext,
        );
        const customer = await this.findOrCreateCustomer(tx, unit, input);
        const address =
          computation.fulfillmentType === FulfillmentMethod.DELIVERY
            ? await this.findOrCreateAddress(tx, customer.id, input)
            : null;
        const lastOrder = await tx.order.findFirst({
          where: { unitId: unit.id },
          orderBy: { code: 'desc' },
          select: { code: true },
        });
        const newPublicToken = randomUUID();

        const createdOrder = await tx.order.create({
          data: {
            unitId: unit.id,
            customerId: customer.id,
            addressId: address?.id,
            deliveryZoneId: computation.delivery.zoneId,
            code: (lastOrder?.code ?? 0) + 1,
            channel: OrderChannel.PUBLIC_CATALOG,
            type: input.type,
            status: OrderStatus.PENDING,
            subtotal: new Prisma.Decimal(computation.subtotal.toFixed(2)),
            discount: new Prisma.Decimal(0),
            deliveryFee: new Prisma.Decimal(
              computation.delivery.fee.toFixed(2),
            ),
            total: new Prisma.Decimal(computation.total.toFixed(2)),
            notes: input.notes ?? null,
            publicToken: newPublicToken,
            idempotencyKey: normalizedKey,
            idempotencyHash: payloadHash,
            sourceReference: input.sourceReference ?? null,
            items: {
              create: computation.itemData,
            },
            payments: input.paymentMethod
              ? {
                  create: {
                    method: input.paymentMethod,
                    amount: new Prisma.Decimal(computation.total.toFixed(2)),
                    status: PaymentStatus.PENDING,
                  },
                }
              : undefined,
          },
          select: {
            id: true,
            publicToken: true,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: createdOrder.id,
            fromStatus: null,
            toStatus: OrderStatus.PENDING,
            reason: 'Pedido publico criado.',
          },
        });

        return {
          orderId: createdOrder.id,
          publicToken: createdOrder.publicToken ?? newPublicToken,
        };
      });

      this.auditLogger.log({
        action: 'public.order.created',
        actorUserId: 'public',
        tenantId: unit.tenantId,
        unitId: unit.id,
        targetType: 'order',
        targetId: createdOrder.publicToken,
        details: {
          unitSlug,
          orderType: input.type,
          sourceReference: input.sourceReference ?? null,
        },
      });

      if (createdOrder.orderId) {
        await this.ordersRealtimePublisher.publishOrderCreated(
          createdOrder.orderId,
        );
      }

      return this.orderStatusService.getPublicOrderStatus(
        createdOrder.publicToken,
      );
    } catch (error) {
      this.logFailure('public.order.create.failed', error, {
        unitSlug,
        idempotencyKey: normalizedKey,
        type: input.type,
      });
      throw error;
    }
  }

  private async findOrCreateCustomer(
    tx: Prisma.TransactionClient,
    unit: OrderingUnitContext,
    input: PublicCheckoutInput,
  ) {
    const phone = sanitizePhone(input.customer.phone);
    const email =
      sanitizeTrimmedString(input.customer.email)?.toLowerCase() ?? null;

    const existingCustomer = await tx.customer.findFirst({
      where: {
        tenantId: unit.tenantId,
        OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    });

    const customerData: Prisma.CustomerUncheckedCreateInput = {
      tenantId: unit.tenantId,
      unitId: unit.id,
      name: sanitizeTrimmedString(input.customer.name) ?? input.customer.name,
      phone,
      email,
      document: sanitizeTrimmedString(input.customer.document) ?? null,
    };

    if (existingCustomer) {
      return tx.customer.update({
        where: {
          id: existingCustomer.id,
        },
        data: {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          document: customerData.document,
          unitId: unit.id,
        },
        select: {
          id: true,
        },
      });
    }

    return tx.customer.create({
      data: customerData,
      select: {
        id: true,
      },
    });
  }

  private async findOrCreateAddress(
    tx: Prisma.TransactionClient,
    customerId: string,
    input: PublicCheckoutInput,
  ) {
    const address = input.address;

    if (!address) {
      throw new BadRequestException(
        'Endereco completo e obrigatorio para pedidos de delivery.',
      );
    }

    const existingAddress = await tx.address.findFirst({
      where: {
        customerId,
        street: address.street,
        number: address.number,
        zipCode: address.zipCode,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    });

    const addressData: Prisma.AddressUncheckedCreateInput = {
      customerId,
      street: address.street,
      number: address.number,
      complement: address.complement ?? null,
      neighborhood: address.neighborhood ?? null,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      reference: address.reference ?? null,
      latitude:
        typeof address.latitude === 'number'
          ? new Prisma.Decimal(address.latitude.toFixed(7))
          : undefined,
      longitude:
        typeof address.longitude === 'number'
          ? new Prisma.Decimal(address.longitude.toFixed(7))
          : undefined,
    };

    if (existingAddress) {
      return tx.address.update({
        where: {
          id: existingAddress.id,
        },
        data: addressData,
        select: {
          id: true,
        },
      });
    }

    return tx.address.create({
      data: addressData,
      select: {
        id: true,
      },
    });
  }

  private logFailure(
    action: string,
    error: unknown,
    details: Record<string, unknown>,
  ): void {
    this.logger.error(
      JSON.stringify({
        action,
        error:
          error instanceof Error
            ? {
                message: error.message,
                name: error.name,
              }
            : String(error),
        details,
      }),
    );
  }
}
