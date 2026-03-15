import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentInput {
  @ApiProperty()
  @IsUUID('4', { message: 'ID do pedido inválido.' })
  orderId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido.' })
  method: PaymentMethod;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O valor deve ser um número com até 2 casas decimais.' },
  )
  @Min(0.01, { message: 'O valor mínimo do pagamento é R$ 0,01.' })
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'A referência deve ser um texto.' })
  reference: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({
    message: 'O campo marcar como pago deve ser verdadeiro ou falso.',
  })
  markAsPaid = true;
}
