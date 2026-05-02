-- AlterTable: Order — vendedor que criou o pedido (usado como SALES REP no invoice)
ALTER TABLE "Order" ADD COLUMN "createdById" INTEGER;

-- ForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: usa updatedById como aproximação histórica do criador.
UPDATE "Order" SET "createdById" = "updatedById" WHERE "createdById" IS NULL AND "updatedById" IS NOT NULL;

CREATE INDEX "Order_createdById_idx" ON "Order"("createdById");
