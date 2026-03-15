import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DashboardDateRangeQuery {
  @ApiPropertyOptional({
    description: 'Data de início do intervalo (ISO 8601)',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate deve ser uma data ISO válida.' })
  startDate: string;

  @ApiPropertyOptional({
    description: 'Data de fim do intervalo (ISO 8601)',
    example: '2026-03-15T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate deve ser uma data ISO válida.' })
  endDate: string;
}
