export class ProductListItemResponseDto {
  id: string;
  name: string;
  category: string | null;
  salePrice: number;
  cost: number | null;
  margin: number | null;
  marginPercentage: number | null;
  stock: number | null;
  isActive: boolean;
}
