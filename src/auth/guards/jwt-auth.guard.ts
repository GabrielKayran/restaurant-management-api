import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info?: unknown,
  ): TUser {
    void info;

    if (err || !user) {
      throw new UnauthorizedException('errors.auth.unauthorized');
    }

    return user;
  }
}
