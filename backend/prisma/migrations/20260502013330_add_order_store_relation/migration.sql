-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "storeId" INTEGER;

-- CreateIndex
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
