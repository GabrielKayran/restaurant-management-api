import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'nestjs-prisma';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../models/authenticated-user.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user?.id) {
      throw new UnauthorizedException('errors.auth.invalidCredentials');
    }

    if (!user.auth?.tenantId) {
      throw new ForbiddenException('errors.auth.tenantContextRequired');
    }

    const tenantRoles = await this.prisma.userTenantRole.findMany({
      where: {
        userId: user.id,
        tenantId: user.auth.tenantId,
      },
      select: {
        role: true,
      },
    });

    const hasPermission = tenantRoles.some((tenantRole) =>
      requiredRoles.includes(tenantRole.role),
    );

    if (!hasPermission) {
      throw new ForbiddenException('errors.auth.noPermission');
    }

    return true;
  }
}
