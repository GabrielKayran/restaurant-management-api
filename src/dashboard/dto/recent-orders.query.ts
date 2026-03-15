import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecentOrdersQuery {
  @ApiPropertyOptional({
    description: 'Quantidade máxima de pedidos recentes',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro.' })
  @Min(1, { message: 'limit deve ser no mínimo 1.' })
  @Max(50, { message: 'limit deve ser no máximo 50.' })
  limit = 10;
}
