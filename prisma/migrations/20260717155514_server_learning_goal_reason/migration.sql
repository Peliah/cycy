/*
  Warnings:

  - You are about to drop the column `learningGoal` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `learningReason` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "learningGoal",
DROP COLUMN "learningReason";

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "learningGoal" TEXT,
ADD COLUMN     "learningReason" TEXT;
