import { BadRequestException, Injectable } from '@nestjs/common';
import { FulfillmentMethod, Prisma } from '@prisma/client';
import { decimalToNumberOrZero } from '../../common/utils/decimal.util';
import { resolveSalePrice } from '../../common/utils/sale-price.util';
import { CreateOrderItemOptionInput } from '../../orders/dto/create-order-item.input';
import {
  PublicCheckoutInput,
  PublicCheckoutItemOptionResponseDto,
} from '../dto';
import {
  computeDistanceKm,
  DELIVERY_ZONE_SELECT,
  DeliveryQuote,
  isProductAvailableForFulfillment,
  isUnitEnabledForFulfillment,
  isUnitOpenNow,
  ProductCatalogRow,
  resolveFulfillmentType,
  selectFeeRule,
  selectMatchingDeliveryZone,
} from '../helpers';
import {
  CheckoutComputation,
  OrderingUnitContext,
  PrismaDb,
  TimeContext,
} from '../helpers';
import { PublicOrderingContextService } from './public-ordering-context.service';

@Injectable()
export class PublicCheckoutComputationService {
  constructor(private readonly contextService: PublicOrderingContextService) {}

  async buildCheckout(
    unit: OrderingUnitContext,
    input: PublicCheckoutInput,
    db: PrismaDb,
    timeContext: TimeContext,
  ): Promise<CheckoutComputation> {
    const fulfillmentType = resolveFulfillmentType(input.type);

    if (!unit.publicOrderingEnabled) {
      throw new BadRequestException(
        'Pedidos publicos estao desabilitados para esta unidade.',
      );
    }

    if (!isUnitEnabledForFulfillment(unit, fulfillmentType)) {
      throw new BadRequestException(
        fulfillmentType === FulfillmentMethod.DELIVERY
          ? 'Delivery proprio indisponivel nesta unidade.'
          : 'Retirada indisponivel nesta unidade.',
      );
    }

    if (!isUnitOpenNow(unit, fulfillmentType, timeContext)) {
      throw new BadRequestException(
        fulfillmentType === FulfillmentMethod.DELIVERY
          ? 'Loja fechada para delivery neste momento.'
          : 'Loja fechada para retirada neste momento.',
      );
    }

    if (!input.items?.length) {
      throw new BadRequestException('Carrinho deve conter ao menos um item.');
    }

    if (
      fulfillmentType === FulfillmentMethod.DELIVERY &&
      (!input.address ||
        !input.address.street ||
        !input.address.number ||
        !input.address.city ||
        !input.address.state ||
        !input.address.zipCode)
    ) {
      throw new BadRequestException(
        'Endereco completo e obrigatorio para pedidos de delivery.',
      );
    }

    const productMap = await this.contextService.loadProductMap(
      db,
      unit.id,
      input.items.map((item) => item.productId),
    );

    const quoteItems = [];
    const itemData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BadRequestException(
          'Um ou mais produtos sao invalidos para esta unidade.',
        );
      }

      if (!product.isActive) {
        throw new BadRequestException('Produto inativo nao pode ser pedido.');
      }

      if (
        !isProductAvailableForFulfillment(product, fulfillmentType, timeContext)
      ) {
        throw new BadRequestException(
          `Produto "${product.name}" indisponivel para o tipo de pedido selecionado.`,
        );
      }

      const variant =
        item.variantId !== undefined
          ? this.resolveVariant(product, item.variantId)
          : product.variants.find((entry) => entry.isDefault) ?? null;
      const { options, optionData, optionsTotalPerUnit } =
        this.resolveSelectedOptions(product, item.options ?? []);
      const basePrice = resolveSalePrice(product.basePrice, product.prices);
      const unitPrice =
        basePrice +
        decimalToNumberOrZero(variant?.priceDelta ?? null) +
        optionsTotalPerUnit;
      const totalPrice = unitPrice * item.quantity;

