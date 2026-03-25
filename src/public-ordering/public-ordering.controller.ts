import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RateLimit } from '../auth/decorators/rate-limit.decorator';
import { AuthRateLimitGuard } from '../auth/guards/auth-rate-limit.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiUnitHeader } from '../common/decorators/api-unit-header.decorator';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { DeliveryBoardQueryDto } from './dto/delivery-board.query';
import { DeliveryBoardResponseDto } from './dto/delivery-board.response';
import { PublicCheckoutInput } from './dto/public-checkout.input';
import { PublicCheckoutQuoteResponseDto } from './dto/public-checkout.response';
import { PublicMenuResponseDto } from './dto/public-menu.response';
import { PublicOrderTrackingResponseDto } from './dto/public-order-tracking.response';
import { PublicOrderingService } from './public-ordering.service';

@ApiTags('Public Ordering')
@Controller('public')
export class PublicOrderingController {
  constructor(private readonly publicOrderingService: PublicOrderingService) {}

  @Get('stores/:unitSlug/menu')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ key: 'public:menu', limit: 120, windowMs: 60 * 1000 })
  @ApiOperation({
    summary: 'Get public menu by unit slug',
    description:
      'Returns the public digital menu with categories, products, variants, option groups and current availability flags.',
  })
  @ApiOkResponse({ type: PublicMenuResponseDto })
  @ApiTooManyRequestsResponse({ description: 'Too many public menu requests.' })
  getMenu(@Param('unitSlug') unitSlug: string): Promise<PublicMenuResponseDto> {
    return this.publicOrderingService.getPublicMenu(unitSlug);
  }

  @Get('orders/:publicToken/status')
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ key: 'public:tracking', limit: 120, windowMs: 60 * 1000 })
  @ApiOperation({
    summary: 'Track public order status',
    description:
      'Returns order status, timeline and summarized order information for a public order token.',
  })
  @ApiOkResponse({ type: PublicOrderTrackingResponseDto })
  @ApiTooManyRequestsResponse({ description: 'Too many tracking requests.' })
  getPublicOrderStatus(
    @Param('publicToken') publicToken: string,
  ): Promise<PublicOrderTrackingResponseDto> {
    return this.publicOrderingService.getPublicOrderStatus(publicToken);
  }
}

@ApiTags('Public Ordering')
@Controller('public/stores/:unitSlug')
export class PublicStoreCheckoutController {
  constructor(private readonly publicOrderingService: PublicOrderingService) {}

  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ key: 'public:quote', limit: 60, windowMs: 60 * 1000 })
  @ApiOperation({
    summary: 'Calculate checkout totals for cart',
    description:
      'Validates catalog availability and recalculates subtotal, delivery fee and total entirely on the server.',
  })
  @ApiOkResponse({ type: PublicCheckoutQuoteResponseDto })
  @ApiTooManyRequestsResponse({
    description: 'Too many checkout quote requests.',
  })
  @Post('cart/quote')
  quoteCheckout(
    @Param('unitSlug') unitSlug: string,
    @Body() input: PublicCheckoutInput,
  ): Promise<PublicCheckoutQuoteResponseDto> {
    return this.publicOrderingService.quoteCheckout(unitSlug, input);
  }

  @UseGuards(AuthRateLimitGuard)
  @RateLimit({
    key: 'public:create-order',
    limit: 20,
    windowMs: 10 * 60 * 1000,
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Client-generated unique key to make public order creation idempotent.',
  })
  @ApiOperation({
    summary: 'Create public order',
    description:
      'Creates a TAKEAWAY or DELIVERY order from the public storefront using idempotent order creation.',
  })
  @ApiOkResponse({ type: PublicOrderTrackingResponseDto })
  @ApiTooManyRequestsResponse({
    description: 'Too many public order creation attempts.',
  })
  @Post('orders')
  createPublicOrder(
    @Param('unitSlug') unitSlug: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() input: PublicCheckoutInput,
  ): Promise<PublicOrderTrackingResponseDto> {
    return this.publicOrderingService.createPublicOrder(
      unitSlug,
      input,
      idempotencyKey,
    );
  }
}

@ApiTags('Delivery Admin')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('orders/delivery')
export class DeliveryAdminController {
  constructor(private readonly publicOrderingService: PublicOrderingService) {}

  @Get('board')
  @ApiOperation({
    summary: 'Get delivery admin board',
    description:
      'Returns a kanban-like board grouped by order status for delivery operations.',
  })
  @ApiOkResponse({ type: DeliveryBoardResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getDeliveryBoard(
    @CurrentScope() scope: RequestScope,
    @Query() query: DeliveryBoardQueryDto,
  ): Promise<DeliveryBoardResponseDto> {
    return this.publicOrderingService.getDeliveryBoard(scope, query);
  }
}
