import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductPriceInput {
  @ApiProperty({ example: 'Promocao almoco' })
  @IsString({ message: 'O nome do preco deve ser um texto.' })
  @MaxLength(80, {
    message: 'O nome do preco pode ter no maximo 80 caracteres.',
  })
  name: string;

  @ApiProperty({ example: 27.9 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'O preco promocional deve ser um numero com ate 2 casas decimais.',
    },
  )
  @Min(0, { message: 'O preco promocional nao pode ser negativo.' })
  price: number;

  @ApiPropertyOptional({ example: '2026-03-23T11:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'A data inicial do preco e invalida.' })
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-03-23T15:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'A data final do preco e invalida.' })
  endsAt?: string;
}
