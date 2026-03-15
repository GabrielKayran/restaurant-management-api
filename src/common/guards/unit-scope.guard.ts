import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { AuthenticatedUser } from '../../auth/models/authenticated-user.model';
import { Messages } from '../i18n/messages';
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
      throw new UnauthorizedException();
    }

    const tenantId = user.auth?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(Messages.TENANT_CONTEXT_REQUIRED);
    }

    const rawHeader = request.headers[UnitScopeGuard.UNIT_HEADER];
    const unitId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!unitId || !this.isUuid(unitId)) {
      throw new ForbiddenException(Messages.UNIT_HEADER_REQUIRED);
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
      throw new ForbiddenException(Messages.UNIT_ACCESS_DENIED);
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
}
