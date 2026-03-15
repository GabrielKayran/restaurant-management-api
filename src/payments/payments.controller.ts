import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: PaymentsListQueryDto,
  ): Promise<PaginationResponse<PaymentItemResponseDto>> {
    return this.paymentsService.list(scope, query);
  }

  @Post()
  create(
    @CurrentScope() scope: RequestScope,
    @Body() input: CreatePaymentInput,
  ): Promise<PaymentItemResponseDto> {
    return this.paymentsService.create(scope, input);
  }
}
