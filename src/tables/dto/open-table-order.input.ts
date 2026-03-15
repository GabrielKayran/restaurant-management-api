import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class OpenTableOrderInput {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4', { message: 'validation.tables.customerIdInvalid' })
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'validation.common.notesMustBeString' })
  notes: string;
}
