import { barGeometry } from "@/lib/lab/result";

/**
 * The lab signature: every result is a marker on a bar. Red outside the critical
 * limits, amber between critical and normal, mint inside the normal range.
 */
export default function RangeBar({
  value,
  low,
  high,
  critLow,
  critHigh,
  className = "",
}: {
  value: number | null;
  low: number | null;
  high: number | null;
  critLow: number | null;
  critHigh: number | null;
  className?: string;
}) {
  if (low === null && high === null && critLow === null && critHigh === null) return null;
  const bar = barGeometry({ low, high, critLow, critHigh, value: value ?? low ?? high ?? 0 });
  const amberFrom = bar.critFrom ?? 0;
  const amberTo = bar.critTo ?? 100;

  return (
    <div dir="ltr" className={`relative h-2.5 rounded-full bg-[#F6C8C9] ${className}`} aria-hidden>
      <span className="absolute inset-y-0 bg-[#FBE3B6]" style={{ left: `${amberFrom}%`, width: `${amberTo - amberFrom}%` }} />
      <span className="absolute inset-y-0 rounded-full bg-[#7ED9B9]" style={{ left: `${bar.normalFrom}%`, width: `${Math.max(bar.normalTo - bar.normalFrom, 1)}%` }} />
      {value !== null && (
        <span
          className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-brand-navy shadow-[0_2px_6px_rgba(14,36,64,0.45)] transition-[left] duration-500"
          style={{ left: `${bar.marker}%` }}
        />
      )}
    </div>
  );
}
