import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginInput {
  @ApiProperty({
    example: 'ana@sabormineiro.com',
    description: 'Email do usuario',
  })
  @IsEmail({}, { message: 'E-mail invalido.' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuario',
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  password: string;
}
