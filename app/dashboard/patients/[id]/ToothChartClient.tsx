"use client";

import { useState } from "react";
import Image from "next/image";

const TREATMENTS = [
  { key: "filling",    label: "حشو",       color: "#f59e0b" },
  { key: "extraction", label: "خلع",        color: "#ef4444" },
  { key: "rootCanal",  label: "علاج عصب",  color: "#8b5cf6" },
  { key: "crown",      label: "تلبيس",      color: "#3b82f6" },
  { key: "cleaning",   label: "تنظيف جير", color: "#10b981" },
  { key: "implant",    label: "زراعة",      color: "#f97316" },
  { key: "other",      label: "أخرى",       color: "#6b7280" },
];

// viewBox 900×430 — إحداثيات دقيقة لكل سن حسب موقعه الفعلي في الصورة
// عروض متغيرة: أرحاء 58-67px، ضواحك 50px، أنياب 50px، ثنايا 41-45px
// المنتصف: فجوة 22px بين السن 11 (end=439) والسن 21 (start=461)
const TEETH: { num: number; x: number; y: number; w: number; h: number }[] = [
  // ── الصف العلوي — يمين (18 → 11) — جذر ↑ تاج ↓ ──
  { num: 18, x: 15,  y: 125, w: 67, h: 125 },
  { num: 17, x: 82,  y: 125, w: 63, h: 125 },
  { num: 16, x: 145, y: 127, w: 58, h: 123 },
  { num: 15, x: 203, y: 129, w: 50, h: 121 },
  { num: 14, x: 253, y: 129, w: 50, h: 121 },
  { num: 13, x: 303, y: 121, w: 50, h: 129 },
  { num: 12, x: 353, y: 129, w: 41, h: 121 },
  { num: 11, x: 394, y: 127, w: 45, h: 123 },
  // ── الصف العلوي — يسار (21 → 28) ──
  { num: 21, x: 461, y: 127, w: 45, h: 123 },
  { num: 22, x: 506, y: 129, w: 41, h: 121 },
  { num: 23, x: 547, y: 121, w: 50, h: 129 },
  { num: 24, x: 597, y: 129, w: 50, h: 121 },
  { num: 25, x: 647, y: 129, w: 50, h: 121 },
  { num: 26, x: 697, y: 127, w: 58, h: 123 },
  { num: 27, x: 755, y: 125, w: 63, h: 125 },
  { num: 28, x: 818, y: 125, w: 67, h: 125 },
  // ── الصف السفلي — يمين (48 → 41) — تاج ↑ جذر ↓ ──
  { num: 48, x: 15,  y: 268, w: 67, h: 118 },
  { num: 47, x: 82,  y: 268, w: 63, h: 118 },
  { num: 46, x: 145, y: 270, w: 58, h: 116 },
  { num: 45, x: 203, y: 272, w: 50, h: 114 },
  { num: 44, x: 253, y: 272, w: 50, h: 114 },
  { num: 43, x: 303, y: 266, w: 50, h: 122 },
  { num: 42, x: 353, y: 270, w: 41, h: 116 },
  { num: 41, x: 394, y: 268, w: 45, h: 118 },
  // ── الصف السفلي — يسار (31 → 38) ──
  { num: 31, x: 461, y: 268, w: 45, h: 118 },
  { num: 32, x: 506, y: 270, w: 41, h: 116 },
  { num: 33, x: 547, y: 266, w: 50, h: 122 },
  { num: 34, x: 597, y: 272, w: 50, h: 114 },
  { num: 35, x: 647, y: 272, w: 50, h: 114 },
  { num: 36, x: 697, y: 270, w: 58, h: 116 },
  { num: 37, x: 755, y: 268, w: 63, h: 118 },
  { num: 38, x: 818, y: 268, w: 67, h: 118 },
];

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

  function getTreatment(tooth: number) {
    return treatments.find((t) => t.toothNumber === tooth);
  }

  function getInfo(key: string) {
    return TREATMENTS.find((t) => t.key === key);
  }

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
      setTreatments((prev) => [...prev.filter((t) => t.toothNumber !== selected), treatment]);
    }
    setSaving(false);
    setSelected(null);
    setNotes("");
  }

  async function clearTooth() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/patients/${patientId}/teeth`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toothNumber: selected }),
    });
    setTreatments((prev) => prev.filter((t) => t.toothNumber !== selected));
    setSaving(false);
    setSelected(null);
    setNotes("");
  }

  return (
    <div dir="rtl">
      {/* الخريطة التفاعلية */}
      <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div style={{ position: "relative", width: "100%", paddingBottom: "47.8%" }}>
          <Image
            src="/dental-chart.jpg"
            alt="خريطة الأسنان"
            fill
            style={{ objectFit: "cover", objectPosition: "top" }}
            priority
          />

          <svg
            viewBox="0 0 900 430"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
          >
            <defs>
              {/*
                فلتر يحوّل الصورة إلى قناع:
                  - البكسلات البيضاء (الخلفية)  → سوداء  → شفافة  → لا يظهر اللون
                  - البكسلات الكريمية (السن)     → بيضاء  → معتمة  → يظهر اللون
                المعادلة: output = clamp(-20·R + 20, 0, 1)
                عند R=1.0 (أبيض):  20-20=0   ← شفاف
                عند R=0.94(كريمي): 20-18.8=1.2 ← كامل التعتيم
              */}
              <filter id="tsf" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values="-20 0 0 0 20
                           0 -20 0 0 20
                           0  0 -20 0 20
                           0  0   0  1  0"
                />
              </filter>

              {/*
                قناع SVG مبني من صورة الأسنان المفلترة.
                حيث يكون القناع أبيض (= منطقة السن) → يمرّر اللون.
                حيث يكون أسود (= الخلفية) → يحجب اللون.
                النتيجة: اللون يتبع شكل السن بالضبط بدون قصّ يدوي.
              */}
              <mask id="tmask" maskUnits="userSpaceOnUse">
                {/* width=900 height=570 = الحجم الحقيقي للصورة؛ viewBox يقصّها تلقائياً عند y=430 */}
                <image
                  href="/dental-chart.jpg"
                  x="0" y="0" width="900" height="570"
                  preserveAspectRatio="xMinYMin meet"
                  filter="url(#tsf)"
                />
              </mask>
            </defs>

            {TEETH.map(({ num, x, y, w, h }) => {
              const tr = getTreatment(num);
              const info = tr ? getInfo(tr.treatment) : null;
              const isSelected = selected === num;

              return (
                <g
                  key={num}
                  onClick={() => { setSelected(isSelected ? null : num); setNotes(tr?.notes ?? ""); }}
                  style={{ cursor: "pointer" }}
                >
                  {/* منطقة النقر — شفافة تغطي كامل مساحة السن */}
                  <rect x={x} y={y} width={w} height={h} fill="transparent" />

                  {/*
                    اللون المعالَج بالقناع:
                    المستطيل يغطي منطقة السن → القناع يُظهره فقط على بكسلات السن الكريمية
                    الخلفية البيضاء تبقى بيضاء بدون أي تلوين
                  */}
                  {info && (
                    <rect
                      x={x} y={y} width={w} height={h}
                      fill={info.color}
                      opacity={0.85}
                      mask="url(#tmask)"
                    />
                  )}

                  {/* إطار التحديد */}
                  {isSelected && (
                    <rect
                      x={x - 3} y={y - 3} width={w + 6} height={h + 6}
                      rx={10}
                      fill="none"
                      stroke="#1e3a8a"
                      strokeWidth={3}
                      strokeDasharray="6 3"
                    />
                  )}

                  {/* رقم السن */}
                  {isSelected && (
                    <text
                      x={x + w / 2} y={y - 9}
                      textAnchor="middle" fontSize={12} fontWeight={900} fill="#1e3a8a"
                    >
                      {num}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* مفتاح الألوان */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {TREATMENTS.map((t) => (
          <span key={t.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#475569" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: t.color, display: "inline-block" }} />
            {t.label}
          </span>
        ))}
      </div>

      {/* بانيل التعديل */}
      {selected && (
        <div style={{ marginTop: 14, background: "white", borderRadius: 14, border: "1.5px solid #dbeafe", padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#1e3a8a", marginBottom: 10 }}>
            السن {selected} — اختر العلاج:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {TREATMENTS.map((t) => (
              <button
                key={t.key}
                onClick={() => saveTreatment(t.key)}
                disabled={saving}
                style={{
                  padding: "6px 14px", borderRadius: 20,
                  background: t.color, color: "white",
                  fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظة (اختياري)"
            style={{
              width: "100%", padding: "7px 12px",
              border: "1px solid #e2e8f0", borderRadius: 10,
              fontSize: 13, marginBottom: 8, boxSizing: "border-box",
            }}
          />
          {getTreatment(selected) && (
            <button
              onClick={clearTooth}
              disabled={saving}
              style={{
                padding: "5px 14px", borderRadius: 20,
                background: "#f1f5f9", color: "#64748b",
                fontSize: 12, fontWeight: 700,
                border: "1px solid #e2e8f0", cursor: "pointer",
              }}
            >
              مسح العلاج
            </button>
          )}
        </div>
      )}

      {/* ملخص */}
      {treatments.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 8 }}>ملخص العلاجات:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {treatments.map((t) => {
              const info = getInfo(t.treatment);
              return (
                <span key={t.id} style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: (info?.color ?? "#6b7280") + "20",
                  color: info?.color ?? "#6b7280",
                  fontSize: 11, fontWeight: 800,
                  border: `1px solid ${(info?.color ?? "#6b7280")}40`,
                }}>
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
