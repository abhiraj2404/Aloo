-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'BILL_SPLIT';
ALTER TYPE "AuditAction" ADD VALUE 'ORDER_MOVED';

-- DropIndex
DROP INDEX "Bill_tableSessionId_key";

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "parentBillId" TEXT,
ADD COLUMN     "tipAmount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BillItem" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,

    CONSTRAINT "BillItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillItem_billId_idx" ON "BillItem"("billId");

-- CreateIndex
CREATE INDEX "BillItem_orderItemId_idx" ON "BillItem"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "BillItem_billId_orderItemId_key" ON "BillItem"("billId", "orderItemId");

-- CreateIndex
CREATE INDEX "Bill_tableSessionId_idx" ON "Bill"("tableSessionId");

-- CreateIndex
CREATE INDEX "Bill_parentBillId_idx" ON "Bill"("parentBillId");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_parentBillId_fkey" FOREIGN KEY ("parentBillId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
