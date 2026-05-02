-- AlterTable: Order — manual stop order within a route (admin defines sequence)
ALTER TABLE "Order" ADD COLUMN "stopOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Order_routeId_stopOrder_idx" ON "Order"("routeId", "stopOrder");
