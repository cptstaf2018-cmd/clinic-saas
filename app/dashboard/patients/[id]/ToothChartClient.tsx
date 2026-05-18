"use client";

import { useState } from "react";

const TREATMENTS = [
  { key: "filling",    label: "حشو",       color: "#f59e0b" },
  { key: "extraction", label: "خلع",        color: "#ef4444" },
  { key: "rootCanal",  label: "علاج عصب",  color: "#8b5cf6" },
  { key: "crown",      label: "تلبيس",      color: "#3b82f6" },
  { key: "cleaning",   label: "تنظيف جير", color: "#10b981" },
  { key: "implant",    label: "زراعة",      color: "#f97316" },
  { key: "other",      label: "أخرى",       color: "#6b7280" },
];

type ToothType = "molar" | "premolar" | "canine" | "incisor";

// تعريف كل سن: رقم، نوع، موضع x
const UPPER: { num: number; type: ToothType; x: number }[] = [
  { num: 18, type: "molar",    x: 8   },
  { num: 17, type: "molar",    x: 62  },
  { num: 16, type: "molar",    x: 116 },
  { num: 15, type: "premolar", x: 170 },
  { num: 14, type: "premolar", x: 210 },
  { num: 13, type: "canine",   x: 248 },
  { num: 12, type: "incisor",  x: 280 },
  { num: 11, type: "incisor",  x: 310 },
  { num: 21, type: "incisor",  x: 348 },
  { num: 22, type: "incisor",  x: 378 },
  { num: 23, type: "canine",   x: 410 },
  { num: 24, type: "premolar", x: 448 },
  { num: 25, type: "premolar", x: 488 },
  { num: 26, type: "molar",    x: 542 },
  { num: 27, type: "molar",    x: 596 },
  { num: 28, type: "molar",    x: 650 },
];

const LOWER: { num: number; type: ToothType; x: number }[] = [
  { num: 48, type: "molar",    x: 8   },
  { num: 47, type: "molar",    x: 62  },
  { num: 46, type: "molar",    x: 116 },
  { num: 45, type: "premolar", x: 170 },
  { num: 44, type: "premolar", x: 210 },
  { num: 43, type: "canine",   x: 248 },
  { num: 42, type: "incisor",  x: 280 },
  { num: 41, type: "incisor",  x: 310 },
  { num: 31, type: "incisor",  x: 348 },
  { num: 32, type: "incisor",  x: 378 },
  { num: 33, type: "canine",   x: 410 },
  { num: 34, type: "premolar", x: 448 },
  { num: 35, type: "premolar", x: 488 },
  { num: 36, type: "molar",    x: 542 },
  { num: 37, type: "molar",    x: 596 },
  { num: 38, type: "molar",    x: 650 },
];

// أبعاد التاج والجذر لكل نوع
const DIMS: Record<ToothType, { cw: number; ch: number; rw: number; rh: number; roots: number }> = {
  molar:    { cw: 48, ch: 38, rw: 13, rh: 55, roots: 3 },
  premolar: { cw: 34, ch: 40, rw: 11, rh: 58, roots: 2 },
  canine:   { cw: 22, ch: 50, rw: 9,  rh: 70, roots: 1 },
  incisor:  { cw: 24, ch: 34, rw: 9,  rh: 52, roots: 1 },
};

// الخط الفاصل بين اللثة والجذر
const BASE = 185;

// مسار تاج السن العلوي (تاج ينزل للأسفل من BASE)
function crownPathUpper(x: number, type: ToothType): string {
  const { cw, ch } = DIMS[type];
  const r = type === "canine" ? 10 : 7;
  const y = BASE;
  // تاج بحواف مدورة — قمة مسطحة (عند اللثة) وقاع مدور (حافة العض)
  return `M ${x},${y} L ${x+cw},${y} L ${x+cw},${y+ch-r} Q ${x+cw},${y+ch} ${x+cw-r},${y+ch} L ${x+r},${y+ch} Q ${x},${y+ch} ${x},${y+ch-r} Z`;
}

// مسار تاج السن السفلي (تاج يصعد للأعلى من BASE)
function crownPathLower(x: number, type: ToothType): string {
  const { cw, ch } = DIMS[type];
  const r = type === "canine" ? 10 : 7;
  const y = BASE;
  return `M ${x},${y} L ${x+cw},${y} L ${x+cw},${y-ch+r} Q ${x+cw},${y-ch} ${x+cw-r},${y-ch} L ${x+r},${y-ch} Q ${x},${y-ch} ${x},${y-ch-r+r} Z`;
}

// رسم جذور السن العلوي (تصعد للأعلى)
function RootsUpper({ x, type }: { x: number; type: ToothType }) {
  const { cw, rw, rh, roots } = DIMS[type];
  const spacing = (cw - roots * rw) / (roots + 1);
  return (
    <>
      {Array.from({ length: roots }).map((_, i) => {
        const rx = x + spacing + i * (rw + spacing);
        const tip = BASE - rh;
        const taper = rw * 0.35;
        return (
          <path
            key={i}
            d={`M ${rx},${BASE} L ${rx+rw},${BASE} L ${rx+rw-taper},${tip+5} Q ${rx+rw/2},${tip-4} ${rx+taper},${tip+5} Z`}
            fill="#f5f0e8" stroke="#d4c5a9" strokeWidth={1}
          />
        );
      })}
    </>
  );
}

