import { Injectable } from '@nestjs/common';
import { RequestScope } from '../../common/models/request-scope.model';
import {
  DeliveryBoardQueryDto,
  DeliveryBoardResponseDto,
  PublicCheckoutInput,
  PublicCheckoutQuoteResponseDto,
  PublicMenuResponseDto,
  PublicOrderTrackingResponseDto,
} from '../dto';
import { PublicCheckoutService } from './public-checkout.service';
import { PublicDeliveryBoardService } from './public-delivery-board.service';
import { PublicMenuService } from './public-menu.service';
import { PublicOrderStatusService } from './public-order-status.service';

@Injectable()
export class PublicOrderingService {
  constructor(
    private readonly menuService: PublicMenuService,
    private readonly checkoutService: PublicCheckoutService,
    private readonly orderStatusService: PublicOrderStatusService,
    private readonly deliveryBoardService: PublicDeliveryBoardService,
  ) {}

  async getPublicMenu(unitSlug: string): Promise<PublicMenuResponseDto> {
    return this.menuService.getPublicMenu(unitSlug);
  }

  async quoteCheckout(
    unitSlug: string,
    input: PublicCheckoutInput,
  ): Promise<PublicCheckoutQuoteResponseDto> {
    return this.checkoutService.quoteCheckout(unitSlug, input);
  }

  async createPublicOrder(
    unitSlug: string,
    input: PublicCheckoutInput,
    idempotencyKey?: string,
  ): Promise<PublicOrderTrackingResponseDto> {
    return this.checkoutService.createPublicOrder(
      unitSlug,
      input,
      idempotencyKey,
    );
  }

  async getPublicOrderStatus(
    publicToken: string,
  ): Promise<PublicOrderTrackingResponseDto> {
    return this.orderStatusService.getPublicOrderStatus(publicToken);
  }

  async getDeliveryBoard(
    scope: RequestScope,
    query: DeliveryBoardQueryDto,
  ): Promise<DeliveryBoardResponseDto> {
    return this.deliveryBoardService.getDeliveryBoard(scope, query);
  }
}
