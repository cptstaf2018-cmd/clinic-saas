export const FACILITY_TYPES = [
  {
    key: "clinic",
    name: "عيادة",
    description: "مواعيد ومراجعون وسجلات طبية، مع كل الاختصاصات.",
    highlights: ["كل الاختصاصات الطبية", "حجز عبر واتساب", "شاشة انتظار بالصوت"],
  },
  {
    key: "lab",
    name: "مختبر",
    description: "تحاليل ونتائج ترسل للمراجع على واتساب.",
    highlights: ["كتالوج التحاليل والأسعار", "حجز موعد سحب العينة", "إرسال النتيجة للمراجع"],
  },
  {
    key: "pharmacy",
    name: "صيدلية",
    description: "أدوية وطلبات مراجعين وتوفر العلاجات.",
    highlights: ["قائمة الأدوية والأسعار", "طلبات واتساب ووصفات", "حالة الطلب والتوصيل"],
  },
] as const;

export type FacilityTypeKey = (typeof FACILITY_TYPES)[number]["key"];

export function isFacilityType(value: unknown): value is FacilityTypeKey {
  return FACILITY_TYPES.some((type) => type.key === value);
}
