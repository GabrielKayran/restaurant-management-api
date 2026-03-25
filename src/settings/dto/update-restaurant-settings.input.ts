import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRestaurantSettingsInput {
  @ApiPropertyOptional({
    description: 'Restaurant trade name.',
    example: 'Hamburgueria Central',
  })
  @IsOptional()
  @IsString({ message: 'validation.string' })
  @MaxLength(120, { message: 'validation.maxLength' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Restaurant document (CPF/CNPJ or internal document).',
    example: '12345678000199',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'validation.string' })
  @MaxLength(32, { message: 'validation.maxLength' })
  document?: string | null;

  @ApiPropertyOptional({
    description: 'Restaurant phone.',
    example: '34999990000',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'validation.string' })
  @MaxLength(32, { message: 'validation.maxLength' })
  phone?: string | null;
}
