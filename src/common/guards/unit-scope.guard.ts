import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { AuthenticatedUser } from '../../auth/models/authenticated-user.model';
import { RequestScope } from '../models/request-scope.model';

@Injectable()
export class UnitScopeGuard implements CanActivate {
  private static readonly UNIT_HEADER = 'x-unit-id';

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: AuthenticatedUser;
      scope?: RequestScope;
    }>();

    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException('errors.auth.invalidCredentials');
    }

    const tenantId = user.auth?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('errors.auth.tenantContextRequired');
    }

    const rawHeader = request.headers[UnitScopeGuard.UNIT_HEADER];
    const unitId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!unitId) {
      const resolvedUnitId = await this.resolveSingleUnitId(user.id, tenantId);

      if (!resolvedUnitId) {
        throw new ForbiddenException('errors.scope.unitSelectionRequired');
      }

      request.scope = {
        userId: user.id,
        tenantId,
        unitId: resolvedUnitId,
      };

      return true;
    }

    if (!this.isUuid(unitId)) {
      throw new ForbiddenException('errors.scope.unitHeaderRequired');
    }

    const unitRole = await this.prisma.userUnitRole.findFirst({
      where: {
        userId: user.id,
        unitId,
        unit: {
          tenantId,
          isActive: true,
        },
      },
      select: {
        unit: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!unitRole) {
      throw new ForbiddenException('errors.scope.unitAccessDenied');
    }

    request.scope = {
      userId: user.id,
      tenantId: unitRole.unit.tenantId,
      unitId,
    };

    return true;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private async resolveSingleUnitId(
    userId: string,
    tenantId: string,
  ): Promise<string | null> {
    const unitRoles = await this.prisma.userUnitRole.findMany({
      where: {
        userId,
        unit: {
          tenantId,
          isActive: true,
        },
      },
      select: {
        unitId: true,
      },
      distinct: ['unitId'],
      take: 2,
      orderBy: {
        unitId: 'asc',
      },
    });

    return unitRoles.length === 1 ? unitRoles[0].unitId : null;
  }
}
