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

const MIN_NAME = 2;
const MAX_NAME = 80;

/** The first thing a new account does: say what it is and what it is called. */
export function parseFacilityChoice(
  body: unknown
): { ok: true; value: { facilityType: FacilityTypeKey; name: string } } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "طلب غير صحيح" };
  const { facilityType, name } = body as { facilityType?: unknown; name?: unknown };
  if (!isFacilityType(facilityType)) return { ok: false, error: "يرجى اختيار نوع المنشأة" };
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < MIN_NAME || trimmed.length > MAX_NAME) return { ok: false, error: "اكتب اسم المنشأة (من حرفين إلى 80 حرفاً)" };
  return { ok: true, value: { facilityType, name: trimmed } };
}
