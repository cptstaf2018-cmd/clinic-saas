export const MEDICAL_SPECIALTIES = [
  {
    key: "dentistry",
    name: "أسنان",
    description: "قوالب للأسنان، اللثة، الأشعة، وخطة العلاج.",
    icon: "سن",
  },
  {
    key: "gynecology",
    name: "نسائية",
    description: "قوالب للحمل، الدورة، السونار، والمتابعة.",
    icon: "ن",
  },
  {
    key: "pediatrics",
    name: "أطفال",
    description: "قوالب للوزن، الطول، الحرارة، والتطعيمات.",
    icon: "ط",
  },
  {
    key: "dermatology",
    name: "جلدية",
    description: "قوالب للصور، مكان الإصابة، الحكة، والمتابعة.",
    icon: "ج",
  },
  {
    key: "cardiology",
    name: "قلب",
    description: "قوالب للضغط، النبض، ECG، والإيكو.",
    icon: "ق",
  },
  {
    key: "ophthalmology",
    name: "عيون",
    description: "قوالب للنظر، الضغط، الفحص، والوصفات.",
    icon: "ع",
  },
  {
    key: "orthopedics",
    name: "عظام",
    description: "قوالب للألم، الحركة، الأشعة، والإجراءات.",
    icon: "ظم",
  },
  {
    key: "internal_medicine",
    name: "باطنية",
    description: "قوالب للأعراض العامة، الأمراض المزمنة، والتحاليل.",
    icon: "+",
  },
] as const;

export type MedicalSpecialtyKey = (typeof MEDICAL_SPECIALTIES)[number]["key"];

export function isMedicalSpecialty(value: string): value is MedicalSpecialtyKey {
  return MEDICAL_SPECIALTIES.some((specialty) => specialty.key === value);
}
