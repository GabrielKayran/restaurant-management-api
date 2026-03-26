import { BadRequestException } from '@nestjs/common';
import { validateProductConfiguration } from './products.validation';

describe('validateProductConfiguration', () => {
  it('rejects multiple default variants', () => {
    expect(() =>
      validateProductConfiguration({
        variants: [
          { name: 'A', priceDelta: 1, isDefault: true },
          { name: 'B', priceDelta: 2, isDefault: true },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects option groups with invalid min and max select values', () => {
    expect(() =>
      validateProductConfiguration({
        optionGroups: [
          {
            name: 'Extras',
            minSelect: 2,
            maxSelect: 1,
            options: [{ name: 'Bacon', priceDelta: 4 }],
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects a product that is unavailable for all public fulfillment methods', () => {
    expect(() =>
      validateProductConfiguration({
        isAvailableForTakeaway: false,
        isAvailableForDelivery: false,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects availability windows that end before they start', () => {
    expect(() =>
      validateProductConfiguration({
        availabilityWindows: [
          {
            fulfillmentType: 'DELIVERY',
            dayOfWeek: 1,
            startsAtMinutes: 600,
            endsAtMinutes: 540,
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });
});
