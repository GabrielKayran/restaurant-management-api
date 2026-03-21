import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DashboardDateRangeQuery } from './dashboard-date-range.query';

export enum PreparationTimeTrendGroupBy {
  DAY = 'day',
  HOUR = 'hour',
}

export class PreparationTimeTrendQuery extends DashboardDateRangeQuery {
  @ApiPropertyOptional({
    description: 'Time granularity for trend grouping.',
    enum: PreparationTimeTrendGroupBy,
    default: PreparationTimeTrendGroupBy.DAY,
    example: PreparationTimeTrendGroupBy.DAY,
  })
  @IsOptional()
  @IsEnum(PreparationTimeTrendGroupBy, {
    message: 'groupBy must be either day or hour.',
  })
  groupBy?: PreparationTimeTrendGroupBy = PreparationTimeTrendGroupBy.DAY;
}
