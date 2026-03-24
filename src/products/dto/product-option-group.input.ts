import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductOptionInput {
  @ApiProperty({ example: 'Bacon extra' })
  @IsString({ message: 'O nome do adicional deve ser um texto.' })
  @MaxLength(80, {
    message: 'O nome do adicional pode ter no maximo 80 caracteres.',
  })
  name: string;

  @ApiProperty({ example: 4.5, default: 0 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'O valor do adicional deve ser um numero com ate 2 casas decimais.',
    },
  )
  @Min(0, { message: 'O valor do adicional nao pode ser negativo.' })
  priceDelta: number = 0;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({
    message: 'O campo ativo do adicional deve ser verdadeiro ou falso.',
  })
  isActive?: boolean;
}

export class CreateProductOptionGroupInput {
  @ApiProperty({ example: 'Adicionais' })
  @IsString({ message: 'O nome do grupo de adicionais deve ser um texto.' })
  @MaxLength(80, {
    message: 'O nome do grupo de adicionais pode ter no maximo 80 caracteres.',
  })
  name: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O minimo de selecoes deve ser um numero inteiro.' })
  @Min(0, { message: 'O minimo de selecoes nao pode ser negativo.' })
  minSelect?: number;

  @ApiPropertyOptional({ example: 3, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O maximo de selecoes deve ser um numero inteiro.' })
  @Min(1, { message: 'O maximo de selecoes deve ser no minimo 1.' })
  @Max(20, { message: 'O maximo de selecoes deve ser no maximo 20.' })
  maxSelect?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'O campo obrigatorio deve ser verdadeiro ou falso.' })
  isRequired?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A ordem do grupo deve ser um numero inteiro.' })
  @Min(0, { message: 'A ordem do grupo nao pode ser negativa.' })
  sortOrder?: number;

  @ApiProperty({ type: [CreateProductOptionInput] })
  @IsArray({ message: 'As opcoes do grupo devem ser uma lista.' })
  @ArrayNotEmpty({ message: 'Cada grupo deve possuir pelo menos uma opcao.' })
  @Type(() => CreateProductOptionInput)
  options: CreateProductOptionInput[];
}
