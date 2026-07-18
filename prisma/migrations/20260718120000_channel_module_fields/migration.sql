-- AlterTable
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "externalModuleId" TEXT;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "moduleStatus" "ModuleProgressStatus";
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "moduleOrder" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Channel_serverId_externalModuleId_key" ON "Channel"("serverId", "externalModuleId");
