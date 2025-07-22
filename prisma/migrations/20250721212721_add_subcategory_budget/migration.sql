-- CreateTable
CREATE TABLE "SubcategoryBudget" (
    "id" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "divisionBudgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubcategoryBudget_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubcategoryBudget" ADD CONSTRAINT "SubcategoryBudget_divisionBudgetId_fkey" FOREIGN KEY ("divisionBudgetId") REFERENCES "DivisionBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
