"use client";

import { useState } from "react";

const LESION_TYPES = [
  { key: "rash",      labelAr: "طفح جلدي",  color: "#f59e0b" },
  { key: "acne",      labelAr: "حبوب أكني",  color: "#ef4444" },
  { key: "eczema",    labelAr: "إكزيما",      color: "#8b5cf6" },
  { key: "psoriasis", labelAr: "صدفية",       color: "#3b82f6" },
  { key: "wound",     labelAr: "جرح / كدمة", color: "#dc2626" },
  { key: "burn",      labelAr: "حرق",         color: "#f97316" },
  { key: "pigment",   labelAr: "تصبغ",        color: "#92400e" },
  { key: "allergy",   labelAr: "حساسية",      color: "#10b981" },
  { key: "other",     labelAr: "أخرى",        color: "#6b7280" },
];

type ShapeEllipse = { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number };
type ShapeRect = { shape: "rect"; x: number; y: number; w: number; h: number; rx?: number };
type Region = { id: string; labelAr: string } & (ShapeEllipse | ShapeRect);

const FRONT_REGIONS: Region[] = [
  { id: "head",              labelAr: "الرأس",              shape: "ellipse", cx: 140, cy: 54,  rx: 37, ry: 44 },
  { id: "neck",              labelAr: "الرقبة",             shape: "rect",    x: 127,  y: 96,   w: 26,  h: 26,  rx: 8 },
  { id: "left_shoulder",     labelAr: "الكتف الأيسر",       shape: "ellipse", cx: 86,  cy: 124, rx: 30, ry: 18 },
  { id: "right_shoulder",    labelAr: "الكتف الأيمن",       shape: "ellipse", cx: 194, cy: 124, rx: 30, ry: 18 },
  { id: "chest",             labelAr: "الصدر",              shape: "rect",    x: 100,  y: 106,  w: 80,  h: 96,  rx: 10 },
  { id: "abdomen",           labelAr: "البطن",              shape: "rect",    x: 104,  y: 204,  w: 72,  h: 88,  rx: 10 },
  { id: "left_upper_arm",    labelAr: "العضد الأيسر",       shape: "rect",    x: 56,   y: 122,  w: 24,  h: 88,  rx: 12 },
  { id: "right_upper_arm",   labelAr: "العضد الأيمن",       shape: "rect",    x: 200,  y: 122,  w: 24,  h: 88,  rx: 12 },
  { id: "left_forearm",      labelAr: "الساعد الأيسر",      shape: "rect",    x: 52,   y: 212,  w: 20,  h: 78,  rx: 10 },
  { id: "right_forearm",     labelAr: "الساعد الأيمن",      shape: "rect",    x: 208,  y: 212,  w: 20,  h: 78,  rx: 10 },
  { id: "left_hand",         labelAr: "اليد اليسرى",        shape: "ellipse", cx: 62,  cy: 316, rx: 18, ry: 23 },
  { id: "right_hand",        labelAr: "اليد اليمنى",        shape: "ellipse", cx: 218, cy: 316, rx: 18, ry: 23 },
  { id: "pelvis",            labelAr: "منطقة الحوض",        shape: "ellipse", cx: 140, cy: 306, rx: 52, ry: 24 },
  { id: "left_thigh",        labelAr: "الفخذ الأيسر",       shape: "rect",    x: 98,   y: 326,  w: 34,  h: 96,  rx: 14 },
  { id: "right_thigh",       labelAr: "الفخذ الأيمن",       shape: "rect",    x: 148,  y: 326,  w: 34,  h: 96,  rx: 14 },
  { id: "left_knee",         labelAr: "الركبة اليسرى",      shape: "ellipse", cx: 115, cy: 434, rx: 19, ry: 13 },
  { id: "right_knee",        labelAr: "الركبة اليمنى",      shape: "ellipse", cx: 165, cy: 434, rx: 19, ry: 13 },
  { id: "left_shin",         labelAr: "الساق اليسرى",       shape: "rect",    x: 100,  y: 448,  w: 28,  h: 86,  rx: 12 },
  { id: "right_shin",        labelAr: "الساق اليمنى",       shape: "rect",    x: 152,  y: 448,  w: 28,  h: 86,  rx: 12 },
  { id: "left_foot",         labelAr: "القدم اليسرى",       shape: "ellipse", cx: 114, cy: 546, rx: 30, ry: 14 },
  { id: "right_foot",        labelAr: "القدم اليمنى",       shape: "ellipse", cx: 166, cy: 546, rx: 30, ry: 14 },
];

