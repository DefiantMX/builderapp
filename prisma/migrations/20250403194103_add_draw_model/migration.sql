-- DropIndex
DROP INDEX "DivisionBudget_budgetId_division_key";

-- AlterTable
ALTER TABLE "DivisionBudget" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "drawNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DrawInvoices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DrawInvoices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Draw_projectId_idx" ON "Draw"("projectId");

-- CreateIndex
CREATE INDEX "_DrawInvoices_B_index" ON "_DrawInvoices"("B");

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DrawInvoices" ADD CONSTRAINT "_DrawInvoices_A_fkey" FOREIGN KEY ("A") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DrawInvoices" ADD CONSTRAINT "_DrawInvoices_B_fkey" FOREIGN KEY ("B") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
