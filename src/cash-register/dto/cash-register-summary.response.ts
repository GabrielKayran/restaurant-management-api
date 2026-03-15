export class CashRegisterSummaryResponseDto {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  pendingPayments: number;
  hasOpenRegister: boolean;
  registerId: string | null;
  openedAt: Date | null;
}
