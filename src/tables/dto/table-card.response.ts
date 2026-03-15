import { TableViewStatus } from './tables-list.query';

export class TableCardResponseDto {
  id: string;
  name: string;
  seats: number | null;
  status: TableViewStatus;
  activeOrderCode: number | null;
  elapsedMinutes: number | null;
  totalAmount: number | null;
  reservedForStart: Date | null;
}
