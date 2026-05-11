-- DropIndex
DROP INDEX "OrderItem_orderId_itemId_key";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "addons" JSONB,
ADD COLUMN     "variantId" TEXT,
ADD COLUMN     "variantName" TEXT;

-- CreateTable
CREATE TABLE "ItemVariant" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ItemVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddonGroup" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AddonGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "addonGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAddonGroup" (
    "itemId" TEXT NOT NULL,
    "addonGroupId" TEXT NOT NULL,

    CONSTRAINT "ItemAddonGroup_pkey" PRIMARY KEY ("itemId","addonGroupId")
);

-- CreateIndex
CREATE INDEX "ItemVariant_itemId_idx" ON "ItemVariant"("itemId");

-- CreateIndex
CREATE INDEX "AddonGroup_shopId_idx" ON "AddonGroup"("shopId");

-- CreateIndex
CREATE INDEX "Addon_addonGroupId_idx" ON "Addon"("addonGroupId");

-- CreateIndex
CREATE INDEX "ItemAddonGroup_addonGroupId_idx" ON "ItemAddonGroup"("addonGroupId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_itemId_idx" ON "OrderItem"("itemId");

-- AddForeignKey
ALTER TABLE "ItemVariant" ADD CONSTRAINT "ItemVariant_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonGroup" ADD CONSTRAINT "AddonGroup_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_addonGroupId_fkey" FOREIGN KEY ("addonGroupId") REFERENCES "AddonGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAddonGroup" ADD CONSTRAINT "ItemAddonGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAddonGroup" ADD CONSTRAINT "ItemAddonGroup_addonGroupId_fkey" FOREIGN KEY ("addonGroupId") REFERENCES "AddonGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
