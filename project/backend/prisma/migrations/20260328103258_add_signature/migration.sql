-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveredAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "deliveredById" INTEGER;
ALTER TABLE "Order" ADD COLUMN "signature" TEXT;
