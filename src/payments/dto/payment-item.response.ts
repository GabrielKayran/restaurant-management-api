import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentItemResponseDto {
  @ApiProperty({
    description: 'Payment unique identifier.',
    example: '03b5fa50-6528-49f1-a8a6-3f0962a39ac6',
  })
  id: string;

  @ApiProperty({
    description: 'Related order identifier.',
    example: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
  })
  orderId: string;

  @ApiProperty({
    description: 'Related order code.',
    example: 1042,
  })
  orderCode: number;

  @ApiProperty({
    description: 'Payment method used.',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Current payment status.',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Payment amount.',
    example: 97.5,
  })
  amount: number;

  @ApiProperty({
    description: 'Gateway or external reference identifier.',
    example: 'PAY-20260315-9912',
    nullable: true,
  })
  reference: string | null;

  @ApiProperty({
    description: 'Date and time when payment was completed.',
    example: '2026-03-15T19:02:11.000Z',
    format: 'date-time',
    nullable: true,
  })
  paidAt: Date | null;

  @ApiProperty({
    description: 'Payment creation timestamp.',
    example: '2026-03-15T18:59:03.000Z',
    format: 'date-time',
  })
  createdAt: Date;
}
