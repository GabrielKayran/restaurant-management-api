import { ApiProperty } from '@nestjs/swagger';

export class CashRegisterSummaryResponseDto {
  @ApiProperty({
    description: 'Total sales amount for the open register period.',
    example: 4820.9,
  })
  totalSales: number;

  @ApiProperty({
    description: 'Total paid orders for the open register period.',
    example: 118,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Average ticket value for paid orders.',
    example: 40.86,
  })
  averageTicket: number;

  @ApiProperty({
    description: 'Total amount in pending payment status.',
    example: 215.4,
  })
  pendingPayments: number;

  @ApiProperty({
    description: 'Indicates whether there is an open cash register.',
    example: true,
  })
  hasOpenRegister: boolean;

  @ApiProperty({
    description: 'Open cash register identifier.',
    example: '8ec50786-b086-4b67-9f8b-7837523f6969',
    nullable: true,
  })
  registerId: string | null;

  @ApiProperty({
    description: 'Date and time when register was opened.',
    example: '2026-03-15T10:00:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  openedAt: Date | null;
}
