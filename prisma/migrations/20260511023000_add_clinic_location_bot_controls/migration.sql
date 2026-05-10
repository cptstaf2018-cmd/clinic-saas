ALTER TABLE "Clinic"
ADD COLUMN "address" TEXT,
ADD COLUMN "locationUrl" TEXT,
ADD COLUMN "botOutOfScopeMessage" TEXT,
ADD COLUMN "botMedicalDisclaimer" TEXT,
ADD COLUMN "botHandoffMessage" TEXT,
ADD COLUMN "botShowWorkingHours" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "botShowLocation" BOOLEAN NOT NULL DEFAULT false;
