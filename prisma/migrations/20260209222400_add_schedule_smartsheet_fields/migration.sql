-- AlterTable
ALTER TABLE "Event" ADD COLUMN "assignee" TEXT;
ALTER TABLE "Event" ADD COLUMN "parentId" TEXT;
ALTER TABLE "Event" ADD COLUMN "predecessorIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Event_parentId_idx" ON "Event"("parentId");
