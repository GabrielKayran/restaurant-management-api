import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupInput {
  @ApiProperty({
    example: 'Joao Silva',
    description: 'Nome completo do usuario',
  })
  @IsString({ message: 'validation.common.nameMustBeString' })
  name: string;

  @ApiProperty({
    example: 'joao@restaurante.com',
    description: 'Email do usuario',
  })
  @IsEmail({}, { message: 'validation.common.emailInvalid' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha (minimo 6 caracteres)',
  })
  @IsString({ message: 'validation.common.passwordMustBeString' })
  @MinLength(6, { message: 'validation.common.passwordMinLength6' })
  password: string;

  @ApiProperty({
    example: 'Grupo Sabor Mineiro',
    description: 'Nome do tenant a ser criado no onboarding',
  })
  @IsString({ message: 'validation.auth.tenantNameMustBeString' })
  tenantName: string;

  @ApiProperty({
    example: 'Loja Centro',
    description: 'Nome da unidade inicial do restaurante',
  })
  @IsString({ message: 'validation.auth.unitNameMustBeString' })
  unitName: string;

  @ApiProperty({
    example: '3433310001',
    description: 'Telefone opcional da unidade inicial',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'validation.common.phoneMustBeString' })
  phone?: string;
}
