import { ApiProperty } from '@nestjs/swagger';

export class SalesByHourResponseDto {
  @ApiProperty({
    description: 'Hour bucket (0-23).',
    example: 10,
    minimum: 0,
    maximum: 23,
  })
  hour: number;

  @ApiProperty({
    description: 'Total sales amount in this hour.',
    example: 320,
  })
  sales: number;

  @ApiProperty({
    description: 'Number of orders in this hour.',
    example: 6,
  })
  orders: number;
}
