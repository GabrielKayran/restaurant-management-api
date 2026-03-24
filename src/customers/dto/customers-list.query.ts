import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CustomersListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A pagina deve ser um numero inteiro.' })
  @Min(1, { message: 'A pagina minima e 1.' })
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um numero inteiro.' })
  @Min(1, { message: 'O limite minimo e 1.' })
  @Max(100, { message: 'O limite maximo e 100.' })
  limit: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'A busca deve ser um texto.' })
  search?: string;
}
