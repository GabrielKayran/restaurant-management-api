import { ApiProperty } from '@nestjs/swagger';

export class SalesOverviewItemResponseDto {
  @ApiProperty({
    description: 'Date bucket in YYYY-MM-DD format.',
    example: '2026-03-15',
  })
  date: string;

  @ApiProperty({
    description: 'Total sales amount for the date bucket.',
    example: 920.5,
  })
  sales: number;

  @ApiProperty({
    description: 'Total number of orders for the date bucket.',
    example: 21,
  })
  orders: number;
}
