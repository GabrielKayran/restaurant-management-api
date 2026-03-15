import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentInput {
  @ApiProperty()
  @IsUUID('4', { message: 'validation.payments.orderIdInvalid' })
  orderId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod, { message: 'validation.payments.methodInvalid' })
  method: PaymentMethod;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'validation.payments.amountDecimal' },
  )
  @Min(0.01, { message: 'validation.payments.amountMin' })
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.payments.referenceMustBeString' })
  reference: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({
    message: 'validation.payments.markAsPaidBoolean',
  })
  markAsPaid: boolean = true;
}
