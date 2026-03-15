import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ReserveTableInput {
  @ApiProperty({ description: 'Nome do responsável pela reserva' })
  @IsString({ message: 'validation.tables.reservationNameMustBeString' })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.common.phoneMustBeString' })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.tables.customerIdInvalid' })
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'validation.tables.guestCountMustBeInteger' })
  @Min(1, { message: 'validation.tables.guestCountMin' })
  @Max(30, { message: 'validation.tables.guestCountMax' })
  guestCount: number;

  @ApiProperty({ description: 'Início da reserva (ISO 8601)' })
  @IsDateString({}, { message: 'validation.tables.reservationStartInvalid' })
  reservedForStart: string;

  @ApiProperty({ description: 'Fim da reserva (ISO 8601)' })
  @IsDateString({}, { message: 'validation.tables.reservationEndInvalid' })
  reservedForEnd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.common.notesMustBeString' })
  notes: string;
}
