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

export class CashRegisterTransactionsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página mínima é 1.' })
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro.' })
  @Min(1, { message: 'O limite mínimo é 1.' })
  @Max(100, { message: 'O limite máximo é 100.' })
  limit: number = 10;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Status de pagamento inválido.' })
  status: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido.' })
  method: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Data de início inválida.' })
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim inválida.' })
  endDate: string;
}
