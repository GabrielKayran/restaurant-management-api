import { Module } from '@nestjs/common';
import { AuthRateLimitGuard } from '../auth/guards/auth-rate-limit.guard';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import {
  DeliveryAdminController,
  PublicOrderingController,
  PublicStoreCheckoutController,
} from './public-ordering.controller';
import { PublicOrderingService } from './public-ordering.service';

@Module({
  controllers: [
    PublicOrderingController,
    PublicStoreCheckoutController,
    DeliveryAdminController,
  ],
  providers: [PublicOrderingService, AuthRateLimitGuard, UnitScopeGuard],
  exports: [PublicOrderingService],
})
export class PublicOrderingModule {}
