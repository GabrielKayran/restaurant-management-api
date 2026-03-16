import { ApiProperty } from '@nestjs/swagger';

export class TablesSummaryResponseDto {
  @ApiProperty({ description: 'Number of available tables.', example: 12 })
  availableTables: number;

  @ApiProperty({
    description: 'Number of currently occupied tables.',
    example: 8,
  })
  occupiedTables: number;

  @ApiProperty({
    description: 'Number of currently reserved tables.',
    example: 3,
  })
  reservedTables: number;
}
