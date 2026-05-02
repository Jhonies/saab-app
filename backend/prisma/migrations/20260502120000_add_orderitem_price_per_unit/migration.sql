-- AlterTable: OrderItem — add pricePerUnit column to support PER_UNIT pricing
ALTER TABLE "OrderItem" ADD COLUMN "pricePerUnit" DECIMAL(10, 2);
