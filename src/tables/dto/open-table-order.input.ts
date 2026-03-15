import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class OpenTableOrderInput {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente inválido.' })
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto.' })
  notes: string;
}
