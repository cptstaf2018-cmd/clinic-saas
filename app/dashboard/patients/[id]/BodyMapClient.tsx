"use client";

import { useState } from "react";
import Image from "next/image";

const LESION_TYPES = [
  { key: "rash",      labelAr: "طفح جلدي",   color: "#f59e0b" },
  { key: "acne",      labelAr: "حبوب أكني",   color: "#ef4444" },
  { key: "eczema",    labelAr: "إكزيما",       color: "#8b5cf6" },
  { key: "psoriasis", labelAr: "صدفية",        color: "#3b82f6" },
  { key: "wound",     labelAr: "جرح / كدمة",  color: "#dc2626" },
  { key: "burn",      labelAr: "حرق",          color: "#f97316" },
  { key: "pigment",   labelAr: "تصبغ",         color: "#92400e" },
  { key: "allergy",   labelAr: "حساسية",       color: "#10b981" },
  { key: "other",     labelAr: "أخرى",         color: "#6b7280" },
];

// Image: 960×1118 — front body on LEFT (X 0-480), back body on RIGHT (X 480-960)
// Patient anatomy convention: front view → patient right = screen left; back view → patient right = screen right
type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const REGIONS: Region[] = [
  // ── FRONT BODY (left half, center ~X=210) ─────────────────────────────────
  { id: "head_f",        labelAr: "الرأس (أمامي)",          shape: "ellipse", cx: 210, cy: 78,  rx: 62,  ry: 68  },
  { id: "neck_f",        labelAr: "الرقبة (أمامية)",        shape: "rect",    x: 186,  y: 145,  w: 48,   h: 40,  rx: 12 },
  { id: "r_shoulder_f",  labelAr: "الكتف الأيمن",           shape: "ellipse", cx: 132, cy: 194, rx: 54,  ry: 34  },
  { id: "l_shoulder_f",  labelAr: "الكتف الأيسر",           shape: "ellipse", cx: 287, cy: 194, rx: 54,  ry: 34  },
  { id: "chest_f",       labelAr: "الصدر",                  shape: "rect",    x: 142,  y: 178,  w: 136,  h: 172, rx: 20 },
  { id: "abdomen_f",     labelAr: "البطن",                  shape: "rect",    x: 148,  y: 352,  w: 124,  h: 140, rx: 18 },
  { id: "r_arm_f",       labelAr: "العضد الأيمن",           shape: "rect",    x: 76,   y: 188,  w: 48,   h: 178, rx: 22 },
  { id: "l_arm_f",       labelAr: "العضد الأيسر",           shape: "rect",    x: 240,  y: 188,  w: 48,   h: 178, rx: 22 },
  { id: "r_forearm_f",   labelAr: "الساعد الأيمن",          shape: "rect",    x: 62,   y: 368,  w: 42,   h: 152, rx: 18 },
  { id: "l_forearm_f",   labelAr: "الساعد الأيسر",          shape: "rect",    x: 256,  y: 368,  w: 42,   h: 152, rx: 18 },
  { id: "r_hand_f",      labelAr: "اليد اليمنى",            shape: "ellipse", cx: 76,  cy: 540, rx: 36,  ry: 46  },
  { id: "l_hand_f",      labelAr: "اليد اليسرى",            shape: "ellipse", cx: 328, cy: 538, rx: 36,  ry: 46  },
  { id: "pelvis_f",      labelAr: "منطقة الحوض",            shape: "ellipse", cx: 210, cy: 500, rx: 66,  ry: 38  },
  { id: "r_thigh_f",     labelAr: "الفخذ الأيمن",           shape: "rect",    x: 148,  y: 534,  w: 52,   h: 164, rx: 24 },
  { id: "l_thigh_f",     labelAr: "الفخذ الأيسر",           shape: "rect",    x: 204,  y: 534,  w: 52,   h: 164, rx: 24 },
  { id: "r_knee_f",      labelAr: "الركبة اليمنى",          shape: "ellipse", cx: 174, cy: 708, rx: 44,  ry: 35  },
  { id: "l_knee_f",      labelAr: "الركبة اليسرى",          shape: "ellipse", cx: 230, cy: 708, rx: 44,  ry: 35  },
  { id: "r_shin_f",      labelAr: "الساق اليمنى",           shape: "rect",    x: 152,  y: 742,  w: 42,   h: 172, rx: 18 },
  { id: "l_shin_f",      labelAr: "الساق اليسرى",           shape: "rect",    x: 206,  y: 742,  w: 42,   h: 172, rx: 18 },
  { id: "r_foot_f",      labelAr: "القدم اليمنى",           shape: "ellipse", cx: 162, cy: 942, rx: 48,  ry: 28  },
  { id: "l_foot_f",      labelAr: "القدم اليسرى",           shape: "ellipse", cx: 228, cy: 942, rx: 48,  ry: 28  },

  // ── BACK BODY (right half, center ~X=695) ─────────────────────────────────
  { id: "head_b",        labelAr: "الرأس (خلفي)",           shape: "ellipse", cx: 695, cy: 78,  rx: 62,  ry: 68  },
  { id: "neck_b",        labelAr: "الرقبة (خلفية)",         shape: "rect",    x: 668,  y: 145,  w: 48,   h: 40,  rx: 12 },
  { id: "r_shoulder_b",  labelAr: "الكتف الأيمن (خلفي)",   shape: "ellipse", cx: 822, cy: 194, rx: 54,  ry: 34  },
  { id: "l_shoulder_b",  labelAr: "الكتف الأيسر (خلفي)",   shape: "ellipse", cx: 568, cy: 194, rx: 54,  ry: 34  },
  { id: "upper_back",    labelAr: "أعلى الظهر",             shape: "rect",    x: 626,  y: 178,  w: 138,  h: 172, rx: 20 },
  { id: "lower_back",    labelAr: "أسفل الظهر",             shape: "rect",    x: 632,  y: 352,  w: 126,  h: 140, rx: 18 },
  { id: "r_arm_b",       labelAr: "العضد الأيمن (خلفي)",   shape: "rect",    x: 834,  y: 188,  w: 48,   h: 178, rx: 22 },
  { id: "l_arm_b",       labelAr: "العضد الأيسر (خلفي)",   shape: "rect",    x: 508,  y: 188,  w: 48,   h: 178, rx: 22 },
  { id: "r_forearm_b",   labelAr: "الساعد الأيمن (خلفي)",  shape: "rect",    x: 848,  y: 368,  w: 42,   h: 152, rx: 18 },
  { id: "l_forearm_b",   labelAr: "الساعد الأيسر (خلفي)",  shape: "rect",    x: 500,  y: 368,  w: 42,   h: 152, rx: 18 },
  { id: "r_hand_b",      labelAr: "اليد اليمنى (خلفية)",   shape: "ellipse", cx: 862, cy: 540, rx: 36,  ry: 46  },
  { id: "l_hand_b",      labelAr: "اليد اليسرى (خلفية)",   shape: "ellipse", cx: 514, cy: 540, rx: 36,  ry: 46  },
  { id: "r_buttock",     labelAr: "الأرداف الأيمن",         shape: "ellipse", cx: 728, cy: 504, rx: 64,  ry: 52  },
  { id: "l_buttock",     labelAr: "الأرداف الأيسر",         shape: "ellipse", cx: 662, cy: 504, rx: 64,  ry: 52  },
  { id: "r_thigh_b",     labelAr: "الفخذ الأيمن (خلفي)",   shape: "rect",    x: 713,  y: 534,  w: 52,   h: 164, rx: 24 },
  { id: "l_thigh_b",     labelAr: "الفخذ الأيسر (خلفي)",   shape: "rect",    x: 633,  y: 534,  w: 52,   h: 164, rx: 24 },
  { id: "r_calf",        labelAr: "بطة الساق اليمنى",       shape: "rect",    x: 714,  y: 742,  w: 42,   h: 172, rx: 18 },
  { id: "l_calf",        labelAr: "بطة الساق اليسرى",       shape: "rect",    x: 634,  y: 742,  w: 42,   h: 172, rx: 18 },
  { id: "r_heel",        labelAr: "الكعب الأيمن",           shape: "ellipse", cx: 728, cy: 942, rx: 48,  ry: 28  },
  { id: "l_heel",        labelAr: "الكعب الأيسر",           shape: "ellipse", cx: 662, cy: 942, rx: 48,  ry: 28  },
];

