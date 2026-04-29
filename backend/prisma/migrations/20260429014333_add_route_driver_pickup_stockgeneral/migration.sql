-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryType" TEXT NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "driverId" INTEGER,
ADD COLUMN     "route" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stockGeneral" INTEGER NOT NULL DEFAULT 0;

-- Backfill: stockGeneral = soma das quantities dos containers de cada produto
UPDATE "Product" p
SET "stockGeneral" = COALESCE(sub.total, 0)
FROM (
  SELECT "productId", SUM("quantity") AS total
  FROM "Container"
  WHERE "productId" IS NOT NULL
  GROUP BY "productId"
) sub
WHERE p."id" = sub."productId";

-- CreateIndex
CREATE INDEX "Order_driverId_idx" ON "Order"("driverId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