const BACK_REGIONS: Region[] = [
  { id: "head_b",            labelAr: "الرأس (خلفي)",       shape: "ellipse", cx: 140, cy: 54,  rx: 37, ry: 44 },
  { id: "neck_b",            labelAr: "الرقبة (خلفية)",     shape: "rect",    x: 127,  y: 96,   w: 26,  h: 26,  rx: 8 },
  { id: "left_shoulder_b",   labelAr: "الكتف الأيسر",       shape: "ellipse", cx: 86,  cy: 124, rx: 30, ry: 18 },
  { id: "right_shoulder_b",  labelAr: "الكتف الأيمن",       shape: "ellipse", cx: 194, cy: 124, rx: 30, ry: 18 },
  { id: "upper_back",        labelAr: "أعلى الظهر",         shape: "rect",    x: 100,  y: 106,  w: 80,  h: 92,  rx: 10 },
  { id: "lower_back",        labelAr: "أسفل الظهر",         shape: "rect",    x: 104,  y: 200,  w: 72,  h: 90,  rx: 10 },
  { id: "left_upper_arm_b",  labelAr: "العضد الأيسر",       shape: "rect",    x: 56,   y: 122,  w: 24,  h: 88,  rx: 12 },
  { id: "right_upper_arm_b", labelAr: "العضد الأيمن",       shape: "rect",    x: 200,  y: 122,  w: 24,  h: 88,  rx: 12 },
  { id: "left_forearm_b",    labelAr: "الساعد الأيسر",      shape: "rect",    x: 52,   y: 212,  w: 20,  h: 78,  rx: 10 },
  { id: "right_forearm_b",   labelAr: "الساعد الأيمن",      shape: "rect",    x: 208,  y: 212,  w: 20,  h: 78,  rx: 10 },
  { id: "left_hand_b",       labelAr: "اليد اليسرى",        shape: "ellipse", cx: 62,  cy: 316, rx: 18, ry: 23 },
  { id: "right_hand_b",      labelAr: "اليد اليمنى",        shape: "ellipse", cx: 218, cy: 316, rx: 18, ry: 23 },
  { id: "left_buttock",      labelAr: "الأرداف الأيسر",     shape: "ellipse", cx: 118, cy: 308, rx: 36, ry: 28 },
  { id: "right_buttock",     labelAr: "الأرداف الأيمن",     shape: "ellipse", cx: 162, cy: 308, rx: 36, ry: 28 },
  { id: "left_thigh_b",      labelAr: "الفخذ الأيسر",       shape: "rect",    x: 98,   y: 334,  w: 34,  h: 88,  rx: 14 },
  { id: "right_thigh_b",     labelAr: "الفخذ الأيمن",       shape: "rect",    x: 148,  y: 334,  w: 34,  h: 88,  rx: 14 },
  { id: "left_calf",         labelAr: "بطة الساق اليسرى",   shape: "rect",    x: 100,  y: 448,  w: 28,  h: 86,  rx: 12 },
  { id: "right_calf",        labelAr: "بطة الساق اليمنى",   shape: "rect",    x: 152,  y: 448,  w: 28,  h: 86,  rx: 12 },
  { id: "left_heel",         labelAr: "الكعب الأيسر",       shape: "ellipse", cx: 114, cy: 546, rx: 30, ry: 14 },
  { id: "right_heel",        labelAr: "الكعب الأيمن",       shape: "ellipse", cx: 166, cy: 546, rx: 30, ry: 14 },
];

type Annotation = { id: string; regionId: string; label: string; color: string; notes: string | null };

function RegionShape({
  region, fill, stroke, strokeWidth, strokeDasharray,
}: {
  region: Region;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}) {
  const base = { fill, stroke, strokeWidth, strokeDasharray };
  if (region.shape === "ellipse") {
    return <ellipse cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...base} />;
  }
  return <rect x={region.x} y={region.y} width={region.w} height={region.h} rx={region.rx ?? 0} {...base} />;
}

