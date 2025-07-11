/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "permissions" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_inviteToken_key" ON "TeamMember"("inviteToken");
