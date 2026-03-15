import { Module } from '@nestjs/common';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';

@Module({
  controllers: [CashRegisterController],
  providers: [CashRegisterService, UnitScopeGuard],
})
export class CashRegisterModule {}
