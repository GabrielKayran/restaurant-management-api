import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CustomerAddressInput } from './customer-address.input';

export class CreateCustomerInput {
  @ApiProperty({ example: 'Maria Oliveira' })
  @IsString({ message: 'O nome do cliente deve ser um texto.' })
  @MinLength(2, {
    message: 'O nome do cliente deve ter no minimo 2 caracteres.',
  })
  @MaxLength(120, {
    message: 'O nome do cliente pode ter no maximo 120 caracteres.',
  })
  name: string;

  @ApiPropertyOptional({ example: '34999998888' })
  @IsOptional()
  @IsString({ message: 'O telefone do cliente deve ser um texto.' })
  @MaxLength(20, {
    message: 'O telefone do cliente pode ter no maximo 20 caracteres.',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'O e-mail do cliente e invalido.' })
  email?: string;

  @ApiPropertyOptional({ example: '12345678900' })
  @IsOptional()
  @IsString({ message: 'O documento do cliente deve ser um texto.' })
  @MaxLength(30, {
    message: 'O documento do cliente pode ter no maximo 30 caracteres.',
  })
  document?: string;

  @ApiPropertyOptional({ example: 'Prefere pouca cebola.' })
  @IsOptional()
  @IsString({ message: 'As observacoes do cliente devem ser um texto.' })
  @MaxLength(1000, {
    message: 'As observacoes do cliente podem ter no maximo 1000 caracteres.',
  })
  notes?: string;

  @ApiPropertyOptional({ type: CustomerAddressInput })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressInput)
  address?: CustomerAddressInput;
}
