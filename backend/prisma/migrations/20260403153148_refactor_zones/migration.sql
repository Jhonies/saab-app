/*
  Warnings:

  - The values [CAMARA_FRIA_FORA,CONTAINERS,OPEN_BOX] on the enum `ContainerZone` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `subZone` on the `Container` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContainerZone_new" AS ENUM ('CAMARA_FRIA', 'CONTAINER_31', 'CONTAINER_32', 'CONTAINER_33', 'CONTAINER_36', 'BEBIDAS', 'SECOS');
ALTER TABLE "Container" ALTER COLUMN "zone" DROP DEFAULT;
ALTER TABLE "Container" ALTER COLUMN "zone" TYPE "ContainerZone_new" USING ("zone"::text::"ContainerZone_new");
ALTER TYPE "ContainerZone" RENAME TO "ContainerZone_old";
ALTER TYPE "ContainerZone_new" RENAME TO "ContainerZone";
DROP TYPE "ContainerZone_old";
ALTER TABLE "Container" ALTER COLUMN "zone" SET DEFAULT 'SECOS';
COMMIT;

-- AlterTable
ALTER TABLE "Container" DROP COLUMN "subZone",
ALTER COLUMN "zone" SET DEFAULT 'SECOS';

-- DropEnum
DROP TYPE "SecosSubZone";
