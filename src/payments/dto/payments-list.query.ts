import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class PaymentsListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.common.pageMustBeInteger' })
  @Min(1, { message: 'validation.common.pageMin' })
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.common.limitMustBeInteger' })
  @Min(1, { message: 'validation.common.limitMin' })
  @Max(100, { message: 'validation.common.limitMax100' })
  limit: number = 10;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'validation.payments.statusInvalid' })
  status: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'validation.payments.methodInvalid' })
  method: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'validation.common.startDateInvalid' })
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'validation.common.endDateInvalid' })
  endDate: string;
}
