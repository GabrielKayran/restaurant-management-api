import { PaymentMethod } from '@prisma/client';

export class PaymentMethodSummaryResponseDto {
  method: PaymentMethod;
  totalAmount: number;
  transactions: number;
}
