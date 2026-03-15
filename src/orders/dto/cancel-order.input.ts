import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderInput {
  @ApiPropertyOptional({ description: 'Motivo do cancelamento' })
  @IsOptional()
  @IsString({ message: 'O motivo deve ser um texto.' })
  @MaxLength(255, { message: 'O motivo pode ter no máximo 255 ca racteres.' })
  reason: string;
}
