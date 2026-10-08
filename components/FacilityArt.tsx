/**
 * Illustrations for the three facility types. Drawn in SVG with gradients and
 * highlights so they read as glossy 3D objects in the navy + gold identity.
 * Gradient ids are prefixed per illustration because ids are global to the page.
 */

function Defs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <linearGradient id={`${prefix}-gold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FBE3A0" />
        <stop offset="0.45" stopColor="#E4B04A" />
        <stop offset="1" stopColor="#B87F1E" />
      </linearGradient>
      <linearGradient id={`${prefix}-navy`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2A4B78" />
        <stop offset="1" stopColor="#0E2440" />
      </linearGradient>
      <linearGradient id={`${prefix}-white`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#D5E1F3" />
      </linearGradient>
      <linearGradient id={`${prefix}-glass`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
        <stop offset="0.5" stopColor="#E6EEFA" stopOpacity="0.55" />
        <stop offset="1" stopColor="#B9CBE6" stopOpacity="0.75" />
      </linearGradient>
      <radialGradient id={`${prefix}-shadow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#0E2440" stopOpacity="0.28" />
        <stop offset="1" stopColor="#0E2440" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

export function ClinicArt() {
  const p = "clinic";
  return (
    <svg viewBox="0 0 220 170" className="h-full w-full" aria-hidden>
      <Defs prefix={p} />
      <ellipse cx="110" cy="150" rx="86" ry="12" fill={`url(#${p}-shadow)`} />
      {/* building */}
      <rect x="48" y="66" width="124" height="82" rx="9" fill={`url(#${p}-white)`} />
      <rect x="150" y="66" width="22" height="82" rx="9" fill="#9FB3CD" opacity="0.35" />
      <rect x="40" y="56" width="140" height="16" rx="8" fill={`url(#${p}-navy)`} />
      <rect x="46" y="58" width="128" height="4" rx="2" fill="#FFFFFF" opacity="0.18" />
      {/* windows */}
      {[62, 130].map((x) =>
        [82, 108].map((y) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="26" height="18" rx="4" fill="#BBD0EE" />
            <rect x={x} y={y} width="26" height="18" rx="4" fill={`url(#${p}-glass)`} />
            <path d={`M${x + 3} ${y + 3}h10`} stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          </g>
        ))
      )}
      {/* door */}
      <path d="M94 148V118a16 16 0 0 1 32 0v30z" fill={`url(#${p}-navy)`} />
      <path d="M100 148v-30a10 10 0 0 1 10-10" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.25" />
      <circle cx="120" cy="132" r="2" fill={`url(#${p}-gold)`} />
      {/* medical sign */}
      <circle cx="110" cy="34" r="26" fill={`url(#${p}-gold)`} />
      <circle cx="110" cy="34" r="26" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
      <path d="M102 34h16M110 26v16" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <path d="M94 24a22 22 0 0 1 22-11" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

export function LabArt() {
  const p = "lab";
  return (
    <svg viewBox="0 0 220 170" className="h-full w-full" aria-hidden>
      <Defs prefix={p} />
      <linearGradient id={`${p}-liquid`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F4CB6B" />
        <stop offset="1" stopColor="#CF9528" />
      </linearGradient>
      <linearGradient id={`${p}-blue`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5C8FE6" />
        <stop offset="1" stopColor="#1F5FD1" />
      </linearGradient>
      <linearGradient id={`${p}-teal`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8BE8CB" />
        <stop offset="1" stopColor="#2EAE8A" />
      </linearGradient>
      <ellipse cx="110" cy="152" rx="90" ry="11" fill={`url(#${p}-shadow)`} />
      {/* flask */}
      <path d="M62 22h34v32l30 62a12 12 0 0 1-11 17H43a12 12 0 0 1-11-17l30-62z" fill={`url(#${p}-glass)`} stroke="#9FB3CD" strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 92h58l20 41a8 8 0 0 1-7.2 11.5H37.2A8 8 0 0 1 30 133z" fill={`url(#${p}-liquid)`} />
      <path d="M50 92h58" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="62" cy="120" r="5" fill="#fff" opacity="0.55" />
      <circle cx="82" cy="108" r="3.5" fill="#fff" opacity="0.5" />
      <circle cx="76" cy="132" r="4" fill="#fff" opacity="0.45" />
      <rect x="58" y="18" width="42" height="9" rx="4.5" fill={`url(#${p}-navy)`} />
      <path d="M70 36v22" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      {/* tube rack */}
      <rect x="128" y="112" width="74" height="26" rx="7" fill={`url(#${p}-navy)`} />
      <rect x="132" y="115" width="66" height="4" rx="2" fill="#fff" opacity="0.18" />
      {[
        { x: 140, fill: `url(#${p}-liquid)`, h: 34 },
        { x: 163, fill: `url(#${p}-blue)`, h: 44 },
        { x: 186, fill: `url(#${p}-teal)`, h: 28 },
      ].map((tube) => (
        <g key={tube.x}>
          <path d={`M${tube.x - 8} 54h16v66a8 8 0 0 1-16 0z`} fill={`url(#${p}-glass)`} stroke="#9FB3CD" strokeWidth="1.8" />
          <path d={`M${tube.x - 8} ${126 - tube.h}h16v${tube.h - 6}a8 8 0 0 1-16 0z`} fill={tube.fill} />
          <path d={`M${tube.x - 4} 60v50`} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <rect x={tube.x - 9} y="50" width="18" height="7" rx="3.5" fill={`url(#${p}-gold)`} />
        </g>
      ))}
      {/* sparkle */}
      <path d="M180 22l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill={`url(#${p}-gold)`} />
    </svg>
  );
}

export function PharmacyArt() {
  const p = "ph";
  return (
    <svg viewBox="0 0 220 170" className="h-full w-full" aria-hidden>
      <Defs prefix={p} />
      <linearGradient id={`${p}-amber`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#F2C25A" />
        <stop offset="0.55" stopColor="#D9982B" />
        <stop offset="1" stopColor="#A56F14" />
      </linearGradient>
      <ellipse cx="110" cy="152" rx="92" ry="11" fill={`url(#${p}-shadow)`} />
      {/* bottle */}
      <rect x="58" y="22" width="68" height="26" rx="9" fill={`url(#${p}-navy)`} />
      <path d="M66 28h6M80 28h6M94 28h6M108 28h6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.18" />
      <path d="M62 46h60v8a10 10 0 0 1 8 10v70a14 14 0 0 1-14 14H68a14 14 0 0 1-14-14V64a10 10 0 0 1 8-10z" fill={`url(#${p}-amber)`} />
      <path d="M62 46h60v8a10 10 0 0 1 8 10v70a14 14 0 0 1-14 14H68" fill="none" />
      <rect x="66" y="74" width="52" height="46" rx="7" fill="#FFFFFF" />
      <path d="M92 84v26M79 97h26" stroke="#E4B04A" strokeWidth="8" strokeLinecap="round" />
      <path d="M62 62v70" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      {/* capsules */}
      <g transform="rotate(-24 160 118)">
        <rect x="126" y="104" width="68" height="28" rx="14" fill={`url(#${p}-white)`} />
        <path d="M160 104h26a14 14 0 0 1 0 28h-26z" fill={`url(#${p}-navy)`} />
        <rect x="134" y="108" width="40" height="5" rx="2.5" fill="#fff" opacity="0.8" />
      </g>
      <g transform="rotate(18 168 66)">
        <rect x="140" y="54" width="56" height="24" rx="12" fill={`url(#${p}-gold)`} />
        <path d="M168 54h16a12 12 0 0 1 0 24h-16z" fill="#fff" opacity="0.92" />
        <rect x="146" y="58" width="30" height="4" rx="2" fill="#fff" opacity="0.7" />
      </g>
      {/* tablets */}
      <circle cx="198" cy="146" r="11" fill={`url(#${p}-white)`} />
      <path d="M190 146h16" stroke="#9FB3CD" strokeWidth="2" strokeLinecap="round" />
      <circle cx="150" cy="146" r="9" fill={`url(#${p}-gold)`} />
      <path d="M144 143a7 7 0 0 1 8-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}

export function FacilityArt({ type }: { type: "clinic" | "lab" | "pharmacy" }) {
  return type === "lab" ? <LabArt /> : type === "pharmacy" ? <PharmacyArt /> : <ClinicArt />;
}
