/*
  Warnings:

  - You are about to drop the column `fileType` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileType";

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");
