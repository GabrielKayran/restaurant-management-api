import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiUnitHeader } from '../common/decorators/api-unit-header.decorator';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import { CashRegisterService } from './cash-register.service';
import { CloseCashRegisterInput } from './dto/close-cash-register.input';
import { CashRegisterSummaryResponseDto } from './dto/cash-register-summary.response';
import { CashRegisterTransactionsQueryDto } from './dto/cash-register-transactions.query';
import { CashTransactionResponseDto } from './dto/cash-transaction.response';
import { OpenCashRegisterInput } from './dto/open-cash-register.input';
import { PaymentMethodSummaryResponseDto } from './dto/payment-method-summary.response';

@ApiTags('Cash Register')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('open')
  @ApiOperation({
    summary: 'Open cash register',
    description:
      'Opens a new cash register for the selected unit when no other register is currently open.',
  })
  @ApiCreatedResponse({
    description: 'Cash register opened successfully.',
    schema: {
      example: {
        registerId: '8ec50786-b086-4b67-9f8b-7837523f6969',
        openingFloat: 150,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  open(
    @CurrentScope() scope: RequestScope,
    @Body() input: OpenCashRegisterInput,
  ): Promise<{ registerId: string; openingFloat: number }> {
    return this.cashRegisterService.open(scope, input);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get cash register summary',
    description:
      'Returns KPI metrics for the currently open register in the selected unit.',
  })
  @ApiOkResponse({
    description: 'Cash register summary fetched successfully.',
    type: CashRegisterSummaryResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  getSummary(
    @CurrentScope() scope: RequestScope,
  ): Promise<CashRegisterSummaryResponseDto> {
    return this.cashRegisterService.getSummary(scope);
  }

  @Get('payment-methods-summary')
  @ApiOperation({
    summary: 'Get payment methods summary',
    description:
      'Returns aggregated totals and transaction counts grouped by payment method.',
  })
  @ApiOkResponse({
    description: 'Payment methods summary fetched successfully.',
    type: PaymentMethodSummaryResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  paymentMethodsSummary(
    @CurrentScope() scope: RequestScope,
  ): Promise<PaymentMethodSummaryResponseDto[]> {
    return this.cashRegisterService.paymentMethodsSummary(scope);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'List cash register transactions',
    description:
      'Returns paginated transactions for the current register with optional status, method and date filters.',
  })
  @ApiOkResponse({
    description: 'Cash register transactions listed successfully.',
    type: PaginationResponse,
    schema: {
      example: {
        data: [
          {
            paymentId: '03b5fa50-6528-49f1-a8a6-3f0962a39ac6',
            orderId: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
            orderCode: 1042,
            amount: 97.5,
            method: 'CREDIT_CARD',
            status: 'PAID',
            customerName: 'Maria Oliveira',
            paidAt: '2026-03-15T19:02:11.000Z',
          },
        ],
        total: 73,
        page: 1,
        limit: 10,
        totalPages: 8,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  transactions(
    @CurrentScope() scope: RequestScope,
    @Query() query: CashRegisterTransactionsQueryDto,
  ): Promise<PaginationResponse<CashTransactionResponseDto>> {
    return this.cashRegisterService.transactions(scope, query);
  }

  @Post('close')
  @ApiOperation({
    summary: 'Close cash register',
    description:
      'Closes the current register and returns resulting register identifier and closing value.',
  })
  @ApiCreatedResponse({
    description: 'Cash register closed successfully.',
    schema: {
      example: {
        registerId: '8ec50786-b086-4b67-9f8b-7837523f6969',
        closingValue: 5120.4,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  close(
    @CurrentScope() scope: RequestScope,
    @Body() input: CloseCashRegisterInput,
  ): Promise<{ registerId: string; closingValue: number }> {
    return this.cashRegisterService.close(scope, input);
  }
}
