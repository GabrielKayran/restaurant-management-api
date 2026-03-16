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
import { CreatePaymentInput } from './dto/create-payment.input';
import { PaymentItemResponseDto } from './dto/payment-item.response';
import { PaymentsListQueryDto } from './dto/payments-list.query';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List payments',
    description:
      'Returns paginated payments for the current unit with filters by status, method and date range.',
  })
  @ApiOkResponse({
    description: 'Payments listed successfully.',
    type: PaginationResponse,
    schema: {
      example: {
        data: [
          {
            id: '03b5fa50-6528-49f1-a8a6-3f0962a39ac6',
            orderId: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
            orderCode: 1042,
            method: 'CREDIT_CARD',
            status: 'PAID',
            amount: 97.5,
            reference: 'PAY-20260315-9912',
            paidAt: '2026-03-15T19:02:11.000Z',
            createdAt: '2026-03-15T18:59:03.000Z',
          },
        ],
        total: 67,
        page: 1,
        limit: 10,
        totalPages: 7,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: PaymentsListQueryDto,
  ): Promise<PaginationResponse<PaymentItemResponseDto>> {
    return this.paymentsService.list(scope, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create payment',
    description:
      'Creates a payment entry for an order and optionally updates order/payment status depending on workflow rules.',
  })
  @ApiCreatedResponse({
    description: 'Payment created successfully.',
    type: PaymentItemResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  create(
    @CurrentScope() scope: RequestScope,
    @Body() input: CreatePaymentInput,
  ): Promise<PaymentItemResponseDto> {
    return this.paymentsService.create(scope, input);
  }
}
