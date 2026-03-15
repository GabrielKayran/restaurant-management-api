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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: OrdersListQueryDto,
  ): Promise<PaginationResponse<OrderListItemResponseDto>> {
    return this.ordersService.list(scope, query);
  }

  @Get(':id')
  getById(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.getById(scope, id);
  }

  @Post()
  create(
    @CurrentScope() scope: RequestScope,
    @Body() input: CreateOrderInput,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.create(scope, input);
  }

  @Patch(':id')
  update(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateOrderInput,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.update(scope, id, input);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateOrderStatusInput,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.updateStatus(scope, id, input);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: CancelOrderInput,
  ): Promise<OrderDetailsResponseDto> {
    return this.ordersService.cancel(scope, id, input.reason);
  }
}
