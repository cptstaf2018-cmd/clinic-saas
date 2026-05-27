function toEnglishDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function normalizeIraqMobile(raw: string): string {
  let digits = toEnglishDigits(raw).replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("9640")) return `0${digits.slice(4)}`;
  if (digits.startsWith("964")) return `0${digits.slice(3)}`;
  if (digits.startsWith("7") && digits.length === 10) return `0${digits}`;

  return digits;
}

export function iraqMobileVariants(raw: string): string[] {
  const trimmed = raw.trim();
  const digits = toEnglishDigits(trimmed).replace(/\D/g, "");
  const normalized = normalizeIraqMobile(raw);
  const variants = new Set<string>();

  if (trimmed) variants.add(trimmed);
  if (digits) variants.add(digits);
  if (normalized) {
    variants.add(normalized);
    if (normalized.startsWith("0")) {
      const withoutZero = normalized.slice(1);
      variants.add(`964${withoutZero}`);
      variants.add(`+964${withoutZero}`);
      variants.add(withoutZero);
    }
  }

  return [...variants];
}
