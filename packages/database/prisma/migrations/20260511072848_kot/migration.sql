-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'READY', 'SERVED', 'HOLD', 'VOID');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "TableSession" ADD COLUMN     "pax" INTEGER;

-- CreateTable
CREATE TABLE "Kot" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kotNumber" INTEGER NOT NULL,
    "dailyKey" TEXT NOT NULL,
    "isSupplementary" BOOLEAN NOT NULL DEFAULT false,
    "items" JSONB NOT NULL,
    "printedAt" TIMESTAMP(3),
    "printCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KotDailySequence" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "dailyKey" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "KotDailySequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kot_orderId_key" ON "Kot"("orderId");

-- CreateIndex
CREATE INDEX "Kot_shopId_createdAt_idx" ON "Kot"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Kot_shopId_dailyKey_idx" ON "Kot"("shopId", "dailyKey");

-- CreateIndex
CREATE UNIQUE INDEX "KotDailySequence_shopId_dailyKey_key" ON "KotDailySequence"("shopId", "dailyKey");

-- AddForeignKey
ALTER TABLE "Kot" ADD CONSTRAINT "Kot_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kot" ADD CONSTRAINT "Kot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KotDailySequence" ADD CONSTRAINT "KotDailySequence_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
