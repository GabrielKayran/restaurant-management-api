import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtDto } from './dto/jwt.dto';
import { AuthenticatedUser } from './models/authenticated-user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtDto): Promise<AuthenticatedUser> {
    const userId = payload.sub ?? payload.userId;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.validateUser(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      ...user,
      auth: {
        tenantId: payload.tenantId,
      },
    };
  }
}
