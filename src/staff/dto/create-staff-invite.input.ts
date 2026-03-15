import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateStaffInviteInput {
  @ApiProperty({
    example: 'colaborador@restaurante.com',
    description: 'E-mail do colaborador que recebera o convite',
  })
  @IsEmail({}, { message: 'validation.common.emailInvalid' })
  email: string;

  @ApiProperty({
    enum: [
      UserRole.MANAGER,
      UserRole.CASHIER,
      UserRole.ATTENDANT,
      UserRole.KITCHEN,
    ],
    description: 'Perfil que sera atribuido ao colaborador',
  })
  @IsEnum(UserRole, { message: 'validation.staff.roleInvalid' })
  role: UserRole;

  @ApiProperty({
    example: 'uuid-da-unidade',
    description: 'Unidade onde o colaborador sera vinculado',
  })
  @IsUUID('4', { message: 'validation.staff.unitIdInvalid' })
  unitId: string;

  @ApiProperty({
    example: 72,
    required: false,
    description: 'Tempo de expiracao do convite em horas (padrao: 72)',
  })
  @IsOptional()
  @IsInt({ message: 'validation.staff.expiresInHoursInteger' })
  @Min(1, { message: 'validation.staff.expiresInHoursMin' })
  @Max(240, { message: 'validation.staff.expiresInHoursMax' })
  expiresInHours?: number;
}
