import { cardiologyConfig } from "./cardiology";
import { dentalConfig } from "./dental";
import { dermatologyConfig } from "./dermatology";
import { internalMedicineConfig } from "./internalMedicine";
import { obgynConfig } from "./obgyn";
import { ophthalmologyConfig } from "./ophthalmology";
import { orthopedicsConfig } from "./orthopedics";
import { pediatricsConfig } from "./pediatrics";
import { surgeryConfig } from "./surgery";
import type { SpecialtyConfig } from "./types";

export type { DashboardWidget, DocumentType, EncounterSection, SpecialtyConfig } from "./types";

export const SPECIALTY_CONFIGS: Record<string, SpecialtyConfig> = {
  [dentalConfig.code]: dentalConfig,
  [pediatricsConfig.code]: pediatricsConfig,
  [obgynConfig.code]: obgynConfig,
  [dermatologyConfig.code]: dermatologyConfig,
  [cardiologyConfig.code]: cardiologyConfig,
  [surgeryConfig.code]: surgeryConfig,
  [internalMedicineConfig.code]: internalMedicineConfig,
  [ophthalmologyConfig.code]: ophthalmologyConfig,
  [orthopedicsConfig.code]: orthopedicsConfig,
};

const SPECIALTY_ALIASES: Record<string, string> = {
  dental: "dentistry",
  dentistry: "dentistry",
  obgyn: "gynecology",
  gynecology: "gynecology",
  internalMedicine: "internal_medicine",
  internal_medicine: "internal_medicine",
};

export function normalizeSpecialtyCode(code: string | null | undefined) {
  if (!code) return internalMedicineConfig.code;
  return SPECIALTY_ALIASES[code] ?? code;
}

export function getSpecialtyConfig(code: string | null | undefined): SpecialtyConfig {
  const normalized = normalizeSpecialtyCode(code);
  return SPECIALTY_CONFIGS[normalized] ?? internalMedicineConfig;
}
