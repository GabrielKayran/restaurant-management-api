import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DashboardDateRangeQuery {
  @ApiPropertyOptional({
    description: 'Start date of the reporting range (ISO 8601).',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO date string.' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date of the reporting range (ISO 8601).',
    example: '2026-03-15T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string.' })
  endDate?: string;
}
