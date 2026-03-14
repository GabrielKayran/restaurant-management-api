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
  @IsEmail({}, { message: 'E-mail invalido.' })
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
  @IsEnum(UserRole, { message: 'Role invalida.' })
  role: UserRole;

  @ApiProperty({
    example: 'uuid-da-unidade',
    description: 'Unidade onde o colaborador sera vinculado',
  })
  @IsUUID('4', { message: 'unitId deve ser um UUID valido.' })
  unitId: string;

  @ApiProperty({
    example: 72,
    required: false,
    description: 'Tempo de expiracao do convite em horas (padrao: 72)',
  })
  @IsOptional()
  @IsInt({ message: 'expiresInHours deve ser um numero inteiro.' })
  @Min(1, { message: 'expiresInHours deve ser no minimo 1 hora.' })
  @Max(240, { message: 'expiresInHours deve ser no maximo 240 horas.' })
  expiresInHours?: number;
}
