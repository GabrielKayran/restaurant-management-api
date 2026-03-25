import { ApiProperty } from '@nestjs/swagger';

export class PublicFulfillmentAvailabilityResponseDto {
  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: true })
  isOpenNow: boolean;
}

export class PublicOperatingHourResponseDto {
  @ApiProperty({ example: 'TAKEAWAY' })
  fulfillmentType: string;

  @ApiProperty({ example: 1 })
  dayOfWeek: number;

  @ApiProperty({ example: 660 })
  opensAtMinutes: number;

  @ApiProperty({ example: 1380 })
  closesAtMinutes: number;

  @ApiProperty({ example: false })
  isClosed: boolean;
}

export class PublicProductAvailabilityWindowResponseDto {
  @ApiProperty({ example: 'DELIVERY' })
  fulfillmentType: string;

  @ApiProperty({ example: 5 })
  dayOfWeek: number;

  @ApiProperty({ example: 1080 })
  startsAtMinutes: number;

  @ApiProperty({ example: 1380 })
  endsAtMinutes: number;
}

export class PublicMenuOptionResponseDto {
  @ApiProperty({ example: 'option-id' })
  id: string;

  @ApiProperty({ example: 'Bacon extra' })
  name: string;

  @ApiProperty({ example: 4.5 })
  priceDelta: number;
}

export class PublicMenuOptionGroupResponseDto {
  @ApiProperty({ example: 'group-id' })
  id: string;

  @ApiProperty({ example: 'Adicionais' })
  name: string;

  @ApiProperty({ example: 0 })
  minSelect: number;

  @ApiProperty({ example: 3 })
  maxSelect: number;

  @ApiProperty({ example: false })
  isRequired: boolean;

  @ApiProperty({ type: [PublicMenuOptionResponseDto] })
  options: PublicMenuOptionResponseDto[];
}

export class PublicMenuVariantResponseDto {
  @ApiProperty({ example: 'variant-id' })
  id: string;

  @ApiProperty({ example: 'Duplo' })
  name: string;

  @ApiProperty({ example: 8 })
  priceDelta: number;

  @ApiProperty({ example: true })
  isDefault: boolean;
}

export class PublicMenuProductResponseDto {
  @ApiProperty({ example: 'product-id' })
  id: string;

  @ApiProperty({ example: 'X-Burger' })
  name: string;

  @ApiProperty({
    example: 'Hamburguer artesanal com queijo e salada',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    example: 'https://cdn.example.com/burger.png',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({ example: 28.9 })
  salePrice: number;

  @ApiProperty({ example: true })
  isAvailableForTakeaway: boolean;

  @ApiProperty({ example: true })
  isAvailableForDelivery: boolean;

  @ApiProperty({ example: true })
  isCurrentlyAvailableForTakeaway: boolean;

  @ApiProperty({ example: false })
  isCurrentlyAvailableForDelivery: boolean;

  @ApiProperty({ type: [PublicMenuVariantResponseDto] })
  variants: PublicMenuVariantResponseDto[];

  @ApiProperty({ type: [PublicMenuOptionGroupResponseDto] })
  optionGroups: PublicMenuOptionGroupResponseDto[];

  @ApiProperty({ type: [PublicProductAvailabilityWindowResponseDto] })
  availabilityWindows: PublicProductAvailabilityWindowResponseDto[];
}

export class PublicMenuCategoryResponseDto {
  @ApiProperty({ example: 'category-id' })
  id: string;

  @ApiProperty({ example: 'Burgers' })
  name: string;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ type: [PublicMenuProductResponseDto] })
  products: PublicMenuProductResponseDto[];
}

export class PublicStoreResponseDto {
  @ApiProperty({ example: 'unit-id' })
  id: string;

  @ApiProperty({ example: 'Loja Centro' })
  name: string;

  @ApiProperty({ example: 'loja-centro' })
  slug: string;

  @ApiProperty({ example: '3433310001', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'America/Sao_Paulo' })
  orderingTimeZone: string;

  @ApiProperty({
    example: 'Hamburguer artesanal e delivery proprio.',
    nullable: true,
  })
  publicDescription: string | null;

  @ApiProperty({ example: 20 })
  pickupLeadTimeMinutes: number;

  @ApiProperty({ example: 45 })
  deliveryLeadTimeMinutes: number;

  @ApiProperty({ type: PublicFulfillmentAvailabilityResponseDto })
  takeaway: PublicFulfillmentAvailabilityResponseDto;

  @ApiProperty({ type: PublicFulfillmentAvailabilityResponseDto })
  delivery: PublicFulfillmentAvailabilityResponseDto;

  @ApiProperty({ type: [PublicOperatingHourResponseDto] })
  operatingHours: PublicOperatingHourResponseDto[];
}

export class PublicMenuResponseDto {
  @ApiProperty({ type: PublicStoreResponseDto })
  store: PublicStoreResponseDto;

  @ApiProperty({ type: [PublicMenuCategoryResponseDto] })
  categories: PublicMenuCategoryResponseDto[];

  @ApiProperty({ example: '2026-03-25T20:00:00.000Z' })
  generatedAt: Date;

  @ApiProperty({ example: 60 })
  cacheTtlSeconds: number;
}
