import { Prisma } from '@prisma/client';
import {
  CreateProductAvailabilityWindowInput,
  CreateProductInput,
  CreateProductOptionGroupInput,
  CreateProductPriceInput,
  CreateProductVariantInput,
  UpdateProductInput,
} from '../dto';

export const mapVariantCreateInput = (
  variants: CreateProductVariantInput[],
): Prisma.ProductVariantCreateWithoutProductInput[] =>
  variants.map((variant) => ({
    name: variant.name.trim(),
    sku: variant.sku?.trim(),
    priceDelta: new Prisma.Decimal(variant.priceDelta.toFixed(2)),
    isDefault: variant.isDefault ?? false,
  }));

export const mapVariantCreateManyInput = (
  productId: string,
  variants: CreateProductVariantInput[],
): Prisma.ProductVariantCreateManyInput[] =>
  variants.map((variant) => ({
    productId,
    name: variant.name.trim(),
    sku: variant.sku?.trim(),
    priceDelta: new Prisma.Decimal(variant.priceDelta.toFixed(2)),
    isDefault: variant.isDefault ?? false,
  }));

export const mapOptionGroupCreateInput = (
  optionGroups: CreateProductOptionGroupInput[],
): Prisma.ProductOptionGroupCreateWithoutProductInput[] =>
  optionGroups.map((group) => ({
    name: group.name.trim(),
    minSelect: group.minSelect ?? 0,
    maxSelect: group.maxSelect ?? 1,
    isRequired: group.isRequired ?? false,
    sortOrder: group.sortOrder ?? 0,
    options: {
      create: group.options.map((option) => ({
        name: option.name.trim(),
        priceDelta: new Prisma.Decimal(option.priceDelta.toFixed(2)),
        isActive: option.isActive ?? true,
      })),
    },
  }));

export const mapPriceCreateInput = (
  prices: CreateProductPriceInput[],
): Prisma.ProductPriceCreateWithoutProductInput[] =>
  prices.map((price) => ({
    name: price.name.trim(),
    price: new Prisma.Decimal(price.price.toFixed(2)),
    startsAt: price.startsAt ? new Date(price.startsAt) : undefined,
    endsAt: price.endsAt ? new Date(price.endsAt) : undefined,
  }));

export const mapPriceCreateManyInput = (
  productId: string,
  prices: CreateProductPriceInput[],
): Prisma.ProductPriceCreateManyInput[] =>
  prices.map((price) => ({
    productId,
    name: price.name.trim(),
    price: new Prisma.Decimal(price.price.toFixed(2)),
    startsAt: price.startsAt ? new Date(price.startsAt) : undefined,
    endsAt: price.endsAt ? new Date(price.endsAt) : undefined,
  }));

export const mapAvailabilityWindowCreateInput = (
  windows: CreateProductAvailabilityWindowInput[],
): Prisma.ProductAvailabilityWindowCreateWithoutProductInput[] =>
  windows.map((window) => ({
    fulfillmentType: window.fulfillmentType,
    dayOfWeek: window.dayOfWeek,
    startsAtMinutes: window.startsAtMinutes,
    endsAtMinutes: window.endsAtMinutes,
  }));

export const mapAvailabilityWindowCreateManyInput = (
  productId: string,
  windows: CreateProductAvailabilityWindowInput[],
): Prisma.ProductAvailabilityWindowCreateManyInput[] =>
  windows.map((window) => ({
    productId,
    fulfillmentType: window.fulfillmentType,
    dayOfWeek: window.dayOfWeek,
    startsAtMinutes: window.startsAtMinutes,
    endsAtMinutes: window.endsAtMinutes,
  }));

export const buildProductCreateData = (
  unitId: string,
  input: CreateProductInput,
) => ({
  unitId,
  categoryId: input.categoryId,
  name: input.name.trim(),
  description: input.description?.trim(),
  sku: input.sku?.trim(),
  basePrice: new Prisma.Decimal(input.basePrice.toFixed(2)),
  costPrice:
    typeof input.costPrice === 'number'
      ? new Prisma.Decimal(input.costPrice.toFixed(2))
      : undefined,
  imageUrl: input.imageUrl?.trim(),
  isActive: input.isActive ?? true,
  isAvailableForTakeaway: input.isAvailableForTakeaway ?? true,
  isAvailableForDelivery: input.isAvailableForDelivery ?? true,
  variants:
    input.variants && input.variants.length > 0
      ? {
          create: mapVariantCreateInput(input.variants),
        }
      : undefined,
  optionGroups:
    input.optionGroups && input.optionGroups.length > 0
      ? {
          create: mapOptionGroupCreateInput(input.optionGroups),
        }
      : undefined,
  prices:
    input.prices && input.prices.length > 0
      ? {
          create: mapPriceCreateInput(input.prices),
        }
      : undefined,
  availabilityWindows:
    input.availabilityWindows && input.availabilityWindows.length > 0
      ? {
          create: mapAvailabilityWindowCreateInput(input.availabilityWindows),
        }
      : undefined,
});

export const buildProductUpdateData = (
  input: UpdateProductInput,
): Prisma.ProductUncheckedUpdateInput => ({
  categoryId: input.categoryId,
  name: input.name?.trim(),
  description: input.description?.trim(),
  sku: input.sku?.trim(),
  basePrice:
    typeof input.basePrice === 'number'
      ? new Prisma.Decimal(input.basePrice.toFixed(2))
      : undefined,
  costPrice:
    typeof input.costPrice === 'number'
      ? new Prisma.Decimal(input.costPrice.toFixed(2))
      : undefined,
  imageUrl: input.imageUrl?.trim(),
  isActive: input.isActive,
  isAvailableForTakeaway: input.isAvailableForTakeaway,
  isAvailableForDelivery: input.isAvailableForDelivery,
});
