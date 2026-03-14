import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateStaffInput {
  @ApiProperty({
    example: 'Carlos Lima',
    description: 'Nome completo do colaborador',
  })
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(2, { message: 'O nome deve ter no minimo 2 caracteres.' })
  name: string;

  @ApiProperty({
    example: 'carlos@restaurante.com',
    description: 'E-mail do colaborador',
  })
  @IsEmail({}, { message: 'E-mail invalido.' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha inicial do colaborador',
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(6, { message: 'A senha deve ter no minimo 6 caracteres.' })
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
  @IsEnum(UserRole, { message: 'Role invalida.' })
  role: UserRole;

  @ApiProperty({
    example: 'uuid-da-unidade',
    description: 'Unidade onde o colaborador vai atuar',
  })
  @IsUUID('4', { message: 'unitId deve ser um UUID valido.' })
  unitId: string;
}
