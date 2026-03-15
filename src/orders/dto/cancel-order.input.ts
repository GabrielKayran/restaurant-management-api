import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderInput {
  @ApiPropertyOptional({ description: 'Motivo do cancelamento' })
  @IsOptional()
  @IsString({ message: 'validation.orders.reasonMustBeString' })
  @MaxLength(255, { message: 'validation.orders.reasonMaxLength255' })
  reason: string;
}
