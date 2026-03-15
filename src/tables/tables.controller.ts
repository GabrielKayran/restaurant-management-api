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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('summary')
  getSummary(
    @CurrentScope() scope: RequestScope,
  ): Promise<TablesSummaryResponseDto> {
    return this.tablesService.getSummary(scope);
  }

  @Get()
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: TablesListQueryDto,
  ): Promise<TableCardResponseDto[]> {
    return this.tablesService.list(scope, query);
  }

  @Get(':id')
  getById(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TableCardResponseDto> {
    return this.tablesService.getById(scope, id);
  }

  @Post(':id/open-session')
  openSession(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: OpenTableSessionInput,
  ): Promise<{ sessionId: string }> {
    return this.tablesService.openSession(scope, id, input);
  }

  @Post(':id/open-order')
  openOrder(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: OpenTableOrderInput,
  ): Promise<{ orderId: string; code: number }> {
    return this.tablesService.openOrder(scope, id, input);
  }

  @Post(':id/reserve')
  reserve(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: ReserveTableInput,
  ): Promise<{ reservationId: string }> {
    return this.tablesService.reserve(scope, id, input);
  }
}
