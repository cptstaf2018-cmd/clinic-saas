CREATE TABLE IF NOT EXISTS "SpecialtyAnnotation" (
  "id"            TEXT NOT NULL,
  "clinicId"      TEXT NOT NULL,
  "patientId"     TEXT NOT NULL,
  "specialtyCode" TEXT NOT NULL,
  "regionId"      TEXT NOT NULL,
  "label"         TEXT NOT NULL,
  "color"         TEXT NOT NULL,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SpecialtyAnnotation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SpecialtyAnnotation_clinicId_fkey"  FOREIGN KEY ("clinicId")  REFERENCES "Clinic"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SpecialtyAnnotation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id")  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SpecialtyAnnotation_clinicId_patientId_specialtyCode_regionId_key"
    UNIQUE ("clinicId", "patientId", "specialtyCode", "regionId")
);

CREATE INDEX IF NOT EXISTS "SpecialtyAnnotation_clinicId_patientId_idx"
  ON "SpecialtyAnnotation"("clinicId", "patientId");
