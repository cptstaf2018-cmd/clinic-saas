export type Sex = "m" | "f";

export type RefRanges = {
  refLowM: number | null;
  refHighM: number | null;
  refLowF: number | null;
  refHighF: number | null;
  critLow: number | null;
  critHigh: number | null;
};

export type Flag = "normal" | "low" | "high" | "critical_low" | "critical_high" | "none";

export const FLAG_LABEL: Record<Flag, string> = {
  normal: "طبيعي",
  low: "منخفض",
  high: "مرتفع",
  critical_low: "منخفض جداً",
  critical_high: "مرتفع جداً",
  none: "—",
};

const MAX_RESULT = 100_000_000;

export function rangeFor(ranges: RefRanges, sex: Sex) {
  return sex === "f"
    ? { low: ranges.refLowF, high: ranges.refHighF }
    : { low: ranges.refLowM, high: ranges.refHighM };
}

/** Critical limits are inclusive: a value equal to the limit is already critical. */
export function classifyResult(value: number, ranges: RefRanges, sex: Sex): Flag {
  if (ranges.critLow !== null && value <= ranges.critLow) return "critical_low";
  if (ranges.critHigh !== null && value >= ranges.critHigh) return "critical_high";
  const { low, high } = rangeFor(ranges, sex);
  if (low === null && high === null) return "none";
  if (low !== null && value < low) return "low";
  if (high !== null && value > high) return "high";
  return "normal";
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Accepts "5.4", "5,4", "٥٫٤" and Arabic-Indic digits; rejects anything else. */
export function parseResultInput(raw: unknown): { ok: true; value: number } | { ok: false; error: string } {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 && raw < MAX_RESULT ? { ok: true, value: raw } : { ok: false, error: "قيمة غير صحيحة" };
  }
  if (typeof raw !== "string") return { ok: false, error: "القيمة مطلوبة" };
  const normalized = raw
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[٫,]/g, ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return { ok: false, error: "اكتب رقماً صحيحاً" };
  const value = Number(normalized);
  return value < MAX_RESULT ? { ok: true, value } : { ok: false, error: "القيمة كبيرة جداً" };
}

export function summarizeFlags(flags: Flag[]) {
  return {
    normal: flags.filter((flag) => flag === "normal").length,
    abnormal: flags.filter((flag) => flag === "low" || flag === "high" || flag === "critical_low" || flag === "critical_high").length,
    critical: flags.filter((flag) => flag === "critical_low" || flag === "critical_high").length,
  };
}

export function orderTotal(items: { price: number }[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export type MessageItem = { name: string; value: number; unit: string | null; flag: Flag };

/**
 * The text the patient gets on WhatsApp. It states values and whether they fall
 * inside the lab's range, and always sends interpretation back to the doctor.
 */
export function buildResultMessage(input: { labName: string; patientName: string; items: MessageItem[]; link: string }) {
  const lines = input.items.map((item) => {
    const unit = item.unit ? ` ${item.unit}` : "";
    const mark = item.flag === "normal" ? "✅" : item.flag === "none" ? "▫️" : "⚠️";
    return `${mark} ${item.name}: ${item.value}${unit} (${FLAG_LABEL[item.flag]})`;
  });
  const { abnormal, critical } = summarizeFlags(input.items.map((item) => item.flag));
  const notes = [
    critical > 0 ? "⚠️ بعض القيم بعيدة عن الطبيعي كثيراً، راجع طبيبك فوراً." : abnormal > 0 ? "بعض القيم خارج النطاق الطبيعي، راجع طبيبك لتفسيرها." : "",
    "التفسير الطبي للنتيجة من اختصاص طبيبك.",
  ].filter(Boolean);

  return [
    `مرحباً ${input.patientName}،`,
    `نتيجة تحليلك من ${input.labName} جاهزة ✓`,
    "",
    ...lines,
    "",
    ...notes,
    "",
    `النتيجة الكاملة والمطبوعة:\n${input.link}`,
  ].join("\n");
}

export type BarInput = { low: number | null; high: number | null; critLow: number | null; critHigh: number | null; value: number };
export type Bar = { marker: number; normalFrom: number; normalTo: number; critFrom: number | null; critTo: number | null };

/**
 * Positions (0-100, left to right) for the range bar: where the value sits, the
 * normal zone, and the band between the critical limits. The scale is built from
 * the limits themselves so every test gets a readable bar.
 */
export function barGeometry({ low, high, critLow, critHigh, value }: BarInput): Bar {
  // The scale comes from the limits only, so an extreme value is pinned to the edge
  // instead of squeezing the normal zone. With no limits at all, the value sets the scale.
  const limits = [low, high, critLow, critHigh].filter((n): n is number => n !== null);
  const anchors = limits.length > 0 ? limits : [value];
  const lo = Math.min(...anchors);
  const hi = Math.max(...anchors);
  const span = hi - lo || Math.max(Math.abs(hi), 1);
  const min = Math.max(0, lo - span * 0.12);
  const max = hi + span * 0.12;
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  return {
    marker: pos(value),
    normalFrom: low === null ? 0 : pos(low),
    normalTo: high === null ? 100 : pos(high),
    critFrom: critLow === null ? null : pos(critLow),
    critTo: critHigh === null ? null : pos(critHigh),
  };
}
