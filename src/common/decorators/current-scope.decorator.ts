import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestScope } from '../models/request-scope.model';

export const CurrentScope = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestScope => {
    const request = ctx.switchToHttp().getRequest<{ scope: RequestScope }>();
    return request.scope;
  },
);
