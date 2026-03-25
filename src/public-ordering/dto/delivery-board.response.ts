import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class DeliveryBoardAddressResponseDto {
  @ApiProperty({ example: 'Rua das Flores', nullable: true })
  street: string | null;

  @ApiProperty({ example: '123', nullable: true })
  number: string | null;

  @ApiProperty({ example: 'Centro', nullable: true })
  neighborhood: string | null;

  @ApiProperty({ example: '38400100', nullable: true })
  zipCode: string | null;

  @ApiProperty({ example: 'Portaria lateral', nullable: true })
  reference: string | null;
}

export class DeliveryBoardOrderCardResponseDto {
  @ApiProperty({ example: 'order-id' })
  id: string;

  @ApiProperty({ example: 'public-token', nullable: true })
  publicToken: string | null;

  @ApiProperty({ example: 1042 })
  code: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PREPARING })
  status: OrderStatus;

  @ApiProperty({ example: 'Maria Oliveira', nullable: true })
  customerName: string | null;

  @ApiProperty({ example: '34999998888', nullable: true })
  customerPhone: string | null;

  @ApiProperty({ example: 'Centro', nullable: true })
  deliveryZoneName: string | null;

  @ApiProperty({ example: 'Carlos Motoboy', nullable: true })
  courierName: string | null;

  @ApiProperty({ type: DeliveryBoardAddressResponseDto, nullable: true })
  address: DeliveryBoardAddressResponseDto | null;

  @ApiProperty({ example: 3 })
  itemsCount: number;

  @ApiProperty({ example: 70.8 })
  total: number;

  @ApiProperty({ example: 'Pedido sem cebola', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2026-03-25T20:30:00.000Z' })
  createdAt: Date;
}

export class DeliveryBoardColumnResponseDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ type: [DeliveryBoardOrderCardResponseDto] })
  orders: DeliveryBoardOrderCardResponseDto[];
}

export class DeliveryBoardResponseDto {
  @ApiProperty({ type: [DeliveryBoardColumnResponseDto] })
  columns: DeliveryBoardColumnResponseDto[];
}
