import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { OrderType, PaymentMethod } from '@prisma/client';
import { CreateOrderItemInput } from '../../orders/dto/create-order-item.input';
import {
  sanitizePhone,
  sanitizeStateCode,
  sanitizeTrimmedString,
  sanitizeZipCode,
} from '../../common/utils/sanitize.util';

export class PublicCustomerInput {
  @ApiProperty({ example: 'Mariana Alves' })
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Nome do cliente deve ser texto.' })
  @MaxLength(120, {
    message: 'Nome do cliente deve ter no maximo 120 caracteres.',
  })
  name: string;

  @ApiProperty({ example: '34988887777' })
  @Transform(({ value }) => sanitizePhone(value))
  @Matches(/^\d{10,11}$/, {
    message: 'Telefone deve conter 10 ou 11 digitos.',
  })
  phone: string;

  @ApiPropertyOptional({ example: 'maria@email.com', nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value)?.toLowerCase() ?? null)
  @IsEmail({}, { message: 'Email invalido.' })
  email?: string | null;

  @ApiPropertyOptional({ example: '12345678900', nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Documento deve ser texto.' })
  @MaxLength(32, { message: 'Documento deve ter no maximo 32 caracteres.' })
  document?: string | null;
}

export class PublicCheckoutAddressInput {
  @ApiProperty({ example: 'Rua das Flores' })
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Rua deve ser texto.' })
  @MaxLength(160, { message: 'Rua deve ter no maximo 160 caracteres.' })
  street: string;

  @ApiProperty({ example: '123' })
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Numero deve ser texto.' })
  @MaxLength(40, { message: 'Numero deve ter no maximo 40 caracteres.' })
  number: string;

  @ApiPropertyOptional({ example: 'Apto 12', nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Complemento deve ser texto.' })
  @MaxLength(120, {
    message: 'Complemento deve ter no maximo 120 caracteres.',
  })
  complement?: string | null;

  @ApiProperty({ example: 'Centro' })
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Bairro deve ser texto.' })
  @MaxLength(120, { message: 'Bairro deve ter no maximo 120 caracteres.' })
  neighborhood: string;

  @ApiProperty({ example: 'Uberlandia' })
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Cidade deve ser texto.' })
  @MaxLength(120, { message: 'Cidade deve ter no maximo 120 caracteres.' })
  city: string;

  @ApiProperty({ example: 'MG' })
  @Transform(({ value }) => sanitizeStateCode(value))
  @Matches(/^[A-Z]{2}$/, { message: 'Estado deve conter 2 letras.' })
  state: string;

  @ApiProperty({ example: '38400100' })
  @Transform(({ value }) => sanitizeZipCode(value))
  @Matches(/^\d{8}$/, { message: 'CEP deve conter 8 digitos.' })
  zipCode: string;

  @ApiPropertyOptional({ example: 'Casa azul na esquina', nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Referencia deve ser texto.' })
  @MaxLength(160, { message: 'Referencia deve ter no maximo 160 caracteres.' })
  reference?: string | null;

  @ApiPropertyOptional({ example: -18.9141, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 7 }, { message: 'Latitude deve ser numerica.' })
  latitude?: number | null;

  @ApiPropertyOptional({ example: -48.2749, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 7 },
    { message: 'Longitude deve ser numerica.' },
  )
  longitude?: number | null;
}

export class PublicCheckoutInput {
  @ApiProperty({ enum: OrderType, example: OrderType.DELIVERY })
  @IsEnum(OrderType, { message: 'Tipo de pedido invalido.' })
  type: OrderType;

  @ApiProperty({ type: PublicCustomerInput })
  @ValidateNested()
  @Type(() => PublicCustomerInput)
  customer: PublicCustomerInput;

  @ApiPropertyOptional({ type: PublicCheckoutAddressInput, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PublicCheckoutAddressInput)
  address?: PublicCheckoutAddressInput;

  @ApiProperty({ type: [CreateOrderItemInput] })
  @IsArray({ message: 'Itens devem ser enviados em lista.' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInput)
  items: CreateOrderItemInput[];

  @ApiPropertyOptional({ example: 'Sem cebola', nullable: true })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Observacoes devem ser texto.' })
  @MaxLength(500, {
    message: 'Observacoes devem ter no maximo 500 caracteres.',
  })
  notes?: string | null;

  @ApiPropertyOptional({ enum: PaymentMethod, nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Metodo de pagamento invalido.' })
  paymentMethod?: PaymentMethod | null;

  @ApiPropertyOptional({
    example: 'qr-menu-mesa-centro',
    description: 'Referencia opcional do canal/link usado no pedido.',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => sanitizeTrimmedString(value))
  @IsString({ message: 'Referencia de origem deve ser texto.' })
  @MaxLength(120, {
    message: 'Referencia de origem deve ter no maximo 120 caracteres.',
  })
  sourceReference?: string | null;
}
