import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, UnitScopeGuard],
  exports: [PaymentsService],
})
export class PaymentsModule {}
