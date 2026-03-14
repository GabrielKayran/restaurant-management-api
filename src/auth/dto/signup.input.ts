import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupInput {
  @ApiProperty({
    example: 'Joao Silva',
    description: 'Nome completo do usuario',
  })
  @IsString({ message: 'O nome deve ser um texto.' })
  name: string;

  @ApiProperty({
    example: 'joao@restaurante.com',
    description: 'Email do usuario',
  })
  @IsEmail({}, { message: 'E-mail invalido.' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha (minimo 6 caracteres)',
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(6, { message: 'A senha deve ter no minimo 6 caracteres.' })
  password: string;

  @ApiProperty({
    example: 'Grupo Sabor Mineiro',
    description: 'Nome do tenant a ser criado no onboarding',
  })
  @IsString({ message: 'O nome do tenant deve ser um texto.' })
  tenantName: string;

  @ApiProperty({
    example: 'Loja Centro',
    description: 'Nome da unidade inicial do restaurante',
  })
  @IsString({ message: 'O nome da unidade deve ser um texto.' })
  unitName: string;

  @ApiProperty({
    example: '3433310001',
    description: 'Telefone opcional da unidade inicial',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser um texto.' })
  phone?: string;
}
