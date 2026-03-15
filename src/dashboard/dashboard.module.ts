import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, UnitScopeGuard],
})
export class DashboardModule {}
