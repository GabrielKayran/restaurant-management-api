import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class OpenTableSessionInput {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O número de pessoas deve ser um inteiro.' })
  @Min(1, { message: 'O número mínimo de pessoas é 1.' })
  @Max(30, { message: 'O número máximo de pessoas é 30.' })
  guestCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto.' })
  notes: string;
}
