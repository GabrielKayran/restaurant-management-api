import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCategoryInput {
  @ApiProperty({ example: 'Hamburgueres' })
  @IsString({ message: 'O nome da categoria deve ser um texto.' })
  @MaxLength(80, {
    message: 'O nome da categoria pode ter no maximo 80 caracteres.',
  })
  name: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A ordem da categoria deve ser um numero inteiro.' })
  @Min(0, { message: 'A ordem da categoria nao pode ser negativa.' })
  sortOrder?: number;
}
