-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'PARTIAL');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID';
