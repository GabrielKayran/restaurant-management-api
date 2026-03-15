import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptStaffInviteInput {
  @ApiProperty({
    example: 'TOKEN_DE_CONVITE',
    description: 'Token recebido pelo colaborador para ativar a conta',
  })
  @IsString({ message: 'validation.common.tokenMustBeString' })
  token: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha da conta do colaborador',
  })
  @IsString({ message: 'validation.common.passwordMustBeString' })
  @MinLength(6, { message: 'validation.common.passwordMinLength6' })
  password: string;

  @ApiProperty({
    example: 'Carlos Lima',
    required: false,
    description:
      'Nome obrigatorio apenas quando o colaborador ainda nao existe',
  })
  @IsOptional()
  @IsString({ message: 'validation.common.nameMustBeString' })
  @MinLength(2, { message: 'validation.common.nameMinLength2' })
  name?: string;
}
