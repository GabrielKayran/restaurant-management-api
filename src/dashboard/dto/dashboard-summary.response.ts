import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryResponseDto {
  @ApiProperty({
    description: 'Total sales in the selected period.',
    example: 1845.7,
  })
  salesToday: number;

  @ApiProperty({
    description: 'Total number of orders in the selected period.',
    example: 42,
  })
  ordersToday: number;

  @ApiProperty({
    description: 'Average order ticket value in the selected period.',
    example: 43.95,
  })
  averageTicketToday: number;

  @ApiProperty({
    description:
      'Average preparation time in minutes considering orders with confirmed and ready timestamps.',
    example: 18.4,
  })
  averagePreparationTimeMinutes: number;
}
