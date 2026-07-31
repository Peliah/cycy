-- CreateEnum
CREATE TYPE "CallTranscriptStatus" AS ENUM ('PENDING', 'RECORDING', 'TRANSCRIBING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "CallTranscript" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "channelId" TEXT,
    "roomName" TEXT NOT NULL,
    "profileId" TEXT,
    "egressId" TEXT,
    "recordingUrl" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "status" "CallTranscriptStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallTranscript_serverId_idx" ON "CallTranscript"("serverId");

-- CreateIndex
CREATE INDEX "CallTranscript_channelId_idx" ON "CallTranscript"("channelId");

-- CreateIndex
CREATE INDEX "CallTranscript_roomName_idx" ON "CallTranscript"("roomName");

-- AddForeignKey
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
