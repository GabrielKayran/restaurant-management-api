import { ApiProperty } from '@nestjs/swagger';

export class UnitSettingsResponseDto {
  @ApiProperty({
    description: 'Unit unique identifier.',
    example: '4c4a8e67-bae0-4a03-a8ec-c275c3aab930',
  })
  id: string;

  @ApiProperty({
    description: 'Parent tenant unique identifier.',
    example: '63be1cd4-8270-4202-a4af-f0341c26eec2',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Unit display name.',
    example: 'Unidade Centro',
  })
  name: string;

  @ApiProperty({
    description: 'Stable slug for the unit.',
    example: 'hamburgueria-central-centro',
  })
  slug: string;

  @ApiProperty({
    description: 'Unit contact phone.',
    example: '34999991111',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Whether the unit is active.',
    example: true,
  })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