// رسم جذور السن السفلي (تنزل للأسفل)
function RootsLower({ x, type }: { x: number; type: ToothType }) {
  const { cw, rw, rh, roots } = DIMS[type];
  const spacing = (cw - roots * rw) / (roots + 1);
  return (
    <>
      {Array.from({ length: roots }).map((_, i) => {
        const rx = x + spacing + i * (rw + spacing);
        const tip = BASE + rh;
        const taper = rw * 0.35;
        return (
          <path
            key={i}
            d={`M ${rx},${BASE} L ${rx+rw},${BASE} L ${rx+rw-taper},${tip-5} Q ${rx+rw/2},${tip+4} ${rx+taper},${tip-5} Z`}
            fill="#f5f0e8" stroke="#d4c5a9" strokeWidth={1}
          />
        );
      })}
    </>
  );
}

type Treatment = { id: string; toothNumber: number; treatment: string; notes: string | null };

export default function ToothChartClient({
  patientId,
  initialTreatments,
}: {
  patientId: string;
  initialTreatments: Treatment[];
}) {
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  function getTreatment(num: number) { return treatments.find(t => t.toothNumber === num); }
  function getInfo(key: string) { return TREATMENTS.find(t => t.key === key); }

  async function saveTreatment(treatmentKey: string) {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}/teeth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toothNumber: selected, treatment: treatmentKey, notes: notes || null }),
    });
    if (res.ok) {
      const { treatment } = await res.json();
      setTreatments(prev => [...prev.filter(t => t.toothNumber !== selected), treatment]);
    }
    setSaving(false); setSelected(null); setNotes("");
  }

  async function clearTooth() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/patients/${patientId}/teeth`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toothNumber: selected }),
    });
    setTreatments(prev => prev.filter(t => t.toothNumber !== selected));
    setSaving(false); setSelected(null); setNotes("");
  }

  function ToothGroup({ num, x, upper }: { num: number; x: number; upper: boolean }) {
    const t = getTreatment(num);
    const info = t ? getInfo(t.treatment) : null;
    const isSelected = selected === num;
    const type = [...UPPER, ...LOWER].find(d => d.num === num)!.type;
    const crown = upper ? crownPathUpper(x, type) : crownPathLower(x, type);
    const { cw, ch } = DIMS[type];
    const crownY = upper ? BASE : BASE - ch;

    return (
      <g
        onClick={() => { setSelected(isSelected ? null : num); setNotes(t?.notes ?? ""); }}
        style={{ cursor: "pointer" }}
      >
        {/* الجذور */}
        {upper ? <RootsUpper x={x} type={type} /> : <RootsLower x={x} type={type} />}

        {/* تاج السن — لون الخلفية */}
        <path d={crown} fill="#fffcf5" stroke="#c9b99a" strokeWidth={1.5} />

        {/* لون العلاج — يملأ شكل التاج بالضبط */}
        {info && (
          <path
            d={crown}
            fill={info.color}
            opacity={0.55}
            stroke={info.color}
            strokeWidth={0.5}
          />
        )}

        {/* إطار التحديد */}
        {isSelected && (
          <path
            d={crown}
            fill="none"
            stroke="#1e3a8a"
            strokeWidth={2.5}
            strokeDasharray="5 3"
          />
        )}

        {/* رقم السن */}
        <text
          x={x + cw / 2}
          y={upper ? crownY + ch + 14 : crownY - 5}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          fill={isSelected ? "#1e3a8a" : "#94a3b8"}
        >
          {num}
        </text>
      </g>
    );
  }

  return (
    <div dir="rtl">
      {/* الخريطة SVG */}
      <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12, border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <svg viewBox="0 0 710 380" style={{ width: "100%", minWidth: 500 }}>
          {/* خط اللثة */}
          <line x1={0} y1={BASE} x2={710} y2={BASE} stroke="#e2e8f0" strokeWidth={2} strokeDasharray="4 4" />
          <text x={700} y={BASE - 6} textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight={700}>علوي</text>
          <text x={700} y={BASE + 14} textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight={700}>سفلي</text>

          {/* الأسنان العلوية */}
          {UPPER.map(({ num, x }) => (
            <ToothGroup key={num} num={num} x={x} upper={true} />
          ))}

          {/* الأسنان السفلية */}
          {LOWER.map(({ num, x }) => (
            <ToothGroup key={num} num={num} x={x} upper={false} />
          ))}
        </svg>
      </div>

      {/* مفتاح الألوان */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {TREATMENTS.map(t => (
          <span key={t.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#475569" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: t.color, display: "inline-block" }} />
            {t.label}
          </span>
        ))}
      </div>

      {/* بانيل التعديل */}
      {selected && (
        <div style={{ marginTop: 12, background: "white", borderRadius: 14, border: "1.5px solid #dbeafe", padding: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#1e3a8a", marginBottom: 10 }}>
            السن {selected} — اختر العلاج:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
            {TREATMENTS.map(t => (
              <button key={t.key} onClick={() => saveTreatment(t.key)} disabled={saving}
                style={{ padding: "6px 14px", borderRadius: 20, background: t.color, color: "white", fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {t.label}
              </button>
            ))}
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظة (اختياري)"
            style={{ width: "100%", padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: "border-box" }} />
          {getTreatment(selected) && (
            <button onClick={clearTooth} disabled={saving}
              style={{ padding: "5px 14px", borderRadius: 20, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", cursor: "pointer" }}>
              مسح العلاج
            </button>
          )}
        </div>
      )}

      {/* ملخص */}
      {treatments.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 6 }}>ملخص العلاجات:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {treatments.map(t => {
              const info = getInfo(t.treatment);
              return (
                <span key={t.id} style={{ padding: "3px 10px", borderRadius: 20, background: (info?.color ?? "#6b7280") + "20", color: info?.color ?? "#6b7280", fontSize: 11, fontWeight: 800, border: `1px solid ${(info?.color ?? "#6b7280")}40` }}>
                  {t.toothNumber} — {info?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
