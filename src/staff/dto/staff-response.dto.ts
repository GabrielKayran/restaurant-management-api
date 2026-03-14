import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class StaffResponseDto {
  @ApiProperty({ example: 'uuid-do-usuario' })
  userId: string;

  @ApiProperty({ example: 'Carlos Lima' })
  name: string;

  @ApiProperty({ example: 'carlos@restaurante.com' })
  email: string;

  @ApiProperty({ example: 'uuid-do-tenant' })
  tenantId: string;

  @ApiProperty({ example: 'uuid-da-unidade' })
  unitId: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole;

  @ApiProperty({
    example: true,
    description: 'Indica se o usuario foi criado nesta requisicao',
  })
  isNewUser: boolean;
}
