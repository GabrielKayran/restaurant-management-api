import { decimalToNumberOrZero } from '../../common/utils/decimal.util';
import { resolveSalePrice } from '../../common/utils/sale-price.util';
import {
  CategoryDetailsResponseDto,
  ProductAvailabilityWindowResponseDto,
  ProductDetailsResponseDto,
  ProductOptionGroupResponseDto,
  ProductOptionResponseDto,
  ProductPriceResponseDto,
  ProductVariantResponseDto,
  ProductListItemResponseDto,
} from '../dto';
import {
  CategoryDetailsRow,
  ProductDetailsRow,
  ProductListRow,
} from './products.selects';

const calculateMarginFields = (
  salePrice: number,
  costPrice: ProductDetailsRow['costPrice'] | ProductListRow['costPrice'],
) => {
  const cost = costPrice ? decimalToNumberOrZero(costPrice) : null;
  const margin = cost === null ? null : Number((salePrice - cost).toFixed(2));
  const marginPercentage =
    margin === null || salePrice === 0
      ? null
      : Number(((margin / salePrice) * 100).toFixed(2));

  return {
    cost,
    margin,
    marginPercentage,
  };
};

const calculateRecipeStock = (product: ProductListRow): number | null => {
  if (!product.recipe?.items?.length) {
    return null;
  }

  const maxUnitsByIngredient = product.recipe.items
    .map((item) => {
      const stockQty = decimalToNumberOrZero(
        item.ingredient.stockItems[0]?.currentQuantity ?? null,
      );
      const ingredientPerProduct = decimalToNumberOrZero(item.quantity);

      if (ingredientPerProduct <= 0) {
        return Number.POSITIVE_INFINITY;
      }

      return Math.floor(stockQty / ingredientPerProduct);
    })
    .filter((value) => Number.isFinite(value));

  return maxUnitsByIngredient.length ? Math.min(...maxUnitsByIngredient) : null;
};

export const mapProductListItem = (
  product: ProductListRow,
  referenceDate: Date = new Date(),
): ProductListItemResponseDto => {
  const salePrice = resolveSalePrice(
    product.basePrice,
    product.prices,
    referenceDate,
  );
  const { cost, margin, marginPercentage } = calculateMarginFields(
    salePrice,
    product.costPrice,
  );

  return {
    id: product.id,
    name: product.name,
    category: product.category?.name ?? null,
    salePrice,
    cost,
    margin,
    marginPercentage,
    stock: calculateRecipeStock(product),
    isActive: product.isActive,
  };
};

export const mapProductDetails = (
  product: ProductDetailsRow,
): ProductDetailsResponseDto => {
  const salePrice = resolveSalePrice(product.basePrice, product.prices);
  const { cost, margin, marginPercentage } = calculateMarginFields(
    salePrice,
    product.costPrice,
  );

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? null,
    sku: product.sku,
    basePrice: decimalToNumberOrZero(product.basePrice),
    salePrice,
    costPrice: cost,
    margin,
    marginPercentage,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    isAvailableForTakeaway: product.isAvailableForTakeaway,
    isAvailableForDelivery: product.isAvailableForDelivery,
    variants: product.variants.map(
      (variant): ProductVariantResponseDto => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        priceDelta: decimalToNumberOrZero(variant.priceDelta),
        isDefault: variant.isDefault,
      }),
    ),
    optionGroups: product.optionGroups.map(
      (group): ProductOptionGroupResponseDto => ({
        id: group.id,
        name: group.name,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        isRequired: group.isRequired,
        sortOrder: group.sortOrder,
        options: group.options.map(
          (option): ProductOptionResponseDto => ({
            id: option.id,
            name: option.name,
            priceDelta: decimalToNumberOrZero(option.priceDelta),
            isActive: option.isActive,
          }),
        ),
      }),
    ),
    prices: product.prices.map(
      (price): ProductPriceResponseDto => ({
        id: price.id,
        name: price.name,
        price: decimalToNumberOrZero(price.price),
        startsAt: price.startsAt,
        endsAt: price.endsAt,
      }),
    ),
    availabilityWindows: product.availabilityWindows.map(
      (window): ProductAvailabilityWindowResponseDto => ({
        id: window.id,
        fulfillmentType: window.fulfillmentType,
        dayOfWeek: window.dayOfWeek,
        startsAtMinutes: window.startsAtMinutes,
        endsAtMinutes: window.endsAtMinutes,
      }),
    ),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

export const mapCategoryDetails = (
  category: CategoryDetailsRow,
): CategoryDetailsResponseDto => ({
  id: category.id,
  name: category.name,
  sortOrder: category.sortOrder,
  productsCount: category._count.products,
  activeProductsCount: category.products.length,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});
