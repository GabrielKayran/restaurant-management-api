import { FulfillmentMethod } from '@prisma/client';
import { decimalToNumberOrZero } from '../../common/utils/decimal.util';
import { resolveSalePrice } from '../../common/utils/sale-price.util';
import {
  OrderItemOptionResponseDto,
  OrderItemResponseDto,
  OrderStatusHistoryResponseDto,
} from '../../orders/dto/order-details.response';
import {
  DeliveryBoardOrderCardResponseDto,
  PublicMenuOptionGroupResponseDto,
  PublicMenuOptionResponseDto,
  PublicMenuProductResponseDto,
  PublicMenuVariantResponseDto,
  PublicOperatingHourResponseDto,
  PublicProductAvailabilityWindowResponseDto,
  PublicStoreResponseDto,
} from '../dto';
import {
  buildFulfillmentAvailability,
  isProductAvailableForFulfillment,
  isUnitOpenNow,
} from './public-ordering.availability';
import {
  DeliveryBoardOrderRow,
  OrderingUnitContext,
  ProductCatalogRow,
  PublicOrderTrackingRow,
} from './public-ordering.selects';
import { TimeContext } from './public-ordering.types';

export const mapPublicStore = (
  unit: OrderingUnitContext,
  timeContext: TimeContext,
): PublicStoreResponseDto => ({
  id: unit.id,
  name: unit.name,
  slug: unit.slug,
  phone: unit.phone,
  orderingTimeZone: unit.orderingTimeZone,
  publicDescription: unit.publicDescription,
  pickupLeadTimeMinutes: unit.pickupLeadTimeMinutes,
  deliveryLeadTimeMinutes: unit.deliveryLeadTimeMinutes,
  takeaway: buildFulfillmentAvailability(
    unit,
    FulfillmentMethod.TAKEAWAY,
    timeContext,
  ),
  delivery: buildFulfillmentAvailability(
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
});

export const mapPublicProduct = (
  unit: OrderingUnitContext,
  product: ProductCatalogRow,
  timeContext: TimeContext,
): PublicMenuProductResponseDto => ({
  id: product.id,
  name: product.name,
  description: product.description,
  imageUrl: product.imageUrl,
  salePrice: resolveSalePrice(product.basePrice, product.prices),
  isAvailableForTakeaway: product.isAvailableForTakeaway,
  isAvailableForDelivery: product.isAvailableForDelivery,
  isCurrentlyAvailableForTakeaway:
    isUnitOpenNow(unit, FulfillmentMethod.TAKEAWAY, timeContext) &&
    isProductAvailableForFulfillment(
      product,
      FulfillmentMethod.TAKEAWAY,
      timeContext,
    ),
  isCurrentlyAvailableForDelivery:
    isUnitOpenNow(unit, FulfillmentMethod.DELIVERY, timeContext) &&
    isProductAvailableForFulfillment(
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
});

export const mapPersistedOrderItem = (
  item: PublicOrderTrackingRow['items'][number],
): OrderItemResponseDto => ({
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
});

export const mapStatusHistory = (
  history: PublicOrderTrackingRow['statusHistory'][number],
): OrderStatusHistoryResponseDto => ({
  id: history.id,
  fromStatus: history.fromStatus,
  toStatus: history.toStatus,
  reason: history.reason ?? null,
  changedAt: history.changedAt,
  changedByUserId: history.changedByUserId ?? null,
});

export const mapDeliveryBoardOrderCard = (
  order: DeliveryBoardOrderRow,
): DeliveryBoardOrderCardResponseDto => ({
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
});
