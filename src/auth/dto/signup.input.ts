import { IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupInput {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString({ message: 'O nome deve ser um texto.' })
  name: string;

  @ApiProperty({
    example: 'aluno@ufu.br',
    description: 'Email institucional (@admin ou @ufu)',
  })
  @Matches(/^[^\s@]+@(admin|ufu)(\.[a-zA-Z]{2,})*$/, {
    message:
      'O e-mail deve ser de domínio @admin ou @ufu (ex: usuario@ufu.br).',
  })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha (mínimo 6 caracteres)',
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
