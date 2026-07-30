-- CreateEnum
CREATE TYPE "BootstrapPhase" AS ENUM ('INGESTING', 'PLANNING', 'PERSISTING');

-- AlterTable
ALTER TABLE "Curriculum" ADD COLUMN "bootstrapPhase" "BootstrapPhase";
