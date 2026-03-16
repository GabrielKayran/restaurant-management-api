import { ApiProperty } from '@nestjs/swagger';

export class ProductListItemResponseDto {
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
    description: 'Category display name.',
    example: 'Burgers',
    nullable: true,
  })
  category: string | null;

  @ApiProperty({
    description: 'Current sale price.',
    example: 29.9,
  })
  salePrice: number;

  @ApiProperty({
    description: 'Current cost value.',
    example: 12.4,
    nullable: true,
  })
  cost: number | null;

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
    description: 'Available stock quantity.',
    example: 24,
    nullable: true,
  })
  stock: number | null;

  @ApiProperty({
    description: 'Indicates if the product can be sold.',
    example: true,
  })
  isActive: boolean;
}
