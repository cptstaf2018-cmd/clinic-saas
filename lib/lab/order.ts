export const ORDER_STATUSES = ["new", "in_progress", "review", "done", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "طلب جديد",
  in_progress: "قيد العمل",
  review: "بانتظار الاعتماد",
  done: "صدرت",
  cancelled: "ملغى",
};

export const TEST_CATEGORIES = ["دم", "كيمياء حيوية", "هرمونات", "فيتامينات", "بول وبراز", "مناعة", "أخرى"] as const;

const FORWARD: Record<string, OrderStatus> = { new: "in_progress", in_progress: "review", review: "done" };
const OPEN = new Set(["new", "in_progress", "review"]);

const MAX_TESTS_PER_ORDER = 60;
const MAX_MONEY = 100_000_000;
const MAX_REF = 1_000_000;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function canTransition(from: string, to: string): boolean {
  if (!(ORDER_STATUSES as readonly string[]).includes(to)) return false;
  if (to === "cancelled") return OPEN.has(from);
  return FORWARD[from] === to;
}

export function allResultsEntered(items: { result: number | null }[]): boolean {
  return items.length > 0 && items.every((item) => item.result !== null);
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function numberOrNull(value: unknown, min: number, max: number): number | null | "bad" {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "string" ? Number(value.trim().replace(/[٫,]/g, ".")) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max ? n : "bad";
}

export type OrderInput = {
  patientName: string;
  patientPhone: string | null;
  sex: "m" | "f";
  age: number | null;
  doctorName: string | null;
  urgent: boolean;
  notes: string | null;
  testIds: string[];
};

export function parseOrderInput(body: Record<string, unknown>): Result<OrderInput> {
  const patientName = text(body.patientName, 80);
  if (!patientName) return { ok: false, error: "اسم المراجع مطلوب" };
  if (body.sex !== "m" && body.sex !== "f") return { ok: false, error: "اختر الجنس" };

  const phoneRaw = text(body.patientPhone, 20);
  if (phoneRaw && !/^(\+?964|0)?7\d{8,9}$/.test(phoneRaw.replace(/\s|-/g, ""))) return { ok: false, error: "رقم الهاتف غير صحيح" };

  const age = numberOrNull(body.age, 0, 120);
  if (age === "bad" || (age !== null && !Number.isInteger(age))) return { ok: false, error: "العمر غير صحيح" };

  if (!Array.isArray(body.testIds)) return { ok: false, error: "اختر تحليلاً واحداً على الأقل" };
  const testIds = [...new Set(body.testIds.filter((id): id is string => typeof id === "string" && id.length > 0))];
  if (testIds.length === 0) return { ok: false, error: "اختر تحليلاً واحداً على الأقل" };
  if (testIds.length > MAX_TESTS_PER_ORDER) return { ok: false, error: "عدد التحاليل كبير جداً في طلب واحد" };

  return {
    ok: true,
    value: {
      patientName,
      patientPhone: phoneRaw ? phoneRaw.replace(/\s|-/g, "") : null,
      sex: body.sex,
      age,
      doctorName: text(body.doctorName, 80),
      urgent: body.urgent === true,
      notes: text(body.notes, 300),
      testIds,
    },
  };
}

export type TestInput = {
  name: string;
  nameEn: string | null;
  category: string;
  unit: string | null;
  price: number;
  refLowM: number | null;
  refHighM: number | null;
  refLowF: number | null;
  refHighF: number | null;
  critLow: number | null;
  critHigh: number | null;
};

const REF_FIELDS = ["refLowM", "refHighM", "refLowF", "refHighF", "critLow", "critHigh"] as const;

export function parseTestInput(body: Record<string, unknown>, partial = false): Result<Partial<TestInput>> {
  const out: Partial<TestInput> = {};
  const has = (key: string) => !partial || key in body;

  if (has("name")) {
    const name = text(body.name, 100);
    if (!name) return { ok: false, error: "اسم التحليل مطلوب" };
    out.name = name;
  }
  if (has("nameEn")) out.nameEn = text(body.nameEn, 100);
  if (has("unit")) out.unit = text(body.unit, 20);
  if (has("category")) {
    const category = text(body.category, 30) ?? "أخرى";
    if (!(TEST_CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: "التصنيف غير صحيح" };
    out.category = category;
  }
  if (has("price")) {
    const price = numberOrNull(body.price, 0, MAX_MONEY);
    if (price === "bad" || (price !== null && !Number.isInteger(price))) return { ok: false, error: "السعر غير صحيح" };
    out.price = price ?? 0;
  }
  for (const field of REF_FIELDS) {
    if (!has(field)) continue;
    const value = numberOrNull(body[field], 0, MAX_REF);
    if (value === "bad") return { ok: false, error: "قيمة مرجعية غير صحيحة" };
    out[field] = value;
  }

  const lowHigh: [number | null | undefined, number | null | undefined][] = [
    [out.refLowM, out.refHighM],
    [out.refLowF, out.refHighF],
    [out.critLow, out.critHigh],
  ];
  if (lowHigh.some(([low, high]) => typeof low === "number" && typeof high === "number" && low > high)) {
    return { ok: false, error: "الحد الأدنى يجب أن يكون أقل من الحد الأعلى" };
  }

  if (partial && Object.keys(out).length === 0) return { ok: false, error: "لا توجد تعديلات" };
  return { ok: true, value: out };
}
