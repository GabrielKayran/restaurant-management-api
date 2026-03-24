import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CustomerAddressInput {
  @ApiPropertyOptional({ example: 'Casa' })
  @IsOptional()
  @IsString({ message: 'O rotulo do endereco deve ser um texto.' })
  @MaxLength(40, {
    message: 'O rotulo do endereco pode ter no maximo 40 caracteres.',
  })
  label?: string;

  @ApiProperty({ example: 'Rua Afonso Pena' })
  @IsString({ message: 'A rua deve ser um texto.' })
  @MaxLength(120, { message: 'A rua pode ter no maximo 120 caracteres.' })
  street: string;

  @ApiProperty({ example: '123' })
  @IsString({ message: 'O numero deve ser um texto.' })
  @MaxLength(20, { message: 'O numero pode ter no maximo 20 caracteres.' })
  number: string;

  @ApiPropertyOptional({ example: 'Apto 101' })
  @IsOptional()
  @IsString({ message: 'O complemento deve ser um texto.' })
  @MaxLength(120, {
    message: 'O complemento pode ter no maximo 120 caracteres.',
  })
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString({ message: 'O bairro deve ser um texto.' })
  @MaxLength(120, { message: 'O bairro pode ter no maximo 120 caracteres.' })
  neighborhood?: string;

  @ApiProperty({ example: 'Uberlandia' })
  @IsString({ message: 'A cidade deve ser um texto.' })
  @MaxLength(120, { message: 'A cidade pode ter no maximo 120 caracteres.' })
  city: string;

  @ApiProperty({ example: 'MG' })
  @IsString({ message: 'O estado deve ser um texto.' })
  @MaxLength(2, { message: 'O estado deve ter no maximo 2 caracteres.' })
  state: string;

  @ApiProperty({ example: '38400100' })
  @IsString({ message: 'O CEP deve ser um texto.' })
  @MaxLength(12, { message: 'O CEP pode ter no maximo 12 caracteres.' })
  zipCode: string;

  @ApiPropertyOptional({ example: 'Casa azul na esquina' })
  @IsOptional()
  @IsString({ message: 'A referencia deve ser um texto.' })
  @MaxLength(255, {
    message: 'A referencia pode ter no maximo 255 caracteres.',
  })
  reference?: string;
}
