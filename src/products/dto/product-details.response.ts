export class ProductDetailsResponseDto {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  sku: string | null;
  basePrice: number;
  costPrice: number | null;
  margin: number | null;
  marginPercentage: number | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
