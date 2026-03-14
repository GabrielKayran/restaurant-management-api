import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStaffStatusInput {
  @ApiProperty({
    example: false,
    description: 'Status de ativacao da conta do colaborador',
  })
  @IsBoolean({ message: 'isActive deve ser booleano.' })
  isActive: boolean;
}
