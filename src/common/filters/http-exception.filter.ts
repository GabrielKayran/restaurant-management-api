import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { Messages } from '../i18n/messages';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;

    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const messageProperty = exceptionResponse.message;

      if (typeof messageProperty === 'string') {
        message = this.translateMessage(messageProperty);
      } else if (Array.isArray(messageProperty)) {
        message = messageProperty
          .map((msg) => this.translateMessage(msg))
          .join(', ');
      }
    }

    response.status(status).json({
      statusCode: status,
      message: message || exception.message,
      timestamp: new Date().toISOString(),
    });
  }

  private translateMessage(message: string): string {
    if (message.includes('.')) {
      return Messages.translate(message);
    }
    return message;
  }
}