      subtotal += totalPrice;
      quoteItems.push({
        productId: product.id,
        productName: product.name,
        variantName: variant?.name ?? null,
        quantity: item.quantity,
        unitPrice: Number(unitPrice.toFixed(2)),
        totalPrice: Number(totalPrice.toFixed(2)),
        notes: item.notes ?? null,
        options,
      });
      itemData.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        variantName: variant?.name ?? null,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice.toFixed(2)),
        totalPrice: new Prisma.Decimal(totalPrice.toFixed(2)),
        notes: item.notes ?? null,
        options: {
          create: optionData,
        },
      });
    }

    const delivery =
      fulfillmentType === FulfillmentMethod.DELIVERY
        ? await this.resolveDeliveryQuote(db, unit, input, subtotal)
        : {
            zoneId: null,
            zoneName: null,
            distanceKm: null,
            fee: 0,
          };

    return {
      fulfillmentType,
      items: quoteItems,
      itemData,
      subtotal: Number(subtotal.toFixed(2)),
      delivery,
      total: Number((subtotal + delivery.fee).toFixed(2)),
    };
  }

  private async resolveDeliveryQuote(
    db: PrismaDb,
    unit: OrderingUnitContext,
    input: PublicCheckoutInput,
    subtotal: number,
  ): Promise<DeliveryQuote> {
    const address = input.address;

    if (!address) {
      throw new BadRequestException(
        'Endereco completo e obrigatorio para pedidos de delivery.',
      );
    }

    const zones = await db.deliveryZone.findMany({
      where: {
        unitId: unit.id,
        isActive: true,
      },
      select: DELIVERY_ZONE_SELECT,
    });

    if (!zones.length) {
      throw new BadRequestException(
        'Nenhuma zona de entrega ativa foi configurada para esta unidade.',
      );
    }

    const matchedZone = selectMatchingDeliveryZone(zones, address);

    if (!matchedZone) {
      throw new BadRequestException(
        'Endereco fora da area de entrega configurada.',
      );
    }

    const distanceKm = computeDistanceKm(
      unit.latitude,
      unit.longitude,
      address.latitude ?? null,
      address.longitude ?? null,
    );
    const feeRule = selectFeeRule(matchedZone, subtotal, distanceKm);

    if (!feeRule) {
      throw new BadRequestException(
        'Nao foi encontrada regra de taxa compativel para este endereco.',
      );
    }

    return {
      zoneId: matchedZone.id,
      zoneName: matchedZone.name,
      distanceKm,
      fee: decimalToNumberOrZero(feeRule.fee),
    };
  }

  private resolveSelectedOptions(
    product: ProductCatalogRow,
    selectedOptions: CreateOrderItemOptionInput[],
  ): {
    options: PublicCheckoutItemOptionResponseDto[];
    optionData: Prisma.OrderItemOptionUncheckedCreateWithoutOrderItemInput[];
    optionsTotalPerUnit: number;
  } {
    const optionById = new Map<
      string,
      {
        groupId: string;
        option: ProductCatalogRow['optionGroups'][number]['options'][number];
      }
    >();
    const selectedCountByGroupId = new Map<string, number>();
    const options: PublicCheckoutItemOptionResponseDto[] = [];
    const optionData: Prisma.OrderItemOptionUncheckedCreateWithoutOrderItemInput[] =
      [];
    let optionsTotalPerUnit = 0;

    for (const group of product.optionGroups) {
      for (const option of group.options) {
        optionById.set(option.id, {
          groupId: group.id,
          option,
        });
      }
    }

    for (const selectedOption of selectedOptions) {
      const resolved = optionById.get(selectedOption.productOptionId);

      if (!resolved || !resolved.option.isActive) {
        throw new BadRequestException(
          `Opcao invalida para o produto "${product.name}".`,
        );
      }

      const quantity = selectedOption.quantity ?? 1;
      optionsTotalPerUnit +=
        decimalToNumberOrZero(resolved.option.priceDelta) * quantity;
      selectedCountByGroupId.set(
        resolved.groupId,
        (selectedCountByGroupId.get(resolved.groupId) ?? 0) + quantity,
      );
      options.push({
        optionName: resolved.option.name,
        quantity,
        priceDelta: decimalToNumberOrZero(resolved.option.priceDelta),
      });
      optionData.push({
        productOptionId: resolved.option.id,
        optionName: resolved.option.name,
        priceDelta: resolved.option.priceDelta,
        quantity,
      });
    }

    for (const group of product.optionGroups) {
      const selectedCount = selectedCountByGroupId.get(group.id) ?? 0;

      if (group.isRequired && selectedCount === 0) {
        throw new BadRequestException(
          `Grupo obrigatorio "${group.name}" nao foi selecionado.`,
        );
      }

      if (selectedCount < group.minSelect) {
        throw new BadRequestException(
          `Grupo "${group.name}" exige ao menos ${group.minSelect} selecoes.`,
        );
      }

      if (selectedCount > group.maxSelect) {
        throw new BadRequestException(
          `Grupo "${group.name}" permite no maximo ${group.maxSelect} selecoes.`,
        );
      }
    }

    return { options, optionData, optionsTotalPerUnit };
  }

  private resolveVariant(product: ProductCatalogRow, variantId: string) {
    const variant = product.variants.find((entry) => entry.id === variantId);

    if (!variant) {
      throw new BadRequestException(
        `Variante invalida para o produto "${product.name}".`,
      );
    }

    return variant;
  }
}
