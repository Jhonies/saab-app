-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "visibleTo" TEXT[] DEFAULT ARRAY[]::TEXT[];
