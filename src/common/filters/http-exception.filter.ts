import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppI18nService } from '../i18n/i18n.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly appI18nService: AppI18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const lang = this.resolveLanguage(request);

    let message: string | string[] = this.translateMessage(
      exception.message,
      lang,
    );

    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const messageProperty = exceptionResponse.message;

      if (typeof messageProperty === 'string') {
        message = this.translateMessage(messageProperty, lang);
      } else if (Array.isArray(messageProperty)) {
        message = messageProperty.map((msg) =>
          this.translateMessage(msg, lang),
        );
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private translateMessage(message: string, lang?: string): string {
    if (message.includes('.')) {
      return this.appI18nService.translate(message, {
        lang,
        defaultValue: message,
      });
    }

    return message;
  }

  private resolveLanguage(request: Request): string | undefined {
    const xLang = request.header('x-lang');
    if (xLang) {
      return xLang;
    }

    const acceptLanguage = request.header('accept-language');
    if (!acceptLanguage) {
      return undefined;
    }

    return acceptLanguage.split(',')[0]?.trim();
  }
}
