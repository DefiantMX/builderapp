-- First add the column with a default value
ALTER TABLE "Bid" ADD COLUMN "division" TEXT NOT NULL DEFAULT '01';

-- Then remove the default value
ALTER TABLE "Bid" ALTER COLUMN "division" DROP DEFAULT; 