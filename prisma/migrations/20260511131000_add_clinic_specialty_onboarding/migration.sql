ALTER TABLE "Clinic"
ADD COLUMN "specialty" TEXT,
ADD COLUMN "specialtyOnboardingRequired" BOOLEAN NOT NULL DEFAULT false;
