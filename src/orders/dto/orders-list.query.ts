import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class OrdersListQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.common.pageMustBeInteger' })
  @Min(1, { message: 'validation.common.pageMin' })
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.common.limitMustBeInteger' })
  @Min(1, { message: 'validation.common.limitMin' })
  @Max(100, { message: 'validation.common.limitMax100' })
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Código do pedido, nome da mesa ou nome do cliente',
  })
  @IsOptional()
  @IsString({ message: 'validation.common.searchMustBeString' })
  search: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'validation.orders.statusInvalid' })
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Data de início (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'validation.common.startDateInvalid' })
  startDate: string;

  @ApiPropertyOptional({ description: 'Data de fim (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'validation.common.endDateInvalid' })
  endDate: string;
}
