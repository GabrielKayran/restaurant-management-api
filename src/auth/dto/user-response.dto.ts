import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: 'uuid-do-usuario',
    description: 'ID único do usuário',
  })
  id: string;

  @ApiProperty({ example: 'Maria Santos', description: 'Nome do usuário' })
  name: string;

  @ApiProperty({
    example: 'maria.santos@email.com',
    description: 'Email do usuário',
  })
  email: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Data de criação do usuário',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-01-20T15:45:00Z',
    description: 'Data da última atualização',
    required: false,
  })
  updatedAt?: string;
}
