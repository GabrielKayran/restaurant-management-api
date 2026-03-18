import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { existsSync } from 'fs';
import { join } from 'path';
import { I18nConfig } from '../configs/config.interface';
import { AppI18nService } from './i18n.service';

@Global()
@Module({
  imports: [
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<I18nConfig>('i18n');
        const distLocalesPath = join(__dirname, 'locales/');
        const srcLocalesPath = join(process.cwd(), 'src/common/i18n/locales/');
        const localesPath = existsSync(distLocalesPath)
          ? distLocalesPath
          : srcLocalesPath;

        return {
          loader: I18nJsonLoader,
          fallbackLanguage: config?.fallbackLanguage ?? 'pt-BR',
          fallbacks: {
            pt: 'pt-BR',
            'pt-*': 'pt-BR',
          },
          loaderOptions: {
            path: localesPath,
            watch: true,
          },
          resolvers: [
            { use: QueryResolver, options: ['lang', 'locale'] },
            { use: HeaderResolver, options: ['x-lang', 'accept-language'] },
            AcceptLanguageResolver,
          ],
        };
      },
    }),
  ],
  providers: [AppI18nService],
  exports: [I18nModule, AppI18nService],
})
export class CommonI18nModule {}
