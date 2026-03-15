import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, UnitScopeGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
