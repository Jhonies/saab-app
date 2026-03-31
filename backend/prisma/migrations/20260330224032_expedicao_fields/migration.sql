-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "loadedAt" TIMESTAMP(3),
ADD COLUMN     "packedAt" TIMESTAMP(3),
ADD COLUMN     "packedById" INTEGER,
ADD COLUMN     "separatedAt" TIMESTAMP(3),
ADD COLUMN     "separatedById" INTEGER;
