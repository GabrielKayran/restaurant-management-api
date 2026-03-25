-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('TAKEAWAY', 'DELIVERY');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('BACKOFFICE', 'PUBLIC_CATALOG', 'EXTERNAL_INTEGRATION');

-- AlterTable
ALTER TABLE "RestaurantUnit"
ADD COLUMN "publicDescription" TEXT,
ADD COLUMN "orderingTimeZone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
ADD COLUMN "publicMenuEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "publicOrderingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "takeawayEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "pickupLeadTimeMinutes" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN "deliveryLeadTimeMinutes" INTEGER NOT NULL DEFAULT 45,
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7);

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "isAvailableForTakeaway" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isAvailableForDelivery" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "deliveryZoneId" TEXT,
ADD COLUMN "channel" "OrderChannel" NOT NULL DEFAULT 'BACKOFFICE',
ADD COLUMN "publicToken" TEXT,
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyHash" TEXT,
ADD COLUMN "sourceReference" TEXT;

-- CreateTable
CREATE TABLE "DeliveryZoneCoverageRule" (
    "id" TEXT NOT NULL,
    "deliveryZoneId" TEXT NOT NULL,
    "zipCodePrefix" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZoneCoverageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitOperatingHour" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "fulfillmentType" "FulfillmentMethod" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "opensAtMinutes" INTEGER NOT NULL,
    "closesAtMinutes" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitOperatingHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAvailabilityWindow" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fulfillmentType" "FulfillmentMethod" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startsAtMinutes" INTEGER NOT NULL,
    "endsAtMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "Order_unitId_idempotencyKey_key" ON "Order"("unitId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "DeliveryZoneCoverageRule_deliveryZoneId_sortOrder_idx" ON "DeliveryZoneCoverageRule"("deliveryZoneId", "sortOrder");

-- CreateIndex
CREATE INDEX "DeliveryZoneCoverageRule_zipCodePrefix_idx" ON "DeliveryZoneCoverageRule"("zipCodePrefix");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOperatingHour_unitId_fulfillmentType_dayOfWeek_key" ON "UnitOperatingHour"("unitId", "fulfillmentType", "dayOfWeek");

-- CreateIndex
CREATE INDEX "UnitOperatingHour_unitId_fulfillmentType_dayOfWeek_idx" ON "UnitOperatingHour"("unitId", "fulfillmentType", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ProductAvailabilityWindow_productId_fulfillmentType_dayOfWeek_idx" ON "ProductAvailabilityWindow"("productId", "fulfillmentType", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryZoneCoverageRule" ADD CONSTRAINT "DeliveryZoneCoverageRule_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitOperatingHour" ADD CONSTRAINT "UnitOperatingHour_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "RestaurantUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAvailabilityWindow" ADD CONSTRAINT "ProductAvailabilityWindow_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
