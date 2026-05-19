"use client";

import { useState } from "react";
import Image from "next/image";

const TREATMENTS = [
  { key: "filling",    label: "حشو",       color: "#f59e0b", alpha: "60" },
  { key: "extraction", label: "خلع",        color: "#ef4444", alpha: "60" },
  { key: "rootCanal",  label: "علاج عصب",  color: "#8b5cf6", alpha: "60" },
  { key: "crown",      label: "تلبيس",      color: "#3b82f6", alpha: "60" },
  { key: "cleaning",   label: "تنظيف جير", color: "#10b981", alpha: "60" },
  { key: "implant",    label: "زراعة",      color: "#f97316", alpha: "60" },
  { key: "other",      label: "أخرى",       color: "#6b7280", alpha: "60" },
];

// إحداثيات كل سن — viewBox 900 x 430
// عروض حسب نوع السن: أرحاء=50 | ضواحك=44 | أنياب=44 | رباعي=30 (مُزاح يمين) | ثنية=44
const TOOTH_COORDS: { num: number; x: number; y: number; w: number; h: number }[] = [
  // ── الصف العلوي — يمين (18 → 11) ──
  { num: 18, x: 30,  y: 140, w: 50, h: 120 }, // رحى
  { num: 17, x: 90,  y: 140, w: 50, h: 120 }, // رحى
  { num: 16, x: 158, y: 140, w: 50, h: 120 }, // رحى
  { num: 15, x: 212, y: 140, w: 44, h: 120 }, // ضاحك
  { num: 14, x: 260, y: 140, w: 39, h: 120 }, // ضاحك
  { num: 13, x: 303, y: 140, w: 38, h: 120 }, // ناب
  { num: 12, x: 345, y: 140, w: 30, h: 120 }, // رباعي
  { num: 11, x: 379, y: 140, w: 44, h: 120 }, // ثنية
  // ── الصف العلوي — يسار (21 → 28) ──
  { num: 21, x: 441, y: 140, w: 44, h: 120 }, // ثنية
  { num: 22, x: 489, y: 140, w: 36, h: 120 }, // رباعي
  { num: 23, x: 530, y: 140, w: 34, h: 120 }, // ناب
  { num: 24, x: 569, y: 140, w: 44, h: 120 }, // ضاحك
  { num: 25, x: 615, y: 140, w: 44, h: 120 }, // ضاحك
  { num: 26, x: 669, y: 140, w: 50, h: 120 }, // رحى
  { num: 27, x: 723, y: 140, w: 50, h: 120 }, // رحى
  { num: 28, x: 777, y: 140, w: 50, h: 120 }, // رحى
  // ── الصف السفلي — يمين (48 → 41) ──
  { num: 48, x: 30,  y: 278, w: 50, h: 120 },
  { num: 47, x: 90,  y: 278, w: 50, h: 120 },
  { num: 46, x: 158, y: 278, w: 50, h: 120 },
  { num: 45, x: 212, y: 278, w: 44, h: 120 },
  { num: 44, x: 260, y: 278, w: 39, h: 120 },
  { num: 43, x: 303, y: 278, w: 38, h: 120 },
  { num: 42, x: 345, y: 278, w: 30, h: 120 },
  { num: 41, x: 379, y: 278, w: 44, h: 120 },
  // ── الصف السفلي — يسار (31 → 38) ──
  { num: 31, x: 441, y: 278, w: 44, h: 120 },
  { num: 32, x: 489, y: 278, w: 30, h: 120 },
  { num: 33, x: 524, y: 278, w: 44, h: 120 },
  { num: 34, x: 573, y: 278, w: 34, h: 120 },
  { num: 35, x: 619, y: 278, w: 44, h: 120 },
  { num: 36, x: 673, y: 278, w: 50, h: 120 },
  { num: 37, x: 727, y: 278, w: 50, h: 120 },
  { num: 38, x: 781, y: 278, w: 50, h: 120 },
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
        {/* صورة T1 — نعرض 75% من الصورة (الأسنان فقط بدون التشريح) */}
        <div style={{ position: "relative", width: "100%", paddingBottom: "47.8%" /* 430/900 */ }}>
          <Image
            src="/dental-chart.jpg"
            alt="خريطة الأسنان"
            fill
            style={{ objectFit: "cover", objectPosition: "top" }}
            priority
          />

          {/* SVG overlay تفاعلي */}
          <svg
            viewBox="0 0 900 430"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
          >
            {TOOTH_COORDS.map(({ num, x, y, w, h }) => {
              const t = getTreatment(num);
              const info = t ? getInfo(t.treatment) : null;
              const isSelected = selected === num;
              return (
                <g key={num} onClick={() => { setSelected(isSelected ? null : num); setNotes(t?.notes ?? ""); }}
                  style={{ cursor: "pointer" }}>
                  {/* منطقة النقر الشفافة */}
                  <rect x={x} y={y} width={w} height={h} rx={8} fill="transparent" />
                  {/* اللون بـ multiply — يتبع شكل السن تلقائياً */}
                  {info && (
                    <rect
                      x={x} y={y} width={w} height={h}
                      rx={8}
                      fill={info.color}
                      opacity={0.55}
                      style={{ mixBlendMode: "multiply" } as React.CSSProperties}
                    />
                  )}
                  {/* إطار التحديد */}
                  {isSelected && (
                    <rect
                      x={x - 2} y={y - 2} width={w + 4} height={h + 4}
                      rx={10}
                      fill="none"
                      stroke="#1e3a8a"
                      strokeWidth={3}
                      strokeDasharray="6 3"
                    />
                  )}
                  {/* رقم السن عند التحديد */}
                  {isSelected && (
                    <text x={x + w / 2} y={y - 6} textAnchor="middle" fontSize={12} fontWeight={900} fill="#1e3a8a">
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
