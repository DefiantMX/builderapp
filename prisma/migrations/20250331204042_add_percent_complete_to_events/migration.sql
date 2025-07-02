-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "percentComplete" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Event_projectId_idx" ON "Event"("projectId");
