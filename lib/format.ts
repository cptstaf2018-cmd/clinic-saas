/** Prices and quantities in Western digits with thousands separators (39,000), as Iraqi pharmacies print them. */
export function money(value: number): string {
  return value.toLocaleString("en-US");
}

/** Date and time in Arabic words with Western digits: "21 تشرين الأول 2026، 08:00 م". */
export function dateTime(value: Date | string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }): string {
  return new Date(value).toLocaleString("ar-IQ-u-nu-latn", { timeZone: "Asia/Baghdad", ...options });
}