type Annotation = { id: string; regionId: string; label: string; color: string; notes: string | null };

function RegionEl({ r, fill, stroke, sw, dash }: {
  r: Region; fill: string; stroke: string; sw: number; dash?: string;
}) {
  const p = { fill, stroke, strokeWidth: sw, strokeDasharray: dash };
  if (r.shape === "ellipse") return <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} {...p} />;
  return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx ?? 0} {...p} />;
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
  const [selected, setSelected]       = useState<string | null>(null);
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const selRegion = REGIONS.find((r) => r.id === selected);
  const selAnn    = annotations.find((a) => a.regionId === selected) ?? null;

  function labelX(r: Region) { return r.shape === "ellipse" ? r.cx : r.x + r.w / 2; }
  function labelY(r: Region) { return r.shape === "ellipse" ? r.cy - r.ry - 14 : r.y - 14; }

  function handleSelect(id: string) {
    const same = selected === id;
    setSelected(same ? null : id);
    setNotes(same ? "" : (annotations.find((a) => a.regionId === id)?.notes ?? ""));
  }

  async function saveAnnotation(key: string) {
    if (!selected) return;
    const lesion = LESION_TYPES.find((l) => l.key === key)!;
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialtyCode, regionId: selected, label: key, color: lesion.color, notes: notes || null }),
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
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 700 }}>
        🩹 انقر على أي منطقة من الجسم لتأشير الإصابة الجلدية — الأمامي على اليسار، الخلفي على اليمين
      </p>

      {/* Image + SVG overlay */}
      <div style={{
        position: "relative", width: "100%", paddingBottom: "116.5%",
        borderRadius: 14, overflow: "hidden",
        border: "1px solid #e2e8f0", background: "white",
      }}>
        <Image
          src="/body-map.png"
          alt="خريطة الجسم البشري — أمامي وخلفي"
          fill
          style={{ objectFit: "contain" }}
          priority
        />

        <svg
          viewBox="0 0 960 1118"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
        >
          {/* Divider label */}
          <text x={480} y={30} textAnchor="middle" fontSize={22} fontWeight={900} fill="#94a3b8" opacity={0.7}>
            أمامي ◀──────────────────────────────── خلفي
          </text>

          {REGIONS.map((region) => {
            const ann  = annotations.find((a) => a.regionId === region.id) ?? null;
            const isSel = selected === region.id;
            return (
              <g key={region.id} onClick={() => handleSelect(region.id)} style={{ cursor: "pointer" }}>
                <RegionEl r={region} fill={ann ? ann.color + "44" : "transparent"} stroke="transparent" sw={0} />
                {isSel && (
                  <RegionEl r={region} fill={ann ? ann.color + "44" : "#1e3a8a18"} stroke="#1e3a8a" sw={3} dash="8 4" />
                )}
                {isSel && (
                  <>
                    <rect
                      x={labelX(region) - 90} y={labelY(region) - 26}
                      width={180} height={30} rx={7}
                      fill="#1e3a8a" opacity={0.92}
                    />
                    <text x={labelX(region)} y={labelY(region) - 7}
                      textAnchor="middle" fontSize={18} fontWeight={900} fill="white">
                      {region.labelAr}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
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
      {selected && selRegion && (
        <div style={{ marginTop: 14, background: "white", borderRadius: 14, border: "1.5px solid #dbeafe", padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#1e3a8a", marginBottom: 10 }}>
            {selRegion.labelAr} — اختر نوع الإصابة:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {LESION_TYPES.map((t) => (
              <button key={t.key} onClick={() => saveAnnotation(t.key)} disabled={saving}
                style={{
                  padding: "6px 14px", borderRadius: 20, background: t.color,
                  color: "white", fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1,
                }}>
                {t.labelAr}
              </button>
            ))}
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظة عن الإصابة (اختياري)"
            style={{ width: "100%", padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: "border-box" }}
          />
          {selAnn && (
            <button onClick={clearAnnotation} disabled={saving}
              style={{ padding: "5px 14px", borderRadius: 20, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", cursor: "pointer" }}>
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
              const region = REGIONS.find((r) => r.id === a.regionId);
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
