import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Messages } from './common/i18n/messages';
import { AppI18nService } from './common/i18n/i18n.service';
import type {
  CorsConfig,
  NestConfig,
  SwaggerConfig,
} from './common/configs/config.interface';

function collectMessages(error: ValidationError): string[] {
  const current = Object.values(error.constraints ?? {});
  const nested = (error.children ?? []).flatMap((child) =>
    collectMessages(child),
  );
  return [...current, ...nested];
}

function translateValidationMessage(
  message: string,
  appI18nService: AppI18nService,
): string {
  if (!message.includes('.')) {
    return message;
  }

  return appI18nService.translate(message, { defaultValue: message });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appI18nService = app.get(AppI18nService);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors
          .flatMap((error) => collectMessages(error))
          .map((message) =>
            translateValidationMessage(message, appI18nService),
          );
        return new BadRequestException({
          statusCode: 400,
          message: messages,
          error: Messages.REQUEST_INVALID,
        });
      },
    }),
  );

  // enable shutdown hook
  app.enableShutdownHooks();

  // Exception Filters for unhandled exceptions
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(appI18nService));
  app.useGlobalFilters(new PrismaExceptionFilter(httpAdapter));

  const configService = app.get(ConfigService);
  const nestConfig = configService.get<NestConfig>('nest');
  const corsConfig = configService.get<CorsConfig>('cors');
  const swaggerConfig = configService.get<SwaggerConfig>('swagger');

  // Swagger Api
  if (swaggerConfig.enabled) {
    const swaggerPath = `/${(swaggerConfig.path || 'api').replace(
      /^\/+|\/+$/g,
      '',
    )}`;

    const options = new DocumentBuilder()
      .setTitle(swaggerConfig.title || 'Nestjs')
      .setDescription(swaggerConfig.description || 'The nestjs API description')
      .setVersion(swaggerConfig.version || '1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })
      .build();
    const document = SwaggerModule.createDocument(app, options);
    const customSwaggerOptions: SwaggerCustomOptions = {
      jsonDocumentUrl: `${swaggerPath}-json`,
    };

    SwaggerModule.setup(swaggerPath, app, document, customSwaggerOptions);
  }

  // Cors
  if (corsConfig.enabled) {
    app.enableCors();
  }

  await app.listen(process.env.PORT || nestConfig.port || 3000);
}
bootstrap();
