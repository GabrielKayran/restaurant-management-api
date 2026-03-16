import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiUnitHeader } from '../common/decorators/api-unit-header.decorator';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import { CancelOrderInput } from './dto/cancel-order.input';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderDetailsResponseDto } from './dto/order-details.response';
import { OrderListItemResponseDto } from './dto/order-list-item.response';
import { UpdateOrderStatusInput } from './dto/order-status.input';
import { OrdersListQueryDto } from './dto/orders-list.query';
import { UpdateOrderInput } from './dto/update-order.input';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List orders',
    description:
      'Returns paginated orders for the current unit with optional filters by status, type and date range.',
  })
  @ApiOkResponse({
    description: 'Orders listed successfully.',
    type: PaginationResponse,
    schema: {
      example: {
        data: [
          {
            id: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
            code: 1042,
            status: 'PREPARING',
            type: 'DELIVERY',
            customerName: 'Maria Oliveira',
            tableName: null,
            itemsCount: 3,
            total: 97.5,
            createdAt: '2026-03-15T18:25:33.417Z',
          },
        ],
        total: 42,
        page: 1,
        limit: 10,
        totalPages: 5,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: OrdersListQueryDto,
  ): Promise<PaginationResponse<OrderListItemResponseDto>> {
    return this.ordersService.list(scope, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order details',
    description:
      'Returns full order details including items and status history.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order unique identifier.',
    example: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
  })
  @ApiOkResponse({
    description: 'Order details fetched successfully.',
    type: OrderDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found for the selected unit.',
  })
  getById(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.getById(scope, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create order',
    description: 'Creates a new order in the current unit context.',
  })
  @ApiCreatedResponse({
    description: 'Order created successfully.',
    type: OrderDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  create(
    @CurrentScope() scope: RequestScope,
    @Body() input: CreateOrderInput,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.create(scope, input);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update order',
    description:
      'Updates editable order information such as notes and delivery details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order unique identifier.',
    example: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
  })
  @ApiOkResponse({
    description: 'Order updated successfully.',
    type: OrderDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found for the selected unit.',
  })
  update(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateOrderInput,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.update(scope, id, input);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Transitions an order to a new status and records status history metadata.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order unique identifier.',
    example: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
  })
  @ApiOkResponse({
    description: 'Order status updated successfully.',
    type: OrderDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found for the selected unit.',
  })
  updateStatus(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateOrderStatusInput,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.updateStatus(scope, id, input);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel order',
    description:
      'Cancels an order and records cancellation reason in order history.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order unique identifier.',
    example: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
  })
  @ApiOkResponse({
    description: 'Order cancelled successfully.',
    type: OrderDetailsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found for the selected unit.',
  })
  cancel(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: CancelOrderInput,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.cancel(scope, id, input.reason);
  }
}
