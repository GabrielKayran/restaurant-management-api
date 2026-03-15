import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemInput } from './create-order-item.input';

export class CreateOrderInput {
  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType, { message: 'Tipo de pedido inválido.' })
  type: OrderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente inválido.' })
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID da mesa inválido.' })
  tableId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID do endereço inválido.' })
  addressId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID do entregador inválido.' })
  courierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto.' })
  notes: string;

  @ApiProperty({ type: [CreateOrderItemInput] })
  @IsArray({ message: 'Os itens do pedido devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInput)
  items: CreateOrderItemInput[];
}
