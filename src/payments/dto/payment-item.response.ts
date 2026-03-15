import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentItemResponseDto {
  id: string;
  orderId: string;
  orderCode: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  reference: string | null;
  paidAt: Date | null;
  createdAt: Date;
}
