
-- AlterTable
ALTER TABLE "PharmacyProduct" ADD COLUMN     "imagePath" TEXT;

-- AlterTable
ALTER TABLE "PharmacySale" ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LabTest" ADD COLUMN     "imagePath" TEXT;

