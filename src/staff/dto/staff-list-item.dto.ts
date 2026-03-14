import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class StaffListItemDto {
  @ApiProperty({ example: 'uuid-do-usuario' })
  userId: string;

  @ApiProperty({ example: 'Carlos Lima' })
  name: string;

  @ApiProperty({ example: 'carlos@restaurante.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    type: [String],
    description: 'Papeis do colaborador no tenant atual',
    example: ['CASHIER'],
  })
  tenantRoles: UserRole[];
}
