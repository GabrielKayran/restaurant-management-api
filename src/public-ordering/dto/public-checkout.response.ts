import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';
import { PublicStoreResponseDto } from './public-menu.response';

export class PublicDeliveryQuoteResponseDto {
  @ApiProperty({ example: 'zone-id', nullable: true })
  zoneId: string | null;

  @ApiProperty({ example: 'Centro', nullable: true })
  zoneName: string | null;

  @ApiProperty({ example: 4.2, nullable: true })
  distanceKm: number | null;
}

export class PublicCheckoutItemOptionResponseDto {
  @ApiProperty({ example: 'Bacon extra' })
  optionName: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 4.5 })
  priceDelta: number;
}

export class PublicCheckoutItemResponseDto {
  @ApiProperty({ example: 'product-id' })
  productId: string;

  @ApiProperty({ example: 'X-Burger' })
  productName: string;

  @ApiProperty({ example: 'Duplo', nullable: true })
  variantName: string | null;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 32.4 })
  unitPrice: number;

  @ApiProperty({ example: 64.8 })
  totalPrice: number;

  @ApiProperty({ example: 'Sem cebola', nullable: true })
  notes: string | null;

  @ApiProperty({ type: [PublicCheckoutItemOptionResponseDto] })
  options: PublicCheckoutItemOptionResponseDto[];
}

export class PublicCheckoutQuoteResponseDto {
  @ApiProperty({ type: PublicStoreResponseDto })
  store: PublicStoreResponseDto;

  @ApiProperty({ enum: OrderType, example: OrderType.DELIVERY })
  type: OrderType;

  @ApiProperty({ type: [PublicCheckoutItemResponseDto] })
  items: PublicCheckoutItemResponseDto[];

  @ApiProperty({ example: 62.8 })
  subtotal: number;

  @ApiProperty({ example: 8 })
  deliveryFee: number;

  @ApiProperty({ example: 70.8 })
  total: number;

  @ApiProperty({ type: PublicDeliveryQuoteResponseDto })
  delivery: PublicDeliveryQuoteResponseDto;
}
