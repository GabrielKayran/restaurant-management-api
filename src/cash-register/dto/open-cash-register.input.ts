import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class OpenCashRegisterInput {
  @ApiPropertyOptional({
    description: 'Valor de abertura informado para o caixa.',
    example: 150,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'O valor de abertura deve ser um numero com ate 2 casas decimais.',
    },
  )
  @Min(0, { message: 'O valor de abertura nao pode ser negativo.' })
  openingFloat?: number;
}
