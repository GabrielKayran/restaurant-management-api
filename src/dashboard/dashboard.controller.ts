import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiUnitHeader } from '../common/decorators/api-unit-header.decorator';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { DashboardService } from './dashboard.service';
import { DashboardDateRangeQuery } from './dto/dashboard-date-range.query';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary.response';
import { RecentOrderResponseDto } from './dto/recent-order.response';
import { RecentOrdersQuery } from './dto/recent-orders.query';
import { SalesOverviewItemResponseDto } from './dto/sales-overview-item.response';
import { TopProductResponseDto } from './dto/top-product.response';
import { TopProductsQuery } from './dto/top-products.query';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(
    @CurrentScope() scope: RequestScope,
    @Query() query: DashboardDateRangeQuery,
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(scope, query);
  }

  @Get('sales-overview')
  getSalesOverview(
    @CurrentScope() scope: RequestScope,
    @Query() query: DashboardDateRangeQuery,
  ): Promise<SalesOverviewItemResponseDto[]> {
    return this.dashboardService.getSalesOverview(scope, query);
  }

  @Get('top-products')
  getTopProducts(
    @CurrentScope() scope: RequestScope,
    @Query() query: TopProductsQuery,
  ): Promise<TopProductResponseDto[]> {
    return this.dashboardService.getTopProducts(scope, query);
  }

  @Get('recent-orders')
  getRecentOrders(
    @CurrentScope() scope: RequestScope,
    @Query() query: RecentOrdersQuery,
  ): Promise<RecentOrderResponseDto[]> {
    return this.dashboardService.getRecentOrders(scope, query);
  }
}
