import { ApiProperty } from '@nestjs/swagger';

export class CustomerAddressResponseDto {
  @ApiProperty({ example: 'address-id' })
  id: string;

  @ApiProperty({ example: 'Casa', nullable: true })
  label: string | null;

  @ApiProperty({ example: 'Rua Afonso Pena' })
  street: string;

  @ApiProperty({ example: '123' })
  number: string;

  @ApiProperty({ example: 'Apto 101', nullable: true })
  complement: string | null;

  @ApiProperty({ example: 'Centro', nullable: true })
  neighborhood: string | null;

  @ApiProperty({ example: 'Uberlandia' })
  city: string;

  @ApiProperty({ example: 'MG' })
  state: string;

  @ApiProperty({ example: '38400100' })
  zipCode: string;

  @ApiProperty({ example: 'Casa azul na esquina', nullable: true })
  reference: string | null;
}

export class CustomerDetailsResponseDto {
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

  @ApiProperty({ example: 'Prefere pouca cebola.', nullable: true })
  notes: string | null;

  @ApiProperty({ type: [CustomerAddressResponseDto] })
  addresses: CustomerAddressResponseDto[];

  @ApiProperty({ example: '2026-03-14T13:00:00.000Z', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-14T13:00:00.000Z', format: 'date-time' })
  updatedAt: Date;
}
