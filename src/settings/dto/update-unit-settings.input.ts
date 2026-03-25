import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUnitSettingsInput {
  @ApiPropertyOptional({
    description: 'Unit display name.',
    example: 'Unidade Centro',
  })
  @IsOptional()
  @IsString({ message: 'validation.string' })
  @MaxLength(120, { message: 'validation.maxLength' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Unit phone.',
    example: '34999991111',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'validation.string' })
  @MaxLength(32, { message: 'validation.maxLength' })
  phone?: string | null;
}
