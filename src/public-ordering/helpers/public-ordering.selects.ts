import { Prisma } from '@prisma/client';

export const ORDERING_UNIT_SELECT =
  Prisma.validator<Prisma.RestaurantUnitSelect>()({
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
  });

export type OrderingUnitContext = Prisma.RestaurantUnitGetPayload<{
  select: typeof ORDERING_UNIT_SELECT;
}>;

export const PUBLIC_CATALOG_PRODUCT_SELECT =
  Prisma.validator<Prisma.ProductSelect>()({
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

export type ProductCatalogRow = Prisma.ProductGetPayload<{
  select: typeof PUBLIC_CATALOG_PRODUCT_SELECT;
}>;

export const PUBLIC_MENU_CATEGORY_SELECT =
  Prisma.validator<Prisma.CategorySelect>()({
    id: true,
    name: true,
    sortOrder: true,
    products: {
      where: {
        isActive: true,
      },
      select: PUBLIC_CATALOG_PRODUCT_SELECT,
      orderBy: {
        name: 'asc',
      },
    },
  });

export type PublicMenuCategoryRow = Prisma.CategoryGetPayload<{
  select: typeof PUBLIC_MENU_CATEGORY_SELECT;
}>;

export const DELIVERY_ZONE_SELECT =
  Prisma.validator<Prisma.DeliveryZoneSelect>()({
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
  });

export type DeliveryZoneRow = Prisma.DeliveryZoneGetPayload<{
  select: typeof DELIVERY_ZONE_SELECT;
}>;

export const PUBLIC_ORDER_TRACKING_SELECT =
  Prisma.validator<Prisma.OrderSelect>()({
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
  });

export type PublicOrderTrackingRow = Prisma.OrderGetPayload<{
  select: typeof PUBLIC_ORDER_TRACKING_SELECT;
}>;

export const DELIVERY_BOARD_ORDER_SELECT =
  Prisma.validator<Prisma.OrderSelect>()({
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
  });

export type DeliveryBoardOrderRow = Prisma.OrderGetPayload<{
  select: typeof DELIVERY_BOARD_ORDER_SELECT;
}>;
