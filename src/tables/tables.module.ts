import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';

@Module({
  controllers: [TablesController],
  providers: [TablesService, UnitScopeGuard],
})
export class TablesModule {}
