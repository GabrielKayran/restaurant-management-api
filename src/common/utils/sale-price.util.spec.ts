import { Prisma } from '@prisma/client';
import { resolveSalePrice } from './sale-price.util';

describe('resolveSalePrice', () => {
  const basePrice = new Prisma.Decimal('25.00');
  const referenceDate = new Date('2026-03-26T12:00:00.000Z');

  it('returns the scheduled price when the reference date is inside the interval', () => {
    const result = resolveSalePrice(
      basePrice,
      [
        {
          price: new Prisma.Decimal('19.90'),
          startsAt: new Date('2026-03-26T11:00:00.000Z'),
          endsAt: new Date('2026-03-26T13:00:00.000Z'),
        },
      ],
      referenceDate,
    );

    expect(result).toBe(19.9);
  });

  it('returns the base price when no scheduled price is active', () => {
    const result = resolveSalePrice(
      basePrice,
      [
        {
          price: new Prisma.Decimal('19.90'),
          startsAt: new Date('2026-03-26T13:00:01.000Z'),
          endsAt: new Date('2026-03-26T14:00:00.000Z'),
        },
      ],
      referenceDate,
    );

    expect(result).toBe(25);
  });

  it('treats null bounds as an open interval', () => {
    const result = resolveSalePrice(
      basePrice,
      [
        {
          price: new Prisma.Decimal('22.50'),
          startsAt: null,
          endsAt: null,
        },
      ],
      referenceDate,
    );

    expect(result).toBe(22.5);
  });

  it('includes the start and end boundaries', () => {
    const startsAt = new Date('2026-03-26T12:00:00.000Z');
    const endsAt = new Date('2026-03-26T14:00:00.000Z');

    expect(
      resolveSalePrice(
        basePrice,
        [
          {
            price: new Prisma.Decimal('18.00'),
            startsAt,
            endsAt,
          },
        ],
        startsAt,
      ),
    ).toBe(18);

    expect(
      resolveSalePrice(
        basePrice,
        [
          {
            price: new Prisma.Decimal('18.00'),
            startsAt,
            endsAt,
          },
        ],
        endsAt,
      ),
    ).toBe(18);
  });
});
