CREATE TABLE IF NOT EXISTS "clinic_settings" (
  "clinic_id" TEXT NOT NULL,
  "specialty_code" TEXT NOT NULL,
  "setup_completed" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("clinic_id"),
  CONSTRAINT "clinic_settings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "clinic_settings" ("clinic_id", "specialty_code", "setup_completed", "updated_at")
SELECT
  "id",
  COALESCE("specialty", 'internal_medicine'),
  NOT "specialtyOnboardingRequired",
  CURRENT_TIMESTAMP
FROM "Clinic"
ON CONFLICT ("clinic_id") DO UPDATE SET
  "specialty_code" = EXCLUDED."specialty_code",
  "setup_completed" = EXCLUDED."setup_completed",
  "updated_at" = CURRENT_TIMESTAMP;

ALTER TABLE "MedicalRecord"
  ADD COLUMN IF NOT EXISTS "specialtyCode" TEXT,
  ADD COLUMN IF NOT EXISTS "contentJson" JSONB;
