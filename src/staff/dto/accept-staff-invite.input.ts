import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptStaffInviteInput {
  @ApiProperty({
    example: 'TOKEN_DE_CONVITE',
    description: 'Token recebido pelo colaborador para ativar a conta',
  })
  @IsString({ message: 'O token deve ser um texto.' })
  token: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha da conta do colaborador',
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(6, { message: 'A senha deve ter no minimo 6 caracteres.' })
  password: string;

  @ApiProperty({
    example: 'Carlos Lima',
    required: false,
    description:
      'Nome obrigatorio apenas quando o colaborador ainda nao existe',
  })
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto.' })
  @MinLength(2, { message: 'O nome deve ter no minimo 2 caracteres.' })
  name?: string;
}
