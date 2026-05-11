import { db } from "@/lib/db";
import { getSpecialtyConfig, normalizeSpecialtyCode } from "@/src/config/specialties";

export async function getClinicSettings(clinicId: string) {
  const settings = await db.clinicSettings.findUnique({ where: { clinicId } });
  if (settings) return settings;

  const clinic = await db.clinic.findUnique({
    where: { id: clinicId },
    select: { specialty: true, specialtyOnboardingRequired: true },
  });

  return {
    clinicId,
    specialtyCode: normalizeSpecialtyCode(clinic?.specialty),
    setupCompleted: clinic ? !clinic.specialtyOnboardingRequired : true,
    updatedAt: new Date(),
  };
}

export async function getClinicSpecialtyConfig(clinicId: string) {
  const settings = await getClinicSettings(clinicId);
  return getSpecialtyConfig(settings.specialtyCode);
}
