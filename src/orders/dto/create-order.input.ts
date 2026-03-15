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
  @IsEnum(OrderType, { message: 'validation.orders.typeInvalid' })
  type: OrderType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.orders.customerIdInvalid' })
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.orders.tableIdInvalid' })
  tableId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.orders.addressIdInvalid' })
  addressId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.orders.courierIdInvalid' })
  courierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.common.notesMustBeString' })
  notes: string;

  @ApiProperty({ type: [CreateOrderItemInput] })
  @IsArray({ message: 'validation.orders.itemsMustBeArray' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInput)
  items: CreateOrderItemInput[];
}
