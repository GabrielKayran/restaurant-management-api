import { FulfillmentMethod, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { PublicCheckoutItemResponseDto } from '../dto';

export type PrismaDb = PrismaService | Prisma.TransactionClient;

export type TimeContext = {
  now: Date;
  dayOfWeek: number;
  minutesOfDay: number;
};

export type DeliveryQuote = {
  zoneId: string | null;
  zoneName: string | null;
  distanceKm: number | null;
  fee: number;
};

export type CheckoutComputation = {
  fulfillmentType: FulfillmentMethod;
  itemData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[];
  items: PublicCheckoutItemResponseDto[];
  subtotal: number;
  delivery: DeliveryQuote;
  total: number;
};

export const PUBLIC_MENU_CACHE_TTL_MS = 60 * 1000;
