import { Prisma } from '@prisma/client';

export const decimalToNumber = (
  value: Prisma.Decimal | null | undefined,
): number | null => {
  if (!value) {
    return null;
  }

  return Number(value.toString());
};

export const decimalToNumberOrZero = (
  value: Prisma.Decimal | null | undefined,
): number => {
  return decimalToNumber(value) ?? 0;
};
