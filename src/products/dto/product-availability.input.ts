import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { FulfillmentMethod } from '@prisma/client';

export class CreateProductAvailabilityWindowInput {
  @ApiPropertyOptional({ enum: FulfillmentMethod })
  @IsEnum(FulfillmentMethod, { message: 'Fulfillment invalido.' })
  fulfillmentType: FulfillmentMethod;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Dia da semana deve ser inteiro.' })
  @Min(0, { message: 'Dia da semana minimo e 0.' })
  @Max(6, { message: 'Dia da semana maximo e 6.' })
  dayOfWeek: number;

  @ApiPropertyOptional({ example: 660 })
  @Type(() => Number)
  @IsInt({ message: 'Horario inicial deve ser inteiro.' })
  @Min(0, { message: 'Horario inicial minimo e 0.' })
  @Max(1439, { message: 'Horario inicial maximo e 1439.' })
  startsAtMinutes: number;

  @ApiPropertyOptional({ example: 1380 })
  @Type(() => Number)
  @IsInt({ message: 'Horario final deve ser inteiro.' })
  @Min(1, { message: 'Horario final minimo e 1.' })
  @Max(1440, { message: 'Horario final maximo e 1440.' })
  endsAtMinutes: number;
}
