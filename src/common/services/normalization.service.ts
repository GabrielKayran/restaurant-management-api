import { BadRequestException, Injectable } from '@nestjs/common';
import { AppI18nService } from '../i18n/i18n.service';

@Injectable()
export class NormalizationService {
  constructor(private readonly i18nService: AppI18nService) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  normalizeRequiredField(value: string, fieldName: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException(
        this.i18nService.translate('errors.common.fieldRequired', {
          args: {
            field: fieldName,
          },
        }),
      );
    }

    return normalizedValue;
  }

  normalizeOptionalField(value?: string): string | undefined {
    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : undefined;
  }

  normalizeNullableField(value?: string | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : null;
  }

  slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
