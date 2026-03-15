import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginInput {
  @ApiProperty({
    example: 'ana@sabormineiro.com',
    description: 'Email do usuario',
  })
  @IsEmail({}, { message: 'validation.common.emailInvalid' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do usuario',
  })
  @IsString({ message: 'validation.common.passwordMustBeString' })
  password: string;
}
