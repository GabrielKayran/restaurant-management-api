import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DashboardDateRangeQuery } from './dashboard-date-range.query';

export class TopProductsQuery extends DashboardDateRangeQuery {
  @ApiPropertyOptional({
    description: 'Quantidade máxima de produtos retornados',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro.' })
  @Min(1, { message: 'limit deve ser no mínimo 1.' })
  @Max(20, { message: 'limit deve ser no máximo 20.' })
  limit = 5;
}