function BodySVG({
  regions,
  annotations,
  selected,
  onSelect,
}: {
  regions: Region[];
  annotations: Annotation[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  function getAnnotation(id: string) {
    return annotations.find((a) => a.regionId === id) ?? null;
  }

  return (
    <svg viewBox="0 0 280 574" style={{ width: "100%", maxWidth: 280, display: "block", margin: "0 auto" }}>
      {/* body silhouette background */}
      <ellipse cx="140" cy="54" rx="37" ry="44" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="127" y="96" width="26" height="26" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M98,108 Q118,100 140,100 Q162,100 182,108 L188,202 L104,202 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="104" y="202" width="72" height="90" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <ellipse cx="140" cy="306" rx="52" ry="24" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="56" y="122" width="24" height="168" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="200" y="122" width="24" height="168" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <ellipse cx="62" cy="316" rx="18" ry="23" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <ellipse cx="218" cy="316" rx="18" ry="23" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="98" y="326" width="34" height="96" rx="14" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="148" y="326" width="34" height="96" rx="14" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <ellipse cx="115" cy="434" rx="19" ry="13" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <ellipse cx="165" cy="434" rx="19" ry="13" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="100" y="448" width="28" height="86" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="152" y="448" width="28" height="86" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <ellipse cx="114" cy="546" rx="30" ry="14" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <ellipse cx="166" cy="546" rx="30" ry="14" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* clickable regions */}
      {regions.map((region) => {
        const ann = getAnnotation(region.id);
        const isSel = selected === region.id;
        return (
          <g key={region.id} onClick={() => onSelect(region.id)} style={{ cursor: "pointer" }}>
            <RegionShape
              region={region}
              fill={ann ? ann.color + "55" : "transparent"}
              stroke={isSel ? "#1e3a8a" : "transparent"}
              strokeWidth={isSel ? 2 : 0}
            />
            {isSel && (
              <RegionShape
                region={region}
                fill="none"
                stroke="#1e3a8a"
                strokeWidth={2}
                strokeDasharray="5 3"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function BodyMapClient({
  patientId,
  specialtyCode,
  initialAnnotations,
}: {
  patientId: string;
  specialtyCode: string;
  initialAnnotations: Annotation[];
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [view, setView] = useState<"front" | "back">("front");
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const regions = view === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const selectedRegion = regions.find((r) => r.id === selected);
  const selectedAnnotation = annotations.find((a) => a.regionId === selected) ?? null;

  function handleSelect(id: string) {
    const same = selected === id;
    setSelected(same ? null : id);
    setNotes(same ? "" : (annotations.find((a) => a.regionId === id)?.notes ?? ""));
  }

  async function saveAnnotation(lesionKey: string) {
    if (!selected) return;
    const lesion = LESION_TYPES.find((l) => l.key === lesionKey)!;
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        specialtyCode,
        regionId: selected,
        label: lesionKey,
        color: lesion.color,
        notes: notes || null,
      }),
    });
    if (res.ok) {
      const { annotation } = await res.json();
      setAnnotations((prev) => [...prev.filter((a) => a.regionId !== selected), annotation]);
    }
    setSaving(false);
    setSelected(null);
    setNotes("");
  }

  async function clearAnnotation() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/patients/${patientId}/annotations`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialtyCode, regionId: selected }),
    });
    setAnnotations((prev) => prev.filter((a) => a.regionId !== selected));
    setSaving(false);
    setSelected(null);
    setNotes("");
  }

  return (
    <div dir="rtl">
      {/* View toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setView(v); setSelected(null); setNotes(""); }}
            style={{
              padding: "6px 18px", borderRadius: 20, fontSize: 13, fontWeight: 800,
              background: view === v ? "#1e3a8a" : "#f1f5f9",
              color: view === v ? "white" : "#475569",
              border: "none", cursor: "pointer",
            }}
          >
            {v === "front" ? "🫁 المنظر الأمامي" : "🫀 المنظر الخلفي"}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center", marginRight: "auto" }}>
          انقر على المنطقة لتحديد الإصابة
        </span>
      </div>

      {/* Body map */}
      <div style={{
        background: "white", borderRadius: 14, border: "1px solid #e2e8f0",
        padding: "12px 8px", userSelect: "none",
      }}>
        <BodySVG
          regions={regions}
          annotations={annotations}
          selected={selected}
          onSelect={handleSelect}
        />
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {LESION_TYPES.map((t) => (
          <span key={t.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#475569" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: t.color, display: "inline-block" }} />
            {t.labelAr}
          </span>
        ))}
      </div>

      {/* Edit panel */}
      {selected && selectedRegion && (
        <div style={{ marginTop: 14, background: "white", borderRadius: 14, border: "1.5px solid #dbeafe", padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#1e3a8a", marginBottom: 10 }}>
            {selectedRegion.labelAr} — اختر نوع الإصابة:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {LESION_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => saveAnnotation(t.key)}
                disabled={saving}
                style={{
                  padding: "6px 14px", borderRadius: 20,
                  background: t.color, color: "white",
                  fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {t.labelAr}
              </button>
            ))}
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظة عن الإصابة (اختياري)"
            style={{
              width: "100%", padding: "7px 12px",
              border: "1px solid #e2e8f0", borderRadius: 10,
              fontSize: 13, marginBottom: 8, boxSizing: "border-box",
            }}
          />
          {selectedAnnotation && (
            <button
              onClick={clearAnnotation}
              disabled={saving}
              style={{
                padding: "5px 14px", borderRadius: 20,
                background: "#f1f5f9", color: "#64748b",
                fontSize: 12, fontWeight: 700,
                border: "1px solid #e2e8f0", cursor: "pointer",
              }}
            >
              مسح الإصابة
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {annotations.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 8 }}>ملخص الإصابات:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {annotations.map((a) => {
              const lesion = LESION_TYPES.find((l) => l.key === a.label);
              const region = [...FRONT_REGIONS, ...BACK_REGIONS].find((r) => r.id === a.regionId);
              return (
                <span key={a.id} style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: (lesion?.color ?? "#6b7280") + "20",
                  color: lesion?.color ?? "#6b7280",
                  fontSize: 11, fontWeight: 800,
                  border: `1px solid ${(lesion?.color ?? "#6b7280")}40`,
                }}>
                  {region?.labelAr ?? a.regionId} — {lesion?.labelAr ?? a.label}
                  {a.notes && <span style={{ opacity: 0.7 }}> · {a.notes}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
