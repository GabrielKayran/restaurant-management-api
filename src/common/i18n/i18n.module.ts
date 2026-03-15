import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
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

        return {
          fallbackLanguage: config?.fallbackLanguage ?? 'pt-BR',
          loaderOptions: {
            path: join(__dirname, 'locales/'),
            watch: true,
          },
          resolvers: [
            { use: QueryResolver, options: ['lang', 'locale'] },
            { use: HeaderResolver, options: ['x-lang'] },
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
