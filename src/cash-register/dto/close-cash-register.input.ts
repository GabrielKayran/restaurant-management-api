import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CloseCashRegisterInput {
  @ApiPropertyOptional({
    description: 'Valor declarado no fechamento para conciliação',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'O valor de fechamento deve ser um número com até 2 casas decimais.',
    },
  )
  @Min(0, { message: 'O valor de fechamento não pode ser negativo.' })
  declaredClosingValue: number;
}
