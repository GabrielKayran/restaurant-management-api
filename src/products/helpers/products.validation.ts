import { BadRequestException } from '@nestjs/common';
import { UpdateProductInput } from '../dto';

export type ProductConfigurationInput = Pick<
  UpdateProductInput,
  | 'variants'
  | 'optionGroups'
  | 'prices'
  | 'availabilityWindows'
  | 'isAvailableForTakeaway'
  | 'isAvailableForDelivery'
>;

export const validateProductConfiguration = (
  input: ProductConfigurationInput,
): void => {
  if (input.variants) {
    const defaultVariants = input.variants.filter(
      (variant) => variant.isDefault,
    );

    if (defaultVariants.length > 1) {
      throw new BadRequestException(
        'Apenas uma variante pode ser marcada como padrao.',
      );
    }
  }

  if (input.optionGroups) {
    for (const group of input.optionGroups) {
      const minSelect = group.minSelect ?? 0;
      const maxSelect = group.maxSelect ?? 1;

      if (minSelect > maxSelect) {
        throw new BadRequestException(
          'O minimo de selecoes nao pode ser maior que o maximo.',
        );
      }
    }
  }

  if (input.prices) {
    for (const price of input.prices) {
      const startsAt = price.startsAt ? new Date(price.startsAt) : null;
      const endsAt = price.endsAt ? new Date(price.endsAt) : null;

      if (
        startsAt &&
        endsAt &&
        Number.isFinite(startsAt.getTime()) &&
        Number.isFinite(endsAt.getTime()) &&
        endsAt <= startsAt
      ) {
        throw new BadRequestException(
          'A data final do preco precisa ser posterior a data inicial.',
        );
      }
    }
  }

  if (
    input.isAvailableForTakeaway === false &&
    input.isAvailableForDelivery === false
  ) {
    throw new BadRequestException(
      'O produto deve permanecer disponivel para ao menos um fulfillment publico.',
    );
  }

  if (input.availabilityWindows) {
    for (const window of input.availabilityWindows) {
      if (window.endsAtMinutes <= window.startsAtMinutes) {
        throw new BadRequestException(
          'A janela de disponibilidade precisa terminar depois do inicio.',
        );
      }
    }
  }
};
