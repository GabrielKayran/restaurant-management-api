import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum TableViewStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

export class TablesListQueryDto {
  @ApiPropertyOptional({ enum: TableViewStatus })
  @IsOptional()
  @IsEnum(TableViewStatus, { message: 'validation.tables.statusInvalid' })
  status: TableViewStatus;
}
