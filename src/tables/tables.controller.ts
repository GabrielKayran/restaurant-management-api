import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { OpenTableOrderInput } from './dto/open-table-order.input';
import { OpenTableSessionInput } from './dto/open-table-session.input';
import { ReserveTableInput } from './dto/reserve-table.input';
import { TableCardResponseDto } from './dto/table-card.response';
import { TablesListQueryDto } from './dto/tables-list.query';
import { TablesSummaryResponseDto } from './dto/table-summary.response';
import { TablesService } from './tables.service';

@ApiTags('Tables')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get tables summary',
    description:
      'Returns an overview with counts of available, occupied and reserved tables.',
  })
  @ApiOkResponse({
    description: 'Tables summary fetched successfully.',
    type: TablesSummaryResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  getSummary(
    @CurrentScope() scope: RequestScope,
  ): Promise<TablesSummaryResponseDto> {
    return this.tablesService.getSummary(scope);
  }

  @Get()
  @ApiOperation({
    summary: 'List tables',
    description:
      'Returns tables for the current unit with optional status filtering.',
  })
  @ApiOkResponse({
    description: 'Tables listed successfully.',
    type: TableCardResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: TablesListQueryDto,
  ): Promise<TableCardResponseDto[]> {
    return this.tablesService.list(scope, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get table details',
    description: 'Returns one table card by identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Table unique identifier.',
    example: '92394f44-aac8-4f59-bf18-f73e9def6eaf',
  })
  @ApiOkResponse({
    description: 'Table fetched successfully.',
    type: TableCardResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Table not found for the selected unit.',
  })
  getById(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TableCardResponseDto> {
    return this.tablesService.getById(scope, id);
  }

  @Post(':id/open-session')
  @ApiOperation({
    summary: 'Open table session',
    description: 'Opens a table session so table consumption can be tracked.',
  })
  @ApiParam({
    name: 'id',
    description: 'Table unique identifier.',
    example: '92394f44-aac8-4f59-bf18-f73e9def6eaf',
  })
  @ApiCreatedResponse({
    description: 'Table session opened successfully.',
    schema: {
      example: {
        sessionId: 'f6ce0d09-3258-43da-a83c-5f987f359287',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Table not found for the selected unit.',
  })
  openSession(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: OpenTableSessionInput,
  ): Promise<{ sessionId: string }> {
    return this.tablesService.openSession(scope, id, input);
  }

  @Post(':id/open-order')
  @ApiOperation({
    summary: 'Open table order',
    description: 'Creates a new order linked to a specific table.',
  })
  @ApiParam({
    name: 'id',
    description: 'Table unique identifier.',
    example: '92394f44-aac8-4f59-bf18-f73e9def6eaf',
  })
  @ApiCreatedResponse({
    description: 'Table order opened successfully.',
    schema: {
      example: {
        orderId: '6fd8b32d-cb4f-4fa5-9670-a1476a4eaf0a',
        code: 1042,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Table not found for the selected unit.',
  })
  openOrder(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: OpenTableOrderInput,
  ): Promise<{ orderId: string; code: number }> {
    return this.tablesService.openOrder(scope, id, input);
  }

  @Post(':id/reserve')
  @ApiOperation({
    summary: 'Reserve table',
    description: 'Creates a reservation for a specific table and time window.',
  })
  @ApiParam({
    name: 'id',
    description: 'Table unique identifier.',
    example: '92394f44-aac8-4f59-bf18-f73e9def6eaf',
  })
  @ApiCreatedResponse({
    description: 'Table reserved successfully.',
    schema: {
      example: {
        reservationId: '0a6f9c2e-c048-4739-a2f8-7460412f31e7',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  @ApiNotFoundResponse({
    description: 'Table not found for the selected unit.',
  })
  reserve(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: ReserveTableInput,
  ): Promise<{ reservationId: string }> {
    return this.tablesService.reserve(scope, id, input);
  }
}
