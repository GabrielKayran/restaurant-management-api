import { RequestScope } from '../../common/models/request-scope.model';
import { DeliveryBoardQueryDto, PublicCheckoutInput } from '../dto';
import { PublicCheckoutService } from './public-checkout.service';
import { PublicDeliveryBoardService } from './public-delivery-board.service';
import { PublicMenuService } from './public-menu.service';
import { PublicOrderingService } from './public-ordering.service';
import { PublicOrderStatusService } from './public-order-status.service';

describe('PublicOrderingService', () => {
  let service: PublicOrderingService;
  let menuService: { getPublicMenu: jest.Mock };
  let checkoutService: {
    quoteCheckout: jest.Mock;
    createPublicOrder: jest.Mock;
  };
  let orderStatusService: { getPublicOrderStatus: jest.Mock };
  let deliveryBoardService: { getDeliveryBoard: jest.Mock };

  const scope: RequestScope = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
  };

  beforeEach(() => {
    menuService = { getPublicMenu: jest.fn() };
    checkoutService = {
      quoteCheckout: jest.fn(),
      createPublicOrder: jest.fn(),
    };
    orderStatusService = { getPublicOrderStatus: jest.fn() };
    deliveryBoardService = { getDeliveryBoard: jest.fn() };

    service = new PublicOrderingService(
      menuService as unknown as PublicMenuService,
      checkoutService as unknown as PublicCheckoutService,
      orderStatusService as unknown as PublicOrderStatusService,
      deliveryBoardService as unknown as PublicDeliveryBoardService,
    );
  });

  it('delegates menu reads to PublicMenuService', async () => {
    menuService.getPublicMenu.mockResolvedValue({ categories: [] });

    const result = await service.getPublicMenu('loja-centro');

    expect(result).toEqual({ categories: [] });
    expect(menuService.getPublicMenu).toHaveBeenCalledWith('loja-centro');
  });

  it('delegates checkout flows to PublicCheckoutService', async () => {
    const input = { type: 'DELIVERY' } as PublicCheckoutInput;
    checkoutService.quoteCheckout.mockResolvedValue({ total: 58 });

    const result = await service.quoteCheckout('loja-centro', input);

    expect(result).toEqual({ total: 58 });
    expect(checkoutService.quoteCheckout).toHaveBeenCalledWith(
      'loja-centro',
      input,
    );
  });

  it('delegates delivery board reads to PublicDeliveryBoardService', async () => {
    const query = { includeCompleted: false } as DeliveryBoardQueryDto;
    deliveryBoardService.getDeliveryBoard.mockResolvedValue({ columns: [] });

    const result = await service.getDeliveryBoard(scope, query);

    expect(result).toEqual({ columns: [] });
    expect(deliveryBoardService.getDeliveryBoard).toHaveBeenCalledWith(
      scope,
      query,
    );
  });
});
