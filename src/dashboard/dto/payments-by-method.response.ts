import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PaymentsByMethodResponseDto {
  @ApiProperty({
    description: 'Payment method bucket.',
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
  })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Number of payments in this method.',
    example: 40,
  })
  count: number;

  @ApiProperty({
    description: 'Total amount paid in this method.',
    example: 2450.5,
  })
  totalAmount: number;
}
