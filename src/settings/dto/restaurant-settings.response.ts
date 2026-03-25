import { ApiProperty } from '@nestjs/swagger';

export class RestaurantSettingsResponseDto {
  @ApiProperty({
    description: 'Tenant unique identifier.',
    example: '63be1cd4-8270-4202-a4af-f0341c26eec2',
  })
  id: string;

  @ApiProperty({
    description: 'Restaurant trade name.',
    example: 'Hamburgueria Central',
  })
  name: string;

  @ApiProperty({
    description: 'Tenant slug kept as a stable identifier.',
    example: 'hamburgueria-central',
  })
  slug: string;

  @ApiProperty({
    description: 'Restaurant document when available.',
    example: '12345678000199',
    nullable: true,
  })
  document: string | null;

  @ApiProperty({
    description: 'Restaurant contact phone.',
    example: '34999990000',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Whether the restaurant is active.',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Total registered units for the tenant.',
    example: 1,
  })
  unitsCount: number;

  @ApiProperty({
    description: 'Total active units for the tenant.',
    example: 1,
  })
  activeUnitsCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
