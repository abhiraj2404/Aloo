/*
  Warnings:

  - You are about to drop the column `discount` on the `Bill` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `Bill` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,billNumber]` on the table `Bill` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `billNumber` to the `Bill` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FLAT');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CARD', 'UPI', 'WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('BILL_GENERATED', 'BILL_DISCOUNT_APPLIED', 'BILL_DISCOUNT_CLEARED', 'BILL_PAYMENT_RECORDED', 'BILL_CANCELLED', 'BILL_PRINTED');

-- AlterEnum
ALTER TYPE "BillStatus" ADD VALUE 'PARTIALLY_PAID';

-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "discount",
DROP COLUMN "tax",
ADD COLUMN     "billNumber" TEXT NOT NULL,
ADD COLUMN     "cancelledReason" TEXT,
ADD COLUMN     "cgstAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paidAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roundOff" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "serviceChargeAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sgstAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'DINE_IN';

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "cgstRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "serviceChargeRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sgstRate" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillNumberSequence" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BillNumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_billId_idx" ON "Payment"("billId");

-- CreateIndex
CREATE INDEX "Payment_shopId_createdAt_idx" ON "Payment"("shopId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillNumberSequence_shopId_financialYear_key" ON "BillNumberSequence"("shopId", "financialYear");

-- CreateIndex
CREATE INDEX "AuditLog_shopId_createdAt_idx" ON "AuditLog"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_shopId_billNumber_key" ON "Bill"("shopId", "billNumber");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillNumberSequence" ADD CONSTRAINT "BillNumberSequence_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
