import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateStaffInput {
  @ApiProperty({
    example: 'Carlos Lima',
    description: 'Nome completo do colaborador',
  })
  @IsString({ message: 'validation.common.nameMustBeString' })
  @MinLength(2, { message: 'validation.common.nameMinLength2' })
  name: string;

  @ApiProperty({
    example: 'carlos@restaurante.com',
    description: 'E-mail do colaborador',
  })
  @IsEmail({}, { message: 'validation.common.emailInvalid' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha inicial do colaborador',
  })
  @IsString({ message: 'validation.common.passwordMustBeString' })
  @MinLength(6, { message: 'validation.common.passwordMinLength6' })
  password: string;

  @ApiProperty({
    enum: [
      UserRole.MANAGER,
      UserRole.CASHIER,
      UserRole.ATTENDANT,
      UserRole.KITCHEN,
    ],
    description: 'Perfil do colaborador na unidade',
  })
  @IsEnum(UserRole, { message: 'validation.staff.roleInvalid' })
  role: UserRole;

  @ApiProperty({
    example: 'uuid-da-unidade',
    description: 'Unidade onde o colaborador vai atuar',
  })
  @IsUUID('4', { message: 'validation.staff.unitIdInvalid' })
  unitId: string;
}
