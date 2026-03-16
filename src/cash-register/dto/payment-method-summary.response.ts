import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PaymentMethodSummaryResponseDto {
  @ApiProperty({
    description: 'Payment method represented by the summary line.',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Total amount collected with the method.',
    example: 2460.35,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total transactions using the method.',
    example: 51,
  })
  transactions: number;
}
