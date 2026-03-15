import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CashTransactionResponseDto {
  paymentId: string;
  orderId: string;
  orderCode: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  customerName: string | null;
  paidAt: Date | null;
}
