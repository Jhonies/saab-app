-- CreateEnum
CREATE TYPE "ContainerZone" AS ENUM ('CAMARA_FRIA', 'CAMARA_FRIA_FORA', 'CONTAINERS', 'SECOS', 'OPEN_BOX');

-- CreateEnum
CREATE TYPE "SecosSubZone" AS ENUM ('NASSIF', 'SAAB', 'BEBIDAS');

-- AlterTable
ALTER TABLE "Container" ADD COLUMN     "subZone" "SecosSubZone",
ADD COLUMN     "zone" "ContainerZone" NOT NULL DEFAULT 'CONTAINERS';
