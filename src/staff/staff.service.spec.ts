import {
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { PasswordService } from '../auth/password.service';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { StaffService } from './staff.service';

describe('StaffService', () => {
  let service: StaffService;
  let prisma: {
    restaurantUnit: { findFirst: jest.Mock };
    userTenantRole: { findMany: jest.Mock };
    staffInvite: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let passwordService: { hashPassword: jest.Mock };

  const creator = {
    id: 'creator-1',
    auth: { tenantId: 'tenant-1' },
  } as AuthenticatedUser;

  beforeEach(() => {
    prisma = {
      restaurantUnit: { findFirst: jest.fn() },
      userTenantRole: { findMany: jest.fn() },
      staffInvite: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    passwordService = {
      hashPassword: jest.fn(),
    };

    service = new StaffService(
      prisma as unknown as PrismaService,
      passwordService as unknown as PasswordService,
    );
  });

  it('blocks staff creation when authenticated user has no tenant in token', async () => {
    await expect(
      service.createStaff(
        { ...creator, auth: { tenantId: undefined } } as AuthenticatedUser,
        {
          name: 'Staff Member 01',
          email: 'atendente@restaurante.com',
          password: '123456',
          role: UserRole.ATTENDANT,
          unitId: 'unit-1',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns error when unit does not belong to token tenant', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue(null);

    await expect(
      service.createStaff(creator, {
        name: 'Staff Member 01',
        email: 'atendente@restaurante.com',
        password: '123456',
        role: UserRole.ATTENDANT,
        unitId: 'unit-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('does not allow manager to assign manager role', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue({ id: 'unit-1' });
    prisma.userTenantRole.findMany.mockResolvedValue([
      { role: UserRole.MANAGER },
    ]);

    await expect(
      service.createStaff(creator, {
        name: 'New Manager',
        email: 'gestor@restaurante.com',
        password: '123456',
        role: UserRole.MANAGER,
        unitId: 'unit-1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not allow creating role outside allowed staff roles', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue({ id: 'unit-1' });
    prisma.userTenantRole.findMany.mockResolvedValue([
      { role: UserRole.OWNER },
    ]);

    await expect(
      service.createStaff(creator, {
        name: 'Secondary Owner',
        email: 'owner2@restaurante.com',
        password: '123456',
        role: UserRole.OWNER,
        unitId: 'unit-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('blocks duplicate pending invite in the same context', async () => {
    prisma.restaurantUnit.findFirst.mockResolvedValue({ id: 'unit-1' });
    prisma.userTenantRole.findMany.mockResolvedValue([
      { role: UserRole.OWNER },
    ]);
    prisma.staffInvite.findFirst.mockResolvedValue({ id: 'invite-1' });

    await expect(
      service.inviteStaff(creator, {
        email: 'atendente@restaurante.com',
        role: UserRole.ATTENDANT,
        unitId: 'unit-1',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('returns error when accepting a non-existent invite', async () => {
    prisma.staffInvite.findUnique.mockResolvedValue(null);

    await expect(
      service.acceptInvite({
        token: 'invalid-token',
        password: '123456',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
