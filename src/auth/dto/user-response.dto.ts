import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserTenantRoleDto {
  @ApiProperty({ example: 'tenant-id' })
  tenantId: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole;
}

export class UserUnitRoleDto {
  @ApiProperty({ example: 'unit-id' })
  id: string;

  @ApiProperty({ example: 'Unidade Centro' })
  name: string;

  @ApiProperty({ example: 'tenant-id' })
  tenantId: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole;
}

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-do-usuario' })
  id: string;

  @ApiProperty({ example: 'Ana Paula Souza' })
  name: string;

  @ApiProperty({ example: 'ana@sabormineiro.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    type: [UserTenantRoleDto],
    description: 'Papeis do usuario por tenant',
  })
  tenantRoles: UserTenantRoleDto[];

  @ApiProperty({
    type: [UserUnitRoleDto],
    description: 'Papeis do usuario por unidade para envio do header x-unit-id',
  })
  unitRoles: UserUnitRoleDto[];

  @ApiProperty({ example: '2026-03-14T13:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-14T13:00:00.000Z' })
  updatedAt: Date;
}
