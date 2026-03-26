import { Prisma } from '@prisma/client';

const productListTypeSelect = Prisma.validator<Prisma.ProductDefaultArgs>()({
  select: {
    id: true,
    name: true,
    basePrice: true,
    costPrice: true,
    isActive: true,
    category: {
      select: {
        name: true,
      },
    },
    prices: {
      select: {
        price: true,
        startsAt: true,
        endsAt: true,
      },
    },
    recipe: {
      select: {
        items: {
          select: {
            quantity: true,
            ingredient: {
              select: {
                stockItems: {
                  select: {
                    currentQuantity: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export type ProductListRow = Prisma.ProductGetPayload<
  typeof productListTypeSelect
>;

export const buildProductListSelect = (
  unitId: string,
): Prisma.ProductSelect => ({
  id: true,
  name: true,
  basePrice: true,
  costPrice: true,
  isActive: true,
  category: {
    select: {
      name: true,
    },
  },
  prices: {
    select: {
      price: true,
      startsAt: true,
      endsAt: true,
    },
    orderBy: [{ startsAt: 'desc' }, { price: 'asc' }],
  },
  recipe: {
    select: {
      items: {
        select: {
          quantity: true,
          ingredient: {
            select: {
              stockItems: {
                where: {
                  unitId,
                },
                select: {
                  currentQuantity: true,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const productDetailsSelect =
  Prisma.validator<Prisma.ProductDefaultArgs>()({
    select: {
      id: true,
      name: true,
      description: true,
      categoryId: true,
      sku: true,
      basePrice: true,
      costPrice: true,
      imageUrl: true,
      isActive: true,
      isAvailableForTakeaway: true,
      isAvailableForDelivery: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          name: true,
        },
      },
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
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
          id: true,
          name: true,
          price: true,
          startsAt: true,
          endsAt: true,
        },
        orderBy: [{ startsAt: 'desc' }, { price: 'asc' }],
      },
      availabilityWindows: {
        select: {
          id: true,
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
    },
  });

export type ProductDetailsRow = Prisma.ProductGetPayload<
  typeof productDetailsSelect
>;

export const categoryDetailsSelect =
  Prisma.validator<Prisma.CategoryDefaultArgs>()({
    select: {
      id: true,
      name: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          products: true,
        },
      },
      products: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

export type CategoryDetailsRow = Prisma.CategoryGetPayload<
  typeof categoryDetailsSelect
>;

export const categorySummarySelect =
  Prisma.validator<Prisma.CategoryDefaultArgs>()({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          products: true,
        },
      },
      products: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });
