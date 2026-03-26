import { Prisma } from '@prisma/client';
import { decimalToNumberOrZero } from '../../common/utils/decimal.util';
import {
  sanitizeStateCode,
  sanitizeTrimmedString,
  sanitizeZipCode,
} from '../../common/utils/sanitize.util';
import { PublicCheckoutInput } from '../dto';
import { DeliveryZoneRow } from './public-ordering.selects';

export const selectMatchingDeliveryZone = (
  zones: DeliveryZoneRow[],
  address: NonNullable<PublicCheckoutInput['address']>,
): DeliveryZoneRow | null => {
  const normalizedNeighborhood =
    sanitizeTrimmedString(address.neighborhood)?.toLowerCase() ?? '';
  const normalizedCity =
    sanitizeTrimmedString(address.city)?.toLowerCase() ?? '';
  const normalizedState = sanitizeStateCode(address.state)?.toLowerCase() ?? '';
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
};

export const selectFeeRule = (
  zone: DeliveryZoneRow,
  subtotal: number,
  distanceKm: number | null,
): DeliveryZoneRow['feeRules'][number] | undefined =>
  zone.feeRules.find((rule) => {
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

export const computeDistanceKm = (
  unitLatitude: Prisma.Decimal | null,
  unitLongitude: Prisma.Decimal | null,
  customerLatitude: number | null,
  customerLongitude: number | null,
): number | null => {
  if (
    unitLatitude === null ||
    unitLongitude === null ||
    customerLatitude === null ||
    customerLongitude === null
  ) {
    return null;
  }

  const lat1 = toRadians(decimalToNumberOrZero(unitLatitude));
  const lon1 = toRadians(decimalToNumberOrZero(unitLongitude));
  const lat2 = toRadians(customerLatitude);
  const lon2 = toRadians(customerLongitude);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number(distance.toFixed(2));
};

const toRadians = (value: number): number => (value * Math.PI) / 180;
