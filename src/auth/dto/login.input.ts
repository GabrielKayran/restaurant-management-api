import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginInput {
  @ApiProperty({
    example: 'aluno@ufu.br',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'E-mail inválido.' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuário',
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  password: string;
}
