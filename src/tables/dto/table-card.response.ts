import { ApiProperty } from '@nestjs/swagger';
import { TableViewStatus } from './tables-list.query';

export class TableCardResponseDto {
  @ApiProperty({
    description: 'Table unique identifier.',
    example: '92394f44-aac8-4f59-bf18-f73e9def6eaf',
  })
  id: string;

  @ApiProperty({
    description: 'Table display name.',
    example: 'Table 05',
  })
  name: string;

  @ApiProperty({
    description: 'Number of seats available at the table.',
    example: 4,
    nullable: true,
  })
  seats: number | null;

  @ApiProperty({
    description: 'Current table view status.',
    enum: TableViewStatus,
    example: TableViewStatus.OCCUPIED,
  })
  status: TableViewStatus;

  @ApiProperty({
    description: 'Current active order code for occupied tables.',
    example: 1042,
    nullable: true,
  })
  activeOrderCode: number | null;

  @ApiProperty({
    description: 'Elapsed minutes for the active table session.',
    example: 27,
    nullable: true,
  })
  elapsedMinutes: number | null;

  @ApiProperty({
    description: 'Current order total amount for occupied tables.',
    example: 97.5,
    nullable: true,
  })
  totalAmount: number | null;

  @ApiProperty({
    description: 'Reservation start date and time when reserved.',
    example: '2026-03-15T20:00:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  reservedForStart: Date | null;
}
