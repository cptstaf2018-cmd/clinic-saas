"use client";

import { useState } from "react";

const TREATMENTS = [
  { key: "filling",    label: "حشو",         color: "#f59e0b" },
  { key: "extraction", label: "خلع",          color: "#ef4444" },
  { key: "rootCanal",  label: "علاج عصب",    color: "#8b5cf6" },
  { key: "crown",      label: "تلبيس",        color: "#3b82f6" },
  { key: "cleaning",   label: "تنظيف جير",   color: "#10b981" },
  { key: "implant",    label: "زراعة",        color: "#f97316" },
  { key: "other",      label: "أخرى",         color: "#6b7280" },
];

// ترقيم FDI — علوي: 18-11 | 21-28  سفلي: 48-41 | 31-38
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];

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

  function getColor(tooth: number) {
    const t = getTreatment(tooth);
    if (!t) return "#e2e8f0";
    return TREATMENTS.find((x) => x.key === t.treatment)?.color ?? "#6b7280";
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
      setTreatments((prev) => {
        const filtered = prev.filter((t) => t.toothNumber !== selected);
        return [...filtered, treatment];
      });
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

  function ToothButton({ num }: { num: number }) {
    const color = getColor(num);
    const isSelected = selected === num;
    const t = getTreatment(num);
    return (
      <button
        onClick={() => { setSelected(isSelected ? null : num); setNotes(t?.notes ?? ""); }}
        title={t ? TREATMENTS.find((x) => x.key === t.treatment)?.label : `سن ${num}`}
        style={{
          width: 36, height: 44,
          borderRadius: 8,
          background: color,
          border: isSelected ? "2.5px solid #1e3a8a" : "1.5px solid #cbd5e1",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 2, cursor: "pointer",
          boxShadow: isSelected ? "0 0 0 3px rgba(30,58,138,0.25)" : "none",
          transition: "all 0.15s",
          fontSize: 9, fontWeight: 700,
          color: color === "#e2e8f0" ? "#94a3b8" : "white",
        }}
      >
        <span>{num}</span>
      </button>
    );
  }

  return (
    <div dir="rtl">
      {/* الخريطة */}
      <div style={{ background: "#f8fafc", borderRadius: 16, padding: "16px 12px", border: "1px solid #e2e8f0" }}>
        {/* صف علوي */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 4 }}>
          {UPPER_RIGHT.map((n) => <ToothButton key={n} num={n} />)}
          <div style={{ width: 2, background: "#cbd5e1", borderRadius: 2, margin: "0 4px" }} />
          {UPPER_LEFT.map((n) => <ToothButton key={n} num={n} />)}
        </div>
        {/* فاصل */}
        <div style={{ height: 1, background: "#e2e8f0", margin: "6px 0" }} />
        {/* صف سفلي */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
          {LOWER_RIGHT.map((n) => <ToothButton key={n} num={n} />)}
          <div style={{ width: 2, background: "#cbd5e1", borderRadius: 2, margin: "0 4px" }} />
          {LOWER_LEFT.map((n) => <ToothButton key={n} num={n} />)}
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
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#e2e8f0", border: "1px solid #cbd5e1", display: "inline-block" }} />
          بدون علاج
        </span>
      </div>

      {/* بانيل التعديل */}
      {selected && (
        <div style={{
          marginTop: 14, background: "white", borderRadius: 14,
          border: "1.5px solid #dbeafe", padding: 16,
        }}>
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
              const info = TREATMENTS.find((x) => x.key === t.treatment);
              return (
                <span key={t.id} style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: info?.color + "20",
                  color: info?.color,
                  fontSize: 11, fontWeight: 800,
                  border: `1px solid ${info?.color}40`,
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
