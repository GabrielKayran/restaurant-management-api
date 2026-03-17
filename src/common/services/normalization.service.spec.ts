import { BadRequestException } from '@nestjs/common';
import { AppI18nService } from '../i18n/i18n.service';
import { NormalizationService } from './normalization.service';

describe('NormalizationService', () => {
  let service: NormalizationService;
  let i18nService: jest.Mocked<AppI18nService>;

  beforeEach(() => {
    i18nService = {
      translate: jest.fn(
        (
          _key: string,
          options?: {
            args?: Record<string, string | number | boolean>;
          },
        ) => `O campo ${String(options?.args?.field)} e obrigatorio.`,
      ),
    } as unknown as jest.Mocked<AppI18nService>;

    service = new NormalizationService(i18nService);
  });

  it('normalizes email trimming and lowercasing', () => {
    expect(service.normalizeEmail('  OWNER@MAIL.COM  ')).toBe('owner@mail.com');
  });

  it('throws translated field required message using the provided field name', () => {
    expect(() => service.normalizeRequiredField('   ', 'senha')).toThrow(
      new BadRequestException('O campo senha e obrigatorio.'),
    );

    expect(i18nService.translate).toHaveBeenCalledWith(
      'errors.common.fieldRequired',
      {
        args: {
          field: 'senha',
        },
      },
    );
  });

  it('returns trimmed value for required fields', () => {
    expect(service.normalizeRequiredField('  Maria  ', 'nome')).toBe('Maria');
  });

  it('returns undefined for optional blank fields', () => {
    expect(service.normalizeOptionalField('   ')).toBeUndefined();
  });
});
