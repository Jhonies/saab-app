-- AlterTable: Order — rename weightKg to weightLb, drop signature
ALTER TABLE "Order" RENAME COLUMN "weightKg" TO "weightLb";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "signature";

-- AlterTable: OrderItem — rename weightKg to weightLb, add pricing fields
ALTER TABLE "OrderItem" RENAME COLUMN "weightKg" TO "weightLb";
ALTER TABLE "OrderItem" ADD COLUMN "priceType" TEXT NOT NULL DEFAULT 'PER_LB';
ALTER TABLE "OrderItem" ADD COLUMN "pricePerLb" DOUBLE PRECISION;
ALTER TABLE "OrderItem" ADD COLUMN "pricePerBox" DOUBLE PRECISION;

-- AlterTable: Product — drop pricePerBox
ALTER TABLE "Product" DROP COLUMN IF EXISTS "pricePerBox";

-- CreateTable: BoxWeight
CREATE TABLE "BoxWeight" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "boxNumber" INTEGER NOT NULL,
    "weightLb" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BoxWeight_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BoxWeight" ADD CONSTRAINT "BoxWeight_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
