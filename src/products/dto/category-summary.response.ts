import { ApiProperty } from '@nestjs/swagger';

export class ProductCategorySummaryResponseDto {
  @ApiProperty({
    description: 'Category unique identifier.',
    example: 'ae849d70-eef7-47f8-bf59-c52b32523f8f',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category display name.',
    example: 'Burgers',
  })
  categoryName: string;

  @ApiProperty({
    description: 'Total products in this category.',
    example: 18,
  })
  productsCount: number;

  @ApiProperty({
    description: 'Total active products in this category.',
    example: 16,
  })
  activeProductsCount: number;
}
