import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Prisma, StaffInviteStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { PasswordService } from '../auth/password.service';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { Messages } from '../common/i18n/messages';
import { AcceptStaffInviteInput } from './dto/accept-staff-invite.input';
import { CreateStaffInput } from './dto/create-staff.input';
import { CreateStaffInviteInput } from './dto/create-staff-invite.input';
import { StaffInviteResponseDto } from './dto/staff-invite-response.dto';
import { StaffListItemDto } from './dto/staff-list-item.dto';
import { StaffResponseDto } from './dto/staff-response.dto';
import { UpdateStaffStatusInput } from './dto/update-staff-status.input';

@Injectable()
export class StaffService {
  private static readonly DEFAULT_INVITE_EXPIRATION_HOURS = 72;

  private readonly ownerAssignableRoles = new Set<UserRole>([
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.ATTENDANT,
    UserRole.KITCHEN,
  ]);

  private readonly managerAssignableRoles = new Set<UserRole>([
    UserRole.CASHIER,
    UserRole.ATTENDANT,
    UserRole.KITCHEN,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async createStaff(
    creator: AuthenticatedUser,
    input: CreateStaffInput,
  ): Promise<StaffResponseDto> {
    const tenantId = this.getTenantIdOrThrow(creator);

    const normalizedName = this.normalizeRequiredValue(input.name, 'nome');
    const normalizedEmail = this.normalizeEmail(input.email);
    const normalizedPassword = this.normalizeRequiredValue(
      input.password,
      'senha',
    );
    await this.ensureUnitInTenant(input.unitId, tenantId);

    const roleSet = await this.getCreatorRolesForTenant(creator.id, tenantId);
    this.validateRoleAssignment(roleSet, input.role, true);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: {
            email: normalizedEmail,
          },
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        });

        if (existingUser && !existingUser.isActive) {
          throw new ConflictException(Messages.STAFF_INACTIVE_EMAIL);
        }

        const user =
          existingUser ??
          (await tx.user.create({
            data: {
              name: normalizedName,
              email: normalizedEmail,
              passwordHash: await this.passwordService.hashPassword(
                normalizedPassword,
              ),
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
          }));

        await tx.userTenantRole.upsert({
          where: {
            userId_tenantId_role: {
              userId: user.id,
              tenantId,
              role: input.role,
            },
          },
          create: {
            userId: user.id,
            tenantId,
            role: input.role,
          },
          update: {},
        });

        await tx.userUnitRole.upsert({
          where: {
            userId_unitId_role: {
              userId: user.id,
              unitId: input.unitId,
              role: input.role,
            },
          },
          create: {
            userId: user.id,
            unitId: input.unitId,
            role: input.role,
          },
          update: {},
        });

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          tenantId,
          unitId: input.unitId,
          role: input.role,
          isNewUser: !existingUser,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(Messages.STAFF_ROLE_ALREADY_EXISTS);
      }

      throw error;
    }
  }

  async inviteStaff(
    creator: AuthenticatedUser,
    input: CreateStaffInviteInput,
  ): Promise<StaffInviteResponseDto> {
    const tenantId = this.getTenantIdOrThrow(creator);
    const normalizedEmail = this.normalizeEmail(input.email);
    await this.ensureUnitInTenant(input.unitId, tenantId);

    const creatorRoles = await this.getCreatorRolesForTenant(
      creator.id,
      tenantId,
    );
    this.validateRoleAssignment(creatorRoles, input.role, true);

    const pendingInvite = await this.prisma.staffInvite.findFirst({
      where: {
        tenantId,
        unitId: input.unitId,
        email: normalizedEmail,
        role: input.role,
        status: StaffInviteStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (pendingInvite) {
      throw new ConflictException(Messages.INVITE_PENDING_EXISTS);
    }

    const inviteToken = this.generateInviteToken();
    const invite = await this.prisma.staffInvite.create({
      data: {
        tenantId,
        unitId: input.unitId,
        email: normalizedEmail,
        role: input.role,
        tokenHash: this.hashInviteToken(inviteToken),
        invitedById: creator.id,
        expiresAt: this.getInviteExpirationDate(input.expiresInHours),
      },
      select: {
        id: true,
        email: true,
        tenantId: true,
        unitId: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });

    return {
      ...invite,
      inviteToken,
    };
  }

  async acceptInvite(input: AcceptStaffInviteInput): Promise<StaffResponseDto> {
    const tokenHash = this.hashInviteToken(input.token.trim());
    const invite = await this.prisma.staffInvite.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        tenantId: true,
        unitId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invite) {
      throw new NotFoundException(Messages.INVITE_NOT_FOUND);
    }

    if (invite.status !== StaffInviteStatus.PENDING) {
      throw new BadRequestException(Messages.INVITE_NOT_PENDING);
    }

    if (invite.expiresAt <= new Date()) {
      await this.prisma.staffInvite.update({
        where: { id: invite.id },
        data: { status: StaffInviteStatus.EXPIRED },
      });
      throw new BadRequestException(Messages.INVITE_EXPIRED);
    }

    const normalizedName = input.name
      ? this.normalizeRequiredValue(input.name, 'nome')
      : undefined;
    const normalizedPassword = this.normalizeRequiredValue(
      input.password,
      'senha',
    );

    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: {
          email: invite.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      });

      if (existingUser && !existingUser.isActive) {
        throw new ConflictException(Messages.INVITE_INACTIVE_EMAIL);
      }

      if (!existingUser && !normalizedName) {
        throw new BadRequestException(Messages.INVITE_NEW_USER_REQUIRES_NAME);
      }

      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            name: normalizedName as string,
            email: invite.email,
            passwordHash: await this.passwordService.hashPassword(
              normalizedPassword,
            ),
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        }));

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash: await this.passwordService.hashPassword(
              normalizedPassword,
            ),
          },
        });
      }

      await tx.userTenantRole.upsert({
        where: {
          userId_tenantId_role: {
            userId: user.id,
            tenantId: invite.tenantId,
            role: invite.role,
          },
        },
        create: {
          userId: user.id,
          tenantId: invite.tenantId,
          role: invite.role,
        },
        update: {},
      });

      await tx.userUnitRole.upsert({
        where: {
          userId_unitId_role: {
            userId: user.id,
            unitId: invite.unitId,
            role: invite.role,
          },
        },
        create: {
          userId: user.id,
          unitId: invite.unitId,
          role: invite.role,
        },
        update: {},
      });

      await tx.staffInvite.update({
        where: { id: invite.id },
        data: {
          status: StaffInviteStatus.ACCEPTED,
          acceptedById: user.id,
        },
      });

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        tenantId: invite.tenantId,
        unitId: invite.unitId,
        role: invite.role,
        isNewUser: !existingUser,
      };
    });
  }

  async listStaff(creator: AuthenticatedUser): Promise<StaffListItemDto[]> {
    const tenantId = this.getTenantIdOrThrow(creator);
    const creatorRoles = await this.getCreatorRolesForTenant(
      creator.id,
      tenantId,
    );
    this.assertHasStaffManagementPermission(creatorRoles);

    const users = await this.prisma.user.findMany({
      where: {
        tenantRoles: {
          some: {
            tenantId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        tenantRoles: {
          where: {
            tenantId,
          },
          select: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      tenantRoles: user.tenantRoles.map((tenantRole) => tenantRole.role),
    }));
  }

  async updateStaffStatus(
    creator: AuthenticatedUser,
    userId: string,
    input: UpdateStaffStatusInput,
  ): Promise<StaffListItemDto> {
    const tenantId = this.getTenantIdOrThrow(creator);
    const creatorRoles = await this.getCreatorRolesForTenant(
      creator.id,
      tenantId,
    );
    this.assertHasStaffManagementPermission(creatorRoles);

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantRoles: {
          some: {
            tenantId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        tenantRoles: {
          where: {
            tenantId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException(Messages.STAFF_NOT_FOUND);
    }

    if (targetUser.id === creator.id && !input.isActive) {
      throw new BadRequestException(Messages.STAFF_SELF_DEACTIVATION_FORBIDDEN);
    }

    if (
      targetUser.tenantRoles.some(
        (tenantRole) => tenantRole.role === UserRole.OWNER,
      ) &&
      !creatorRoles.has(UserRole.OWNER)
    ) {
      throw new ForbiddenException(Messages.STAFF_OWNER_STATUS_FORBIDDEN);
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        isActive: input.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        tenantRoles: {
          where: {
            tenantId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    return {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isActive: updatedUser.isActive,
      tenantRoles: updatedUser.tenantRoles.map((tenantRole) => tenantRole.role),
    };
  }

  private validateRoleAssignment(
    creatorRoles: Set<UserRole>,
    targetRole: UserRole,
    allowManagerAssignment: boolean,
  ): void {
    if (!allowManagerAssignment && targetRole === UserRole.MANAGER) {
      throw new BadRequestException(Messages.ROLE_ASSIGNMENT_FORBIDDEN);
    }

    if (creatorRoles.has(UserRole.OWNER)) {
      if (!this.ownerAssignableRoles.has(targetRole)) {
        throw new BadRequestException(Messages.ROLE_ASSIGNMENT_FORBIDDEN);
      }

      return;
    }

    if (creatorRoles.has(UserRole.MANAGER)) {
      if (!this.managerAssignableRoles.has(targetRole)) {
        throw new ForbiddenException(Messages.ROLE_ASSIGNMENT_FORBIDDEN);
      }

      return;
    }

    throw new ForbiddenException(Messages.ASSIGNABLE_ROLES_REQUIRED);
  }

  private assertHasStaffManagementPermission(
    creatorRoles: Set<UserRole>,
  ): void {
    if (
      creatorRoles.has(UserRole.OWNER) ||
      creatorRoles.has(UserRole.MANAGER)
    ) {
      return;
    }

    throw new ForbiddenException(Messages.ASSIGNABLE_ROLES_REQUIRED);
  }

  private getTenantIdOrThrow(creator: AuthenticatedUser): string {
    const tenantId = creator.auth?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException(Messages.TENANT_CONTEXT_MISSING);
    }

    return tenantId;
  }

  private async ensureUnitInTenant(
    unitId: string,
    tenantId: string,
  ): Promise<void> {
    const unit = await this.prisma.restaurantUnit.findFirst({
      where: {
        id: unitId,
        tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!unit) {
      throw new NotFoundException(Messages.UNIT_NOT_IN_TENANT);
    }
  }

  private async getCreatorRolesForTenant(
    userId: string,
    tenantId: string,
  ): Promise<Set<UserRole>> {
    const creatorRoles = await this.prisma.userTenantRole.findMany({
      where: {
        userId,
        tenantId,
      },
      select: {
        role: true,
      },
    });

    return new Set(creatorRoles.map((creatorRole) => creatorRole.role));
  }

  private generateInviteToken(): string {
    return randomBytes(24).toString('hex');
  }

  private hashInviteToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getInviteExpirationDate(expiresInHours?: number): Date {
    const hours =
      expiresInHours ?? StaffService.DEFAULT_INVITE_EXPIRATION_HOURS;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    return expiresAt;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeRequiredValue(value: string, fieldName: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new BadRequestException(Messages.FIELD_REQUIRED(fieldName));
    }

    return normalizedValue;
  }
}
