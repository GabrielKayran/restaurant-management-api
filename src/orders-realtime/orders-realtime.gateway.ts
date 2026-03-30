import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PrismaService } from 'nestjs-prisma';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { JwtDto } from '../auth/dto/jwt.dto';
import {
  OrderCreatedRealtimeEvent,
  OrderStatusUpdatedRealtimeEvent,
} from './orders-realtime.types';

type OrdersRealtimeHandshakeAuth = {
  token?: string;
  unitId?: string;
};

@Injectable()
@WebSocketGateway({
  namespace: '/orders',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class OrdersRealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrdersRealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const unitId = this.extractUnitId(client);

      if (!token) {
        throw new UnauthorizedException('errors.auth.invalidCredentials');
      }

      if (!unitId) {
        throw new ForbiddenException('errors.scope.unitHeaderRequired');
      }

      const payload = this.jwtService.verify<JwtDto>(token);
      const userId = payload.sub ?? payload.userId;

      if (!userId) {
        throw new UnauthorizedException('errors.auth.invalidCredentials');
      }

      if (!payload.tenantId) {
        throw new ForbiddenException('errors.auth.tenantContextRequired');
      }

      await this.authService.validateUser(userId);

      const unitRole = await this.prisma.userUnitRole.findFirst({
        where: {
          userId,
          unitId,
          unit: {
            tenantId: payload.tenantId,
            isActive: true,
          },
        },
        select: {
          unitId: true,
        },
      });

      if (!unitRole) {
        throw new ForbiddenException('errors.scope.unitAccessDenied');
      }

      client.data.userId = userId;
      client.data.unitId = unitId;
      await client.join(this.buildUnitRoom(unitId));
    } catch (error) {
      this.logger.warn(this.serializeConnectionFailure(client, error));
      client.disconnect(true);
    }
  }

  emitOrderCreated(payload: OrderCreatedRealtimeEvent): void {
    this.server
      .to(this.buildUnitRoom(payload.unitId))
      .emit('order.created', payload);
  }

  emitOrderStatusUpdated(payload: OrderStatusUpdatedRealtimeEvent): void {
    this.server
      .to(this.buildUnitRoom(payload.unitId))
      .emit('order.status.updated', payload);
  }

  private buildUnitRoom(unitId: string): string {
    return `unit:${unitId}`;
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as
      | OrdersRealtimeHandshakeAuth
      | undefined;
    const authorizationHeader = client.handshake.headers.authorization;
    const rawToken =
      (typeof auth?.token === 'string' ? auth.token : null) ??
      (typeof authorizationHeader === 'string' ? authorizationHeader : null);

    if (!rawToken) {
      return null;
    }

    const normalizedToken = rawToken.replace(/^Bearer\s+/i, '').trim();

    return normalizedToken.length ? normalizedToken : null;
  }

  private extractUnitId(client: Socket): string | null {
    const auth = client.handshake.auth as
      | OrdersRealtimeHandshakeAuth
      | undefined;
    const unitIdHeader = client.handshake.headers['x-unit-id'];
    const rawUnitId =
      (typeof auth?.unitId === 'string' ? auth.unitId : null) ??
      (typeof unitIdHeader === 'string'
        ? unitIdHeader
        : Array.isArray(unitIdHeader)
        ? unitIdHeader[0]
        : null);

    if (!rawUnitId) {
      return null;
    }

    const normalizedUnitId = rawUnitId.trim();

    return normalizedUnitId.length ? normalizedUnitId : null;
  }

  private serializeConnectionFailure(client: Socket, error: unknown): string {
    return JSON.stringify({
      socketId: client.id,
      event: 'orders.realtime.connection.rejected',
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
            }
          : String(error),
    });
  }
}
