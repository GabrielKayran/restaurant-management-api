import { ApiProperty } from '@nestjs/swagger';

export class CategoryDetailsResponseDto {
  @ApiProperty({ example: 'ae849d70-eef7-47f8-bf59-c52b32523f8f' })
  id: string;

  @ApiProperty({ example: 'Hamburgueres' })
  name: string;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: 18 })
  productsCount: number;

  @ApiProperty({ example: 16 })
  activeProductsCount: number;

  @ApiProperty({ example: '2026-03-10T10:15:00.000Z', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-14T09:01:22.000Z', format: 'date-time' })
  updatedAt: Date;
}
