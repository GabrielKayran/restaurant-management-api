import { BadRequestException } from '@nestjs/common';
import { FulfillmentMethod, OrderType } from '@prisma/client';
import { PublicFulfillmentAvailabilityResponseDto } from '../dto';
import {
  OrderingUnitContext,
  ProductCatalogRow,
} from './public-ordering.selects';
import { TimeContext } from './public-ordering.types';

export const resolveFulfillmentType = (type: OrderType): FulfillmentMethod => {
  if (type === OrderType.TAKEAWAY) {
    return FulfillmentMethod.TAKEAWAY;
  }

  if (type === OrderType.DELIVERY) {
    return FulfillmentMethod.DELIVERY;
  }

  throw new BadRequestException(
    'Canal publico aceita apenas pedidos TAKEAWAY ou DELIVERY.',
  );
};

export const isUnitEnabledForFulfillment = (
  unit: OrderingUnitContext,
  fulfillmentType: FulfillmentMethod,
): boolean =>
  fulfillmentType === FulfillmentMethod.DELIVERY
    ? unit.deliveryEnabled
    : unit.takeawayEnabled;

export const isMinuteWithinRange = (
  currentMinute: number,
  startMinute: number,
  endMinute: number,
): boolean => currentMinute >= startMinute && currentMinute < endMinute;

export const isUnitOpenNow = (
  unit: OrderingUnitContext,
  fulfillmentType: FulfillmentMethod,
  timeContext: TimeContext,
): boolean => {
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
    isMinuteWithinRange(
      timeContext.minutesOfDay,
      hour.opensAtMinutes,
      hour.closesAtMinutes,
    ),
  );
};

export const isProductAvailableForFulfillment = (
  product: ProductCatalogRow,
  fulfillmentType: FulfillmentMethod,
  timeContext: TimeContext,
): boolean => {
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
    isMinuteWithinRange(
      timeContext.minutesOfDay,
      window.startsAtMinutes,
      window.endsAtMinutes,
    ),
  );
};

export const buildFulfillmentAvailability = (
  unit: OrderingUnitContext,
  fulfillmentType: FulfillmentMethod,
  timeContext: TimeContext,
): PublicFulfillmentAvailabilityResponseDto => ({
  enabled: isUnitEnabledForFulfillment(unit, fulfillmentType),
  isOpenNow: isUnitOpenNow(unit, fulfillmentType, timeContext),
});
