import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
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
  @ApiOperation({
    summary: 'Get dashboard summary metrics',
    description:
      'Returns consolidated KPIs for the selected date range, including total sales, order count, average ticket and average preparation time.',
  })
  @ApiOkResponse({
    description: 'Dashboard summary generated successfully.',
    type: DashboardSummaryResponseDto,
    schema: {
      example: {
        salesToday: 1845.7,
        ordersToday: 42,
        averageTicketToday: 43.95,
        averagePreparationTimeMinutes: 18.4,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  getSummary(
    @CurrentScope() scope: RequestScope,
    @Query() query: DashboardDateRangeQuery,
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(scope, query);
  }

  @Get('sales-overview')
  @ApiOperation({
    summary: 'Get sales overview grouped by day',
    description:
      'Returns daily sales and orders for the selected date range. Cancelled orders are excluded.',
  })
  @ApiOkResponse({
    description: 'Sales overview generated successfully.',
    type: SalesOverviewItemResponseDto,
    isArray: true,
    schema: {
      example: [
        {
          date: '2026-03-13',
          sales: 742.5,
          orders: 17,
        },
        {
          date: '2026-03-14',
          sales: 920.5,
          orders: 21,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  getSalesOverview(
    @CurrentScope() scope: RequestScope,
    @Query() query: DashboardDateRangeQuery,
  ): Promise<SalesOverviewItemResponseDto[]> {
    return this.dashboardService.getSalesOverview(scope, query);
  }

  @Get('top-products')
  @ApiOperation({
    summary: 'Get top-selling products',
    description:
      'Returns products ranked by sold quantity in the selected date range, including total quantity sold and generated sales.',
  })
  @ApiOkResponse({
    description: 'Top products generated successfully.',
    type: TopProductResponseDto,
    isArray: true,
    schema: {
      example: [
        {
          productId: '8f42f0a6-1464-47db-bef9-7e8cb2d6144d',
          productName: 'Cheeseburger',
          quantitySold: 37,
          totalSales: 1098.63,
        },
        {
          productId: '8d190f53-c5f1-4ff0-a437-811f76621be8',
          productName: 'Fries',
          quantitySold: 29,
          totalSales: 377,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  getTopProducts(
    @CurrentScope() scope: RequestScope,
    @Query() query: TopProductsQuery,
  ): Promise<TopProductResponseDto[]> {
    return this.dashboardService.getTopProducts(scope, query);
  }

  @Get('recent-orders')
  @ApiOperation({
    summary: 'Get most recent orders',
    description:
      'Returns the most recent orders for the current unit with compact information useful for dashboard cards and activity feeds.',
  })
  @ApiOkResponse({
    description: 'Recent orders fetched successfully.',
    type: RecentOrderResponseDto,
    isArray: true,
    schema: {
      example: [
        {
          id: 'd6145c3b-34a9-440f-95f3-105498c8ce67',
          code: 1024,
          type: 'DINE_IN',
          status: 'PREPARING',
          customerName: 'John Doe',
          tableName: 'Table 12',
          total: 89.9,
          createdAt: '2026-03-15T18:25:33.417Z',
          itemsCount: 4,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  getRecentOrders(
    @CurrentScope() scope: RequestScope,
    @Query() query: RecentOrdersQuery,
  ): Promise<RecentOrderResponseDto[]> {
    return this.dashboardService.getRecentOrders(scope, query);
  }
}
