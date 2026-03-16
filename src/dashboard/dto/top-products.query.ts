import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DashboardDateRangeQuery } from './dashboard-date-range.query';

export class TopProductsQuery extends DashboardDateRangeQuery {
  @ApiPropertyOptional({
    description: 'Maximum number of products to return.',
    example: 5,
    default: 5,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer.' })
  @Min(1, { message: 'limit must be at least 1.' })
  @Max(20, { message: 'limit must be at most 20.' })
  limit?: number = 5;
}
