import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FulfillmentMethod,
  OrderChannel,
  OrderStatus,
  OrderType,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { createHash, randomUUID } from 'crypto';
import { AuditLoggerService } from '../common/services/audit-logger.service';
import { MemoryCacheService } from '../common/services/memory-cache.service';
import { RequestScope } from '../common/models/request-scope.model';
import { decimalToNumberOrZero } from '../common/utils/decimal.util';
import {
  sanitizePhone,
  sanitizeStateCode,
  sanitizeTrimmedString,
  sanitizeZipCode,
} from '../common/utils/sanitize.util';
import {
  OrderItemOptionResponseDto,
  OrderItemResponseDto,
  OrderStatusHistoryResponseDto,
} from '../orders/dto/order-details.response';
import { CreateOrderItemOptionInput } from '../orders/dto/create-order-item.input';
import { DeliveryBoardQueryDto } from './dto/delivery-board.query';
import {
  DeliveryBoardOrderCardResponseDto,
  DeliveryBoardResponseDto,
} from './dto/delivery-board.response';
import { PublicCheckoutInput } from './dto/public-checkout.input';
import {
  PublicCheckoutItemOptionResponseDto,
  PublicCheckoutItemResponseDto,
  PublicCheckoutQuoteResponseDto,
} from './dto/public-checkout.response';
import {
  PublicFulfillmentAvailabilityResponseDto,
  PublicMenuCategoryResponseDto,
  PublicMenuOptionGroupResponseDto,
  PublicMenuOptionResponseDto,
  PublicMenuProductResponseDto,
  PublicMenuResponseDto,
  PublicMenuVariantResponseDto,
  PublicOperatingHourResponseDto,
  PublicProductAvailabilityWindowResponseDto,
  PublicStoreResponseDto,
} from './dto/public-menu.response';
import { PublicOrderTrackingResponseDto } from './dto/public-order-tracking.response';

type PrismaDb = PrismaService | Prisma.TransactionClient;

type OrderingUnitContext = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  phone: string | null;
  publicDescription: string | null;
  orderingTimeZone: string;
  publicMenuEnabled: boolean;
  publicOrderingEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  pickupLeadTimeMinutes: number;
  deliveryLeadTimeMinutes: number;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  operatingHours: Array<{
    fulfillmentType: FulfillmentMethod;
    dayOfWeek: number;
    opensAtMinutes: number;
    closesAtMinutes: number;
    isClosed: boolean;
  }>;
};

