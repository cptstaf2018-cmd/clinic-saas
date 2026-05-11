CREATE TABLE "ClinicFeatureTrial" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicFeatureTrial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClinicFeatureTrial_clinicId_feature_key" ON "ClinicFeatureTrial"("clinicId", "feature");
CREATE INDEX "ClinicFeatureTrial_clinicId_idx" ON "ClinicFeatureTrial"("clinicId");
CREATE INDEX "ClinicFeatureTrial_feature_idx" ON "ClinicFeatureTrial"("feature");

ALTER TABLE "ClinicFeatureTrial" ADD CONSTRAINT "ClinicFeatureTrial_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
