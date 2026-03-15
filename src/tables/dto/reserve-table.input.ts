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
  @IsString({ message: 'O nome do responsável deve ser um texto.' })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'O telefone deve ser um texto.' })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente inválido.' })
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'O número de pessoas deve ser um inteiro.' })
  @Min(1, { message: 'O número mínimo de pessoas é 1.' })
  @Max(30, { message: 'O número máximo de pessoas é 30.' })
  guestCount: number;

  @ApiProperty({ description: 'Início da reserva (ISO 8601)' })
  @IsDateString({}, { message: 'Data de início da reserva inválida.' })
  reservedForStart: string;

  @ApiProperty({ description: 'Fim da reserva (ISO 8601)' })
  @IsDateString({}, { message: 'Data de fim da reserva inválida.' })
  reservedForEnd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto.' })
  notes: string;
}
