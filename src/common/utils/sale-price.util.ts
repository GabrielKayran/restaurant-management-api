import { Prisma } from '@prisma/client';
import { decimalToNumberOrZero } from './decimal.util';

export type ScheduledPriceEntry = {
  price: Prisma.Decimal;
  startsAt: Date | null;
  endsAt: Date | null;
};

export const resolveSalePrice = (
  basePrice: Prisma.Decimal,
  prices: readonly ScheduledPriceEntry[],
  referenceDate: Date = new Date(),
): number => {
  const reference = referenceDate.getTime();
  const activeScheduledPrice = prices.find((price) => {
    const startsAt = price.startsAt?.getTime() ?? Number.NEGATIVE_INFINITY;
    const endsAt = price.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
    return reference >= startsAt && reference <= endsAt;
  });

  return decimalToNumberOrZero(activeScheduledPrice?.price ?? basePrice);
};
