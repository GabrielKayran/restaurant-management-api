import { ApiProperty } from '@nestjs/swagger';

export class ProductDetailsResponseDto {
  @ApiProperty({
    description: 'Product unique identifier.',
    example: 'f25e1775-5f30-4f22-b7c1-4be7862f249a',
  })
  id: string;

  @ApiProperty({
    description: 'Product display name.',
    example: 'Cheeseburger',
  })
  name: string;

  @ApiProperty({
    description: 'Detailed product description.',
    example: 'Grilled beef burger with cheddar cheese.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Category identifier linked to the product.',
    example: 'ae849d70-eef7-47f8-bf59-c52b32523f8f',
    nullable: true,
  })
  categoryId: string | null;

  @ApiProperty({
    description: 'Category name linked to the product.',
    example: 'Burgers',
    nullable: true,
  })
  categoryName: string | null;

  @ApiProperty({
    description: 'Stock keeping unit.',
    example: 'BURG-CHEESE-01',
    nullable: true,
  })
  sku: string | null;

  @ApiProperty({ description: 'Base sale price.', example: 29.9 })
  basePrice: number;

  @ApiProperty({ description: 'Cost price.', example: 12.4, nullable: true })
  costPrice: number | null;

  @ApiProperty({
    description: 'Absolute margin value.',
    example: 17.5,
    nullable: true,
  })
  margin: number | null;

  @ApiProperty({
    description: 'Margin percentage value.',
    example: 58.53,
    nullable: true,
  })
  marginPercentage: number | null;

  @ApiProperty({
    description: 'Product image URL.',
    example: 'https://cdn.example.com/products/cheeseburger.png',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Indicates if the product is active for sale.',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Record creation timestamp.',
    example: '2026-03-10T10:15:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Record last update timestamp.',
    example: '2026-03-14T09:01:22.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
