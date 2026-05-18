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

// إحداثيات كل سن في صورة T1 (viewBox 900 x 340 — الجزء العلوي من الصورة فقط)
// كل سن: { num, x, y, w, h }
const TOOTH_COORDS: { num: number; x: number; y: number; w: number; h: number }[] = [
  // ── الصف العلوي — right to left (18 → 11) ──
  { num: 18, x: 18,  y: 22, w: 48, h: 105 },
  { num: 17, x: 68,  y: 22, w: 48, h: 105 },
  { num: 16, x: 118, y: 22, w: 48, h: 105 },
  { num: 15, x: 168, y: 22, w: 48, h: 105 },
  { num: 14, x: 218, y: 22, w: 48, h: 105 },
  { num: 13, x: 268, y: 22, w: 48, h: 105 },
  { num: 12, x: 318, y: 22, w: 48, h: 105 },
  { num: 11, x: 368, y: 22, w: 48, h: 105 },
  // ── الصف العلوي — left (21 → 28) ──
  { num: 21, x: 430, y: 22, w: 48, h: 105 },
  { num: 22, x: 480, y: 22, w: 48, h: 105 },
  { num: 23, x: 530, y: 22, w: 48, h: 105 },
  { num: 24, x: 580, y: 22, w: 48, h: 105 },
  { num: 25, x: 630, y: 22, w: 48, h: 105 },
  { num: 26, x: 680, y: 22, w: 48, h: 105 },
  { num: 27, x: 730, y: 22, w: 48, h: 105 },
  { num: 28, x: 780, y: 22, w: 48, h: 105 },
  // ── الصف السفلي — right (48 → 41) ──
  { num: 48, x: 18,  y: 210, w: 48, h: 105 },
  { num: 47, x: 68,  y: 210, w: 48, h: 105 },
  { num: 46, x: 118, y: 210, w: 48, h: 105 },
  { num: 45, x: 168, y: 210, w: 48, h: 105 },
  { num: 44, x: 218, y: 210, w: 48, h: 105 },
  { num: 43, x: 268, y: 210, w: 48, h: 105 },
  { num: 42, x: 318, y: 210, w: 48, h: 105 },
  { num: 41, x: 368, y: 210, w: 48, h: 105 },
  // ── الصف السفلي — left (31 → 38) ──
  { num: 31, x: 430, y: 210, w: 48, h: 105 },
  { num: 32, x: 480, y: 210, w: 48, h: 105 },
  { num: 33, x: 530, y: 210, w: 48, h: 105 },
  { num: 34, x: 580, y: 210, w: 48, h: 105 },
  { num: 35, x: 630, y: 210, w: 48, h: 105 },
  { num: 36, x: 680, y: 210, w: 48, h: 105 },
  { num: 37, x: 730, y: 210, w: 48, h: 105 },
  { num: 38, x: 780, y: 210, w: 48, h: 105 },
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
        {/* صورة T1 — نعرض الجزء العلوي فقط (الأسنان) */}
        <div style={{ position: "relative", width: "100%", paddingBottom: "37.8%" /* 340/900 */ }}>
          <Image
            src="/dental-chart.jpg"
            alt="خريطة الأسنان"
            fill
            style={{ objectFit: "cover", objectPosition: "top" }}
            priority
          />

          {/* SVG overlay تفاعلي */}
          <svg
            viewBox="0 0 900 340"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
          >
            {TOOTH_COORDS.map(({ num, x, y, w, h }) => {
              const t = getTreatment(num);
              const info = t ? getInfo(t.treatment) : null;
              const isSelected = selected === num;
              return (
                <g key={num} onClick={() => { setSelected(isSelected ? null : num); setNotes(t?.notes ?? ""); }}>
                  <rect
                    x={x} y={y} width={w} height={h}
                    rx={6}
                    fill={info ? `${info.color}99` : "transparent"}
                    stroke={isSelected ? "#1e3a8a" : info ? info.color : "transparent"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    style={{ transition: "all 0.15s" }}
                  />
                  {/* رقم السن */}
                  <text
                    x={x + w / 2} y={y + h + 14}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill={isSelected ? "#1e3a8a" : "#64748b"}
                  >
                    {num}
                  </text>
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
