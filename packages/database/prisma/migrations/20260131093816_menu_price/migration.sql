/*
  Warnings:

  - You are about to alter the column `price` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
CREATE SEQUENCE category_orderindex_seq;
ALTER TABLE "Category" ALTER COLUMN "orderIndex" SET DEFAULT nextval('category_orderindex_seq');
ALTER SEQUENCE category_orderindex_seq OWNED BY "Category"."orderIndex";

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "price" SET DATA TYPE INTEGER;
