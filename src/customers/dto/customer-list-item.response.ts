import { ApiProperty } from '@nestjs/swagger';

export class CustomerListItemResponseDto {
  @ApiProperty({ example: 'customer-id' })
  id: string;

  @ApiProperty({ example: 'Maria Oliveira' })
  name: string;

  @ApiProperty({ example: '34999998888', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'maria@email.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '12345678900', nullable: true })
  document: string | null;

  @ApiProperty({ example: 5 })
  ordersCount: number;

  @ApiProperty({ example: '2026-03-14T13:00:00.000Z', format: 'date-time' })
  createdAt: Date;
}
