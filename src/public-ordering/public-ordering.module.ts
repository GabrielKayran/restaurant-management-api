import { Module } from '@nestjs/common';
import { AuthRateLimitGuard } from '../auth/guards/auth-rate-limit.guard';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import {
  DeliveryAdminController,
  PublicOrderingController,
  PublicStoreCheckoutController,
} from './public-ordering.controller';
import {
  PublicCheckoutComputationService,
  PublicCheckoutService,
  PublicDeliveryBoardService,
  PublicMenuService,
  PublicOrderStatusService,
  PublicOrderingContextService,
  PublicOrderingService,
} from './services';

@Module({
  controllers: [
    PublicOrderingController,
    PublicStoreCheckoutController,
    DeliveryAdminController,
  ],
  providers: [
    PublicOrderingService,
    PublicOrderingContextService,
    PublicMenuService,
    PublicCheckoutComputationService,
    PublicCheckoutService,
    PublicOrderStatusService,
    PublicDeliveryBoardService,
    AuthRateLimitGuard,
    UnitScopeGuard,
  ],
  exports: [PublicOrderingService],
})
export class PublicOrderingModule {}
