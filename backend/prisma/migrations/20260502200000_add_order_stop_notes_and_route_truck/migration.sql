-- AlterTable: Order — observação por parada (preenchida pelo admin na rota)
ALTER TABLE "Order" ADD COLUMN "stopNotes" TEXT NOT NULL DEFAULT '';

-- AlterTable: Route — identificação manual do caminhão (truck)
ALTER TABLE "Route" ADD COLUMN "truck" TEXT NOT NULL DEFAULT '';
