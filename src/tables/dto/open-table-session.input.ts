import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class OpenTableSessionInput {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.tables.guestCountMustBeInteger' })
  @Min(1, { message: 'validation.tables.guestCountMin' })
  @Max(30, { message: 'validation.tables.guestCountMax' })
  guestCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.common.notesMustBeString' })
  notes: string;
}
