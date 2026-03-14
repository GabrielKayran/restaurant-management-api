import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class StaffInviteResponseDto {
  @ApiProperty({ example: 'uuid-do-convite' })
  id: string;

  @ApiProperty({ example: 'colaborador@restaurante.com' })
  email: string;

  @ApiProperty({ example: 'uuid-do-tenant' })
  tenantId: string;

  @ApiProperty({ example: 'uuid-da-unidade' })
  unitId: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 'TOKEN_DE_CONVITE' })
  inviteToken: string;

  @ApiProperty({ example: '2026-03-20T12:00:00.000Z' })
  expiresAt: Date;
}
