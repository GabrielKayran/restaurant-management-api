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
    const resolvedLang = this.resolveLanguage(options?.lang);
    const defaultValue = options?.defaultValue ?? key;

    const translated = this.i18nService.translate(key, {
      lang: resolvedLang,
      args: options?.args,
      defaultValue,
    });

    if (typeof translated === 'string' && translated !== key) {
      return translated;
    }

    const baseLang = this.toBaseLanguage(resolvedLang);
    if (baseLang && baseLang !== resolvedLang) {
      const fallbackTranslated = this.i18nService.translate(key, {
        lang: baseLang,
        args: options?.args,
        defaultValue,
      });

      if (
        typeof fallbackTranslated === 'string' &&
        fallbackTranslated !== key
      ) {
        return fallbackTranslated;
      }
    }

    return defaultValue;
  }

  private resolveLanguage(lang?: string): string | undefined {
    const contextLang = I18nContext.current()?.lang;
    const requestedLang = lang ?? contextLang;

    if (!requestedLang) {
      return undefined;
    }

    return requestedLang.toLowerCase() === 'pt-br' ? 'pt-BR' : requestedLang;
  }

  private toBaseLanguage(lang?: string): string | undefined {
    if (!lang) {
      return undefined;
    }

    return lang.split('-')[0];
  }
}
