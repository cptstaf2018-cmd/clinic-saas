import Image from "next/image";

export const BRAND_NAME = "الذهبي";

type Tone = "dark" | "light";

/** The gold crescent alone, transparent so it sits on navy or white. */
export function BrandMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/crescent.png"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
      priority
    />
  );
}

/**
 * Crescent with the name written under it, nothing else.
 * `tone="dark"` is for navy backgrounds (white name), `tone="light"` for white ones (navy name).
 * `stacked` puts the name under the mark; otherwise it sits beside it for tight headers.
 */
export default function BrandLogo({
  tone = "dark",
  size = 48,
  stacked = true,
  className = "",
}: {
  tone?: Tone;
  size?: number;
  stacked?: boolean;
  className?: string;
}) {
  const color = tone === "dark" ? "text-white" : "text-brand-navy";
  const text = Math.max(13, Math.round(size * (stacked ? 0.36 : 0.4)));
  return (
    <div className={`inline-flex items-center ${stacked ? "flex-col gap-1.5 text-center" : "flex-row gap-3"} ${className}`}>
      <BrandMark size={size} />
      <span className={`whitespace-nowrap font-bold leading-none tracking-tight ${color}`} style={{ fontSize: text }}>
        {BRAND_NAME}
      </span>
    </div>
  );
}