const PUBLIC_CATALOG_PRODUCT_SELECT = Prisma.validator<Prisma.ProductSelect>()({
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  basePrice: true,
  isActive: true,
  isAvailableForTakeaway: true,
  isAvailableForDelivery: true,
  variants: {
    select: {
      id: true,
      name: true,
      priceDelta: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  },
  optionGroups: {
    select: {
      id: true,
      name: true,
      minSelect: true,
      maxSelect: true,
      isRequired: true,
      sortOrder: true,
      options: {
        select: {
          id: true,
          name: true,
          priceDelta: true,
          isActive: true,
        },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  },
  prices: {
    select: {
      price: true,
      startsAt: true,
      endsAt: true,
    },
    orderBy: [{ startsAt: 'desc' }, { price: 'asc' }],
  },
  availabilityWindows: {
    select: {
      fulfillmentType: true,
      dayOfWeek: true,
      startsAtMinutes: true,
      endsAtMinutes: true,
    },
    orderBy: [
      { fulfillmentType: 'asc' },
      { dayOfWeek: 'asc' },
      { startsAtMinutes: 'asc' },
    ],
  },
});

type ProductCatalogRow = Prisma.ProductGetPayload<{
  select: typeof PUBLIC_CATALOG_PRODUCT_SELECT;
}>;

type DeliveryZoneRow = {
  id: string;
  name: string;
  description: string | null;
  coverageRules: Array<{
    zipCodePrefix: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    sortOrder: number;
  }>;
  feeRules: Array<{
    minDistanceKm: Prisma.Decimal | null;
    maxDistanceKm: Prisma.Decimal | null;
    fee: Prisma.Decimal;
    minimumOrder: Prisma.Decimal | null;
  }>;
};

type TimeContext = {
  now: Date;
  dayOfWeek: number;
  minutesOfDay: number;
};

type DeliveryQuote = {
  zoneId: string | null;
  zoneName: string | null;
  distanceKm: number | null;
  fee: number;
};

type CheckoutComputation = {
  fulfillmentType: FulfillmentMethod;
  itemData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[];
  items: PublicCheckoutItemResponseDto[];
  subtotal: number;
  delivery: DeliveryQuote;
  total: number;
};

const PUBLIC_MENU_CACHE_TTL_MS = 60 * 1000;

@Injectable()
export class PublicOrderingService {
  private readonly logger = new Logger(PublicOrderingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async getPublicMenu(unitSlug: string): Promise<PublicMenuResponseDto> {
    const cacheKey = `public-menu:${unitSlug}`;
    const cached = this.cache.get<PublicMenuResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const unit = await this.getUnitBySlug(unitSlug);

    if (!unit.publicMenuEnabled) {
      throw new NotFoundException(
        'Cardapio publico indisponivel para esta unidade.',
      );
    }

    const timeContext = this.getTimeContext(unit.orderingTimeZone);
    const [categories, uncategorizedProducts] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          unitId: unit.id,
          products: {
            some: {
              isActive: true,
            },
          },
        },
        select: {
          id: true,
          name: true,
          sortOrder: true,
          products: {
            where: {
              isActive: true,
            },
            select: this.publicCatalogProductSelect(),
            orderBy: {
              name: 'asc',
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.product.findMany({
        where: {
          unitId: unit.id,
          categoryId: null,
          isActive: true,
        },
        select: this.publicCatalogProductSelect(),
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    const categoryResponses: PublicMenuCategoryResponseDto[] = categories.map(
      (category) => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        products: category.products.map((product) =>
          this.mapPublicProduct(unit, product, timeContext),
        ),
      }),
    );

    if (uncategorizedProducts.length > 0) {
      categoryResponses.push({
        id: 'uncategorized',
        name: 'Sem categoria',
        sortOrder: 9999,
        products: uncategorizedProducts.map((product) =>
          this.mapPublicProduct(unit, product, timeContext),
        ),
      });
    }

    const response: PublicMenuResponseDto = {
      store: this.mapPublicStore(unit, timeContext),
      categories: categoryResponses,
      generatedAt: timeContext.now,
      cacheTtlSeconds: PUBLIC_MENU_CACHE_TTL_MS / 1000,
    };

    return this.cache.set(cacheKey, response, PUBLIC_MENU_CACHE_TTL_MS);
  }

  async quoteCheckout(
    unitSlug: string,
    input: PublicCheckoutInput,
  ): Promise<PublicCheckoutQuoteResponseDto> {
    try {
      const unit = await this.getUnitBySlug(unitSlug);
      const timeContext = this.getTimeContext(unit.orderingTimeZone);
      const computation = await this.buildCheckout(
        unit,
        input,
        this.prisma,
        timeContext,
      );

      return {
        store: this.mapPublicStore(unit, timeContext),
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

    const unit = await this.getUnitBySlug(unitSlug);
    const payloadHash = this.hashPublicOrderPayload(input);
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

      return this.getPublicOrderStatus(existingOrder.publicToken);
    }

    try {
      const publicToken = await this.prisma.$transaction(async (tx) => {
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

          return insideExistingOrder.publicToken;
        }

        const timeContext = this.getTimeContext(unit.orderingTimeZone);
        const computation = await this.buildCheckout(
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

        return createdOrder.publicToken ?? newPublicToken;
      });

      this.auditLogger.log({
        action: 'public.order.created',
        actorUserId: 'public',
        tenantId: unit.tenantId,
        unitId: unit.id,
        targetType: 'order',
        targetId: publicToken,
        details: {
          unitSlug,
          orderType: input.type,
          sourceReference: input.sourceReference ?? null,
        },
      });

      return this.getPublicOrderStatus(publicToken);
    } catch (error) {
      this.logFailure('public.order.create.failed', error, {
        unitSlug,
        idempotencyKey: normalizedKey,
        type: input.type,
      });
      throw error;
    }
  }

  async getPublicOrderStatus(
    publicToken: string,
  ): Promise<PublicOrderTrackingResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        publicToken,
        channel: OrderChannel.PUBLIC_CATALOG,
      },
      select: {
        id: true,
        publicToken: true,
        code: true,
        channel: true,
        type: true,
        status: true,
        notes: true,
        createdAt: true,
        subtotal: true,
        deliveryFee: true,
        total: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        address: {
          select: {
            street: true,
            number: true,
            neighborhood: true,
            zipCode: true,
            reference: true,
          },
        },
        deliveryZone: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            notes: true,
            options: {
              select: {
                id: true,
                optionName: true,
                quantity: true,
                priceDelta: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
        statusHistory: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            reason: true,
            changedAt: true,
            changedByUserId: true,
          },
          orderBy: { changedAt: 'desc' },
        },
        payments: {
          select: {
            method: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
      },
    });

    if (!order?.publicToken) {
      throw new NotFoundException('Pedido publico nao encontrado.');
    }

    const [firstPayment] = order.payments;

    return {
      publicToken: order.publicToken,
      orderId: order.id,
      code: order.code,
      channel: order.channel,
      type: order.type,
      status: order.status,
      customerName: order.customer?.name ?? null,
      customerPhone: order.customer?.phone ?? null,
      deliveryZoneName: order.deliveryZone?.name ?? null,
      paymentMethod: firstPayment?.method ?? null,
      address: order.address
        ? {
            street: order.address.street,
            number: order.address.number,
            neighborhood: order.address.neighborhood ?? null,
            zipCode: order.address.zipCode,
            reference: order.address.reference ?? null,
          }
        : null,
      notes: order.notes ?? null,
      createdAt: order.createdAt,
      subtotal: decimalToNumberOrZero(order.subtotal),
      deliveryFee: decimalToNumberOrZero(order.deliveryFee),
      total: decimalToNumberOrZero(order.total),
      items: order.items.map((item) => this.mapPersistedOrderItem(item)),
      history: order.statusHistory.map((history) =>
        this.mapStatusHistory(history),
      ),
    };
  }

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
      select: {
        id: true,
        publicToken: true,
        code: true,
        status: true,
        total: true,
        notes: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        courier: {
          select: {
            name: true,
          },
        },
        address: {
          select: {
            street: true,
            number: true,
            neighborhood: true,
            zipCode: true,
            reference: true,
          },
        },
        deliveryZone: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { code: 'asc' }],
    });

    return {
      columns: allowedStatuses.map((status) => ({
        status,
        orders: orders
          .filter((order) => order.status === status)
          .map(
            (order): DeliveryBoardOrderCardResponseDto => ({
              id: order.id,
              publicToken: order.publicToken ?? null,
              code: order.code,
              status: order.status,
              customerName: order.customer?.name ?? null,
              customerPhone: order.customer?.phone ?? null,
              deliveryZoneName: order.deliveryZone?.name ?? null,
              courierName: order.courier?.name ?? null,
              address: order.address
                ? {
                    street: order.address.street,
                    number: order.address.number,
                    neighborhood: order.address.neighborhood ?? null,
                    zipCode: order.address.zipCode,
                    reference: order.address.reference ?? null,
                  }
                : null,
              itemsCount: order._count.items,
              total: decimalToNumberOrZero(order.total),
              notes: order.notes ?? null,
              createdAt: order.createdAt,
            }),
          ),
      })),
    };
  }

  private async buildCheckout(
    unit: OrderingUnitContext,
    input: PublicCheckoutInput,
    db: PrismaDb,
    timeContext: TimeContext,
  ): Promise<CheckoutComputation> {
    const fulfillmentType = this.resolveFulfillmentType(input.type);

    if (!unit.publicOrderingEnabled) {
      throw new BadRequestException(
        'Pedidos publicos estao desabilitados para esta unidade.',
      );
    }

    if (!this.isUnitEnabledForFulfillment(unit, fulfillmentType)) {
      throw new BadRequestException(
        fulfillmentType === FulfillmentMethod.DELIVERY
          ? 'Delivery proprio indisponivel nesta unidade.'
          : 'Retirada indisponivel nesta unidade.',
      );
    }

    if (!this.isUnitOpenNow(unit, fulfillmentType, timeContext)) {
      throw new BadRequestException(
        fulfillmentType === FulfillmentMethod.DELIVERY
          ? 'Loja fechada para delivery neste momento.'
          : 'Loja fechada para retirada neste momento.',
      );
    }

    if (!input.items?.length) {
      throw new BadRequestException('Carrinho deve conter ao menos um item.');
    }

    if (
      fulfillmentType === FulfillmentMethod.DELIVERY &&
      (!input.address ||
        !input.address.street ||
        !input.address.number ||
        !input.address.city ||
        !input.address.state ||
        !input.address.zipCode)
    ) {
      throw new BadRequestException(
        'Endereco completo e obrigatorio para pedidos de delivery.',
      );
    }

    const productMap = await this.loadProductMap(
      db,
      unit.id,
      input.items.map((item) => item.productId),
    );

    const quoteItems: PublicCheckoutItemResponseDto[] = [];
    const itemData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BadRequestException(
          'Um ou mais produtos sao invalidos para esta unidade.',
        );
      }

      if (!product.isActive) {
        throw new BadRequestException('Produto inativo nao pode ser pedido.');
      }

      if (
        !this.isProductAvailableForFulfillment(
          product,
          fulfillmentType,
          timeContext,
        )
      ) {
        throw new BadRequestException(
          `Produto "${product.name}" indisponivel para o tipo de pedido selecionado.`,
        );
      }

      const variant =
        item.variantId !== undefined
          ? this.resolveVariant(product, item.variantId)
          : product.variants.find((entry) => entry.isDefault) ?? null;
      const { options, optionData, optionsTotalPerUnit } =
        this.resolveSelectedOptions(product, item.options ?? []);
      const basePrice = this.resolveSalePrice(
        product.basePrice,
        product.prices,
      );
      const unitPrice =
        basePrice +
        decimalToNumberOrZero(variant?.priceDelta ?? null) +
        optionsTotalPerUnit;
      const totalPrice = unitPrice * item.quantity;

      subtotal += totalPrice;
      quoteItems.push({
        productId: product.id,
        productName: product.name,
        variantName: variant?.name ?? null,
        quantity: item.quantity,
        unitPrice: Number(unitPrice.toFixed(2)),
        totalPrice: Number(totalPrice.toFixed(2)),
        notes: item.notes ?? null,
        options,
      });
      itemData.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        variantName: variant?.name ?? null,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice.toFixed(2)),
        totalPrice: new Prisma.Decimal(totalPrice.toFixed(2)),
        notes: item.notes ?? null,
        options: {
          create: optionData,
        },
      });
    }

    const delivery =
      fulfillmentType === FulfillmentMethod.DELIVERY
        ? await this.resolveDeliveryQuote(db, unit, input, subtotal)
        : {
            zoneId: null,
            zoneName: null,
            distanceKm: null,
            fee: 0,
          };

    return {
      fulfillmentType,
      items: quoteItems,
      itemData,
      subtotal: Number(subtotal.toFixed(2)),
      delivery,
      total: Number((subtotal + delivery.fee).toFixed(2)),
    };
  }

  private async resolveDeliveryQuote(
    db: PrismaDb,
    unit: OrderingUnitContext,
    input: PublicCheckoutInput,
    subtotal: number,
  ): Promise<DeliveryQuote> {
    const address = input.address;

    if (!address) {
      throw new BadRequestException(
        'Endereco completo e obrigatorio para pedidos de delivery.',
      );
    }

    const zones = await db.deliveryZone.findMany({
      where: {
        unitId: unit.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverageRules: {
          select: {
            zipCodePrefix: true,
            neighborhood: true,
            city: true,
            state: true,
            sortOrder: true,
          },
          orderBy: [{ sortOrder: 'asc' }],
        },
        feeRules: {
          select: {
            minDistanceKm: true,
            maxDistanceKm: true,
            fee: true,
            minimumOrder: true,
          },
          orderBy: [{ minimumOrder: 'desc' }, { fee: 'asc' }],
        },
      },
    });

    if (!zones.length) {
      throw new BadRequestException(
        'Nenhuma zona de entrega ativa foi configurada para esta unidade.',
      );
    }

    const matchedZone = this.selectMatchingDeliveryZone(zones, address);

    if (!matchedZone) {
      throw new BadRequestException(
        'Endereco fora da area de entrega configurada.',
      );
    }

    const distanceKm = this.computeDistanceKm(
      unit.latitude,
      unit.longitude,
      address.latitude ?? null,
      address.longitude ?? null,
    );
    const feeRule = this.selectFeeRule(matchedZone, subtotal, distanceKm);

    if (!feeRule) {
      throw new BadRequestException(
        'Nao foi encontrada regra de taxa compativel para este endereco.',
      );
    }

    return {
      zoneId: matchedZone.id,
      zoneName: matchedZone.name,
      distanceKm,
      fee: decimalToNumberOrZero(feeRule.fee),
    };
  }

  private selectMatchingDeliveryZone(
    zones: DeliveryZoneRow[],
    address: NonNullable<PublicCheckoutInput['address']>,
  ): DeliveryZoneRow | null {
    const normalizedNeighborhood =
      sanitizeTrimmedString(address.neighborhood)?.toLowerCase() ?? '';
    const normalizedCity =
      sanitizeTrimmedString(address.city)?.toLowerCase() ?? '';
    const normalizedState =
      sanitizeStateCode(address.state)?.toLowerCase() ?? '';
    const normalizedZipCode = sanitizeZipCode(address.zipCode) ?? '';

    const scored = zones
      .map((zone) => {
        let score = 0;

        for (const rule of zone.coverageRules) {
          if (
            rule.zipCodePrefix &&
            normalizedZipCode.startsWith(rule.zipCodePrefix)
          ) {
            score = Math.max(score, 300 + rule.zipCodePrefix.length);
          }

          const ruleNeighborhood =
            sanitizeTrimmedString(rule.neighborhood)?.toLowerCase() ?? '';
          const ruleCity =
            sanitizeTrimmedString(rule.city)?.toLowerCase() ?? normalizedCity;
          const ruleState =
            sanitizeStateCode(rule.state)?.toLowerCase() ?? normalizedState;

          if (
            ruleNeighborhood &&
            ruleNeighborhood === normalizedNeighborhood &&
            ruleCity === normalizedCity &&
            ruleState === normalizedState
          ) {
            score = Math.max(score, 250);
          } else if (
            !ruleNeighborhood &&
            ruleCity === normalizedCity &&
            ruleState === normalizedState
          ) {
            score = Math.max(score, 150);
          }
        }

        return {
          zone,
          score,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);

    return scored[0]?.zone ?? null;
  }

  private selectFeeRule(
    zone: DeliveryZoneRow,
    subtotal: number,
    distanceKm: number | null,
  ) {
    return zone.feeRules.find((rule) => {
      const minimumOrder = decimalToNumberOrZero(rule.minimumOrder);

      if (minimumOrder > 0 && subtotal < minimumOrder) {
        return false;
      }

      const minDistance = decimalToNumberOrZero(rule.minDistanceKm);
      const maxDistance =
        rule.maxDistanceKm === null
          ? Number.POSITIVE_INFINITY
          : decimalToNumberOrZero(rule.maxDistanceKm);

      if (rule.minDistanceKm === null && rule.maxDistanceKm === null) {
        return true;
      }

      if (distanceKm === null) {
        return false;
      }

      return distanceKm >= minDistance && distanceKm <= maxDistance;
    });
  }

  private async loadProductMap(
    db: PrismaDb,
    unitId: string,
    productIds: string[],
  ): Promise<Map<string, ProductCatalogRow>> {
    const uniqueProductIds = [...new Set(productIds)];
    const products = await db.product.findMany({
      where: {
        unitId,
        id: {
          in: uniqueProductIds,
        },
      },
      select: this.publicCatalogProductSelect(),
    });

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestException(
        'Um ou mais produtos sao invalidos para esta unidade.',
      );
    }

    return new Map(products.map((product) => [product.id, product]));
  }

  private resolveSelectedOptions(
    product: ProductCatalogRow,
    selectedOptions: CreateOrderItemOptionInput[],
  ): {
    options: PublicCheckoutItemOptionResponseDto[];
    optionData: Prisma.OrderItemOptionUncheckedCreateWithoutOrderItemInput[];
    optionsTotalPerUnit: number;
  } {
    const optionById = new Map<
      string,
      {
        groupId: string;
        option: ProductCatalogRow['optionGroups'][number]['options'][number];
      }
    >();
    const selectedCountByGroupId = new Map<string, number>();
    const options: PublicCheckoutItemOptionResponseDto[] = [];
    const optionData: Prisma.OrderItemOptionUncheckedCreateWithoutOrderItemInput[] =
      [];
    let optionsTotalPerUnit = 0;

    for (const group of product.optionGroups) {
      for (const option of group.options) {
        optionById.set(option.id, {
          groupId: group.id,
          option,
        });
      }
    }

    for (const selectedOption of selectedOptions) {
      const resolved = optionById.get(selectedOption.productOptionId);

      if (!resolved || !resolved.option.isActive) {
        throw new BadRequestException(
          `Opcao invalida para o produto "${product.name}".`,
        );
      }

      const quantity = selectedOption.quantity ?? 1;
      optionsTotalPerUnit +=
        decimalToNumberOrZero(resolved.option.priceDelta) * quantity;
      selectedCountByGroupId.set(
        resolved.groupId,
        (selectedCountByGroupId.get(resolved.groupId) ?? 0) + quantity,
      );
      options.push({
        optionName: resolved.option.name,
        quantity,
        priceDelta: decimalToNumberOrZero(resolved.option.priceDelta),
      });
      optionData.push({
        productOptionId: resolved.option.id,
        optionName: resolved.option.name,
        priceDelta: resolved.option.priceDelta,
        quantity,
      });
    }

    for (const group of product.optionGroups) {
      const selectedCount = selectedCountByGroupId.get(group.id) ?? 0;

      if (group.isRequired && selectedCount === 0) {
        throw new BadRequestException(
          `Grupo obrigatorio "${group.name}" nao foi selecionado.`,
        );
      }

      if (selectedCount < group.minSelect) {
        throw new BadRequestException(
          `Grupo "${group.name}" exige ao menos ${group.minSelect} selecoes.`,
        );
      }

      if (selectedCount > group.maxSelect) {
        throw new BadRequestException(
          `Grupo "${group.name}" permite no maximo ${group.maxSelect} selecoes.`,
        );
      }
    }

    return { options, optionData, optionsTotalPerUnit };
  }

  private resolveVariant(product: ProductCatalogRow, variantId: string) {
    const variant = product.variants.find((entry) => entry.id === variantId);

    if (!variant) {
      throw new BadRequestException(
        `Variante invalida para o produto "${product.name}".`,
      );
    }

    return variant;
  }

  private resolveFulfillmentType(type: OrderType): FulfillmentMethod {
    if (type === OrderType.TAKEAWAY) {
      return FulfillmentMethod.TAKEAWAY;
    }

    if (type === OrderType.DELIVERY) {
      return FulfillmentMethod.DELIVERY;
    }

    throw new BadRequestException(
      'Canal publico aceita apenas pedidos TAKEAWAY ou DELIVERY.',
    );
  }

  private isUnitEnabledForFulfillment(
    unit: OrderingUnitContext,
    fulfillmentType: FulfillmentMethod,
  ): boolean {
    return fulfillmentType === FulfillmentMethod.DELIVERY
      ? unit.deliveryEnabled
      : unit.takeawayEnabled;
  }

  private isProductAvailableForFulfillment(
    product: ProductCatalogRow,
    fulfillmentType: FulfillmentMethod,
    timeContext: TimeContext,
  ): boolean {
    const enabledByFlag =
      fulfillmentType === FulfillmentMethod.DELIVERY
        ? product.isAvailableForDelivery
        : product.isAvailableForTakeaway;

    if (!enabledByFlag) {
      return false;
    }

    const windows = product.availabilityWindows.filter(
      (window) =>
        window.fulfillmentType === fulfillmentType &&
        window.dayOfWeek === timeContext.dayOfWeek,
    );

    if (windows.length === 0) {
      return true;
    }

    return windows.some((window) =>
      this.isMinuteWithinRange(
        timeContext.minutesOfDay,
        window.startsAtMinutes,
        window.endsAtMinutes,
      ),
    );
  }

  private isUnitOpenNow(
    unit: OrderingUnitContext,
    fulfillmentType: FulfillmentMethod,
    timeContext: TimeContext,
  ): boolean {
    const dayHours = unit.operatingHours.filter(
      (hour) =>
        hour.fulfillmentType === fulfillmentType &&
        hour.dayOfWeek === timeContext.dayOfWeek &&
        !hour.isClosed,
    );

    if (dayHours.length === 0) {
      return true;
    }

    return dayHours.some((hour) =>
      this.isMinuteWithinRange(
        timeContext.minutesOfDay,
        hour.opensAtMinutes,
        hour.closesAtMinutes,
      ),
    );
  }

  private isMinuteWithinRange(
    currentMinute: number,
    startMinute: number,
    endMinute: number,
  ): boolean {
    return currentMinute >= startMinute && currentMinute < endMinute;
  }

  private mapPublicStore(
    unit: OrderingUnitContext,
    timeContext: TimeContext,
  ): PublicStoreResponseDto {
    return {
      id: unit.id,
      name: unit.name,
      slug: unit.slug,
      phone: unit.phone,
      orderingTimeZone: unit.orderingTimeZone,
      publicDescription: unit.publicDescription,
      pickupLeadTimeMinutes: unit.pickupLeadTimeMinutes,
      deliveryLeadTimeMinutes: unit.deliveryLeadTimeMinutes,
      takeaway: this.buildFulfillmentAvailability(
        unit,
        FulfillmentMethod.TAKEAWAY,
        timeContext,
      ),
      delivery: this.buildFulfillmentAvailability(
        unit,
        FulfillmentMethod.DELIVERY,
        timeContext,
      ),
      operatingHours: unit.operatingHours.map(
        (hour): PublicOperatingHourResponseDto => ({
          fulfillmentType: hour.fulfillmentType,
          dayOfWeek: hour.dayOfWeek,
          opensAtMinutes: hour.opensAtMinutes,
          closesAtMinutes: hour.closesAtMinutes,
          isClosed: hour.isClosed,
        }),
      ),
    };
  }

  private buildFulfillmentAvailability(
    unit: OrderingUnitContext,
    fulfillmentType: FulfillmentMethod,
    timeContext: TimeContext,
  ): PublicFulfillmentAvailabilityResponseDto {
    return {
      enabled: this.isUnitEnabledForFulfillment(unit, fulfillmentType),
      isOpenNow: this.isUnitOpenNow(unit, fulfillmentType, timeContext),
    };
  }

  private mapPublicProduct(
    unit: OrderingUnitContext,
    product: ProductCatalogRow,
    timeContext: TimeContext,
  ): PublicMenuProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      salePrice: this.resolveSalePrice(product.basePrice, product.prices),
      isAvailableForTakeaway: product.isAvailableForTakeaway,
      isAvailableForDelivery: product.isAvailableForDelivery,
      isCurrentlyAvailableForTakeaway:
        this.isUnitOpenNow(unit, FulfillmentMethod.TAKEAWAY, timeContext) &&
        this.isProductAvailableForFulfillment(
          product,
          FulfillmentMethod.TAKEAWAY,
          timeContext,
        ),
      isCurrentlyAvailableForDelivery:
        this.isUnitOpenNow(unit, FulfillmentMethod.DELIVERY, timeContext) &&
        this.isProductAvailableForFulfillment(
          product,
          FulfillmentMethod.DELIVERY,
          timeContext,
        ),
      variants: product.variants.map(
        (variant): PublicMenuVariantResponseDto => ({
          id: variant.id,
          name: variant.name,
          priceDelta: decimalToNumberOrZero(variant.priceDelta),
          isDefault: variant.isDefault,
        }),
      ),
      optionGroups: product.optionGroups
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map(
          (group): PublicMenuOptionGroupResponseDto => ({
            id: group.id,
            name: group.name,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
            isRequired: group.isRequired,
            options: group.options
              .filter((option) => option.isActive)
              .map(
                (option): PublicMenuOptionResponseDto => ({
                  id: option.id,
                  name: option.name,
                  priceDelta: decimalToNumberOrZero(option.priceDelta),
                }),
              ),
          }),
        ),
      availabilityWindows: product.availabilityWindows.map(
        (window): PublicProductAvailabilityWindowResponseDto => ({
          fulfillmentType: window.fulfillmentType,
          dayOfWeek: window.dayOfWeek,
          startsAtMinutes: window.startsAtMinutes,
          endsAtMinutes: window.endsAtMinutes,
        }),
      ),
    };
  }

  private mapPersistedOrderItem(item: {
    id: string;
    productId: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    unitPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
    notes: string | null;
    options: Array<{
      id: string;
      optionName: string;
      quantity: number;
      priceDelta: Prisma.Decimal;
    }>;
  }): OrderItemResponseDto {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName ?? null,
      quantity: item.quantity,
      unitPrice: decimalToNumberOrZero(item.unitPrice),
      totalPrice: decimalToNumberOrZero(item.totalPrice),
      notes: item.notes ?? null,
      options: item.options.map(
        (option): OrderItemOptionResponseDto => ({
          id: option.id,
          optionName: option.optionName,
          quantity: option.quantity,
          priceDelta: decimalToNumberOrZero(option.priceDelta),
        }),
      ),
    };
  }

  private mapStatusHistory(history: {
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    reason: string | null;
    changedAt: Date;
    changedByUserId: string | null;
  }): OrderStatusHistoryResponseDto {
    return {
      id: history.id,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      reason: history.reason ?? null,
      changedAt: history.changedAt,
      changedByUserId: history.changedByUserId ?? null,
    };
  }

  private hashPublicOrderPayload(input: PublicCheckoutInput): string {
    const payload = {
      type: input.type,
      customer: {
        name: input.customer.name,
        phone: input.customer.phone,
        email: input.customer.email ?? null,
        document: input.customer.document ?? null,
      },
      address: input.address
        ? {
            street: input.address.street,
            number: input.address.number,
            complement: input.address.complement ?? null,
            neighborhood: input.address.neighborhood,
            city: input.address.city,
            state: input.address.state,
            zipCode: input.address.zipCode,
            reference: input.address.reference ?? null,
            latitude: input.address.latitude ?? null,
            longitude: input.address.longitude ?? null,
          }
        : null,
      notes: input.notes ?? null,
      paymentMethod: input.paymentMethod ?? null,
      sourceReference: input.sourceReference ?? null,
      items: input.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        notes: item.notes ?? null,
        options: (item.options ?? [])
          .map((option) => ({
            productOptionId: option.productOptionId,
            quantity: option.quantity ?? 1,
          }))
          .sort((left, right) =>
            left.productOptionId.localeCompare(right.productOptionId),
          ),
      })),
    };

    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
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

  private getTimeContext(timeZone: string): TimeContext {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(now);
    const weekday =
      parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
    const hour = Number(
      parts.find((part) => part.type === 'hour')?.value ?? '0',
    );
    const minute = Number(
      parts.find((part) => part.type === 'minute')?.value ?? '0',
    );

    return {
      now,
      dayOfWeek: this.weekdayToNumber(weekday),
      minutesOfDay: hour * 60 + minute,
    };
  }

  private weekdayToNumber(weekday: string): number {
    const normalized = weekday.slice(0, 3).toLowerCase();

    if (normalized === 'sun') return 0;
    if (normalized === 'mon') return 1;
    if (normalized === 'tue') return 2;
    if (normalized === 'wed') return 3;
    if (normalized === 'thu') return 4;
    if (normalized === 'fri') return 5;
    return 6;
  }

  private resolveSalePrice(
    basePrice: Prisma.Decimal,
    prices: Array<{
      price: Prisma.Decimal;
      startsAt: Date | null;
      endsAt: Date | null;
    }>,
    referenceDate: Date = new Date(),
  ): number {
    const activeScheduledPrice = prices.find((price) => {
      const startsAt = price.startsAt?.getTime() ?? Number.NEGATIVE_INFINITY;
      const endsAt = price.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const reference = referenceDate.getTime();
      return reference >= startsAt && reference <= endsAt;
    });

    return decimalToNumberOrZero(activeScheduledPrice?.price ?? basePrice);
  }

  private computeDistanceKm(
    unitLatitude: Prisma.Decimal | null,
    unitLongitude: Prisma.Decimal | null,
    customerLatitude: number | null,
    customerLongitude: number | null,
  ): number | null {
    if (
      unitLatitude === null ||
      unitLongitude === null ||
      customerLatitude === null ||
      customerLongitude === null
    ) {
      return null;
    }

    const lat1 = this.toRadians(decimalToNumberOrZero(unitLatitude));
    const lon1 = this.toRadians(decimalToNumberOrZero(unitLongitude));
    const lat2 = this.toRadians(customerLatitude);
    const lon2 = this.toRadians(customerLongitude);
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number(distance.toFixed(2));
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private publicCatalogProductSelect() {
    return PUBLIC_CATALOG_PRODUCT_SELECT;
  }

  private async getUnitBySlug(unitSlug: string): Promise<OrderingUnitContext> {
    const unit = await this.prisma.restaurantUnit.findFirst({
      where: {
        slug: unitSlug,
        isActive: true,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        phone: true,
        publicDescription: true,
        orderingTimeZone: true,
        publicMenuEnabled: true,
        publicOrderingEnabled: true,
        takeawayEnabled: true,
        deliveryEnabled: true,
        pickupLeadTimeMinutes: true,
        deliveryLeadTimeMinutes: true,
        latitude: true,
        longitude: true,
        operatingHours: {
          select: {
            fulfillmentType: true,
            dayOfWeek: true,
            opensAtMinutes: true,
            closesAtMinutes: true,
            isClosed: true,
          },
          orderBy: [
            { fulfillmentType: 'asc' },
            { dayOfWeek: 'asc' },
            { opensAtMinutes: 'asc' },
          ],
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unidade publica nao encontrada.');
    }

    return unit;
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
