import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import { CashRegisterService } from './cash-register.service';
import { CloseCashRegisterInput } from './dto/close-cash-register.input';
import { CashRegisterSummaryResponseDto } from './dto/cash-register-summary.response';
import { CashRegisterTransactionsQueryDto } from './dto/cash-register-transactions.query';
import { CashTransactionResponseDto } from './dto/cash-transaction.response';
import { PaymentMethodSummaryResponseDto } from './dto/payment-method-summary.response';

@ApiTags('Cash Register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Get('summary')
  getSummary(
    @CurrentScope() scope: RequestScope,
  ): Promise<CashRegisterSummaryResponseDto> {
    return this.cashRegisterService.getSummary(scope);
  }

  @Get('payment-methods-summary')
  paymentMethodsSummary(
    @CurrentScope() scope: RequestScope,
  ): Promise<PaymentMethodSummaryResponseDto[]> {
    return this.cashRegisterService.paymentMethodsSummary(scope);
  }

  @Get('transactions')
  transactions(
    @CurrentScope() scope: RequestScope,
    @Query() query: CashRegisterTransactionsQueryDto,
  ): Promise<PaginationResponse<CashTransactionResponseDto>> {
    return this.cashRegisterService.transactions(scope, query);
  }

  @Post('close')
  close(
    @CurrentScope() scope: RequestScope,
    @Body() input: CloseCashRegisterInput,
  ): Promise<{ registerId: string; closingValue: number }> {
    return this.cashRegisterService.close(scope, input);
  }
}
