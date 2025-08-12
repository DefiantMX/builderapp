-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "calibrationUnit" TEXT,
ADD COLUMN     "pixelDistance" DOUBLE PRECISION,
ADD COLUMN     "realDistance" DOUBLE PRECISION,
ADD COLUMN     "scale" DOUBLE PRECISION;
