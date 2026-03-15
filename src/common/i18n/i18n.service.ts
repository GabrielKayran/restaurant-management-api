import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

export interface TranslateOptions {
  readonly args?: Record<string, string | number | boolean>;
  readonly lang?: string;
  readonly defaultValue?: string;
}

@Injectable()
export class AppI18nService {
  constructor(private readonly i18nService: I18nService) {}

  translate(key: string, options?: TranslateOptions): string {
    const lang = options?.lang ?? I18nContext.current()?.lang;

    return this.i18nService.t(key, {
      lang,
      args: options?.args,
      defaultValue: options?.defaultValue ?? key,
    });
  }
}
