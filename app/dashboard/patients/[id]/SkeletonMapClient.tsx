"use client";

import { useState } from "react";
import Image from "next/image";

const CONDITION_TYPES = [
  { key: "pain_acute",   labelAr: "ألم حاد",        color: "#ef4444" },
  { key: "pain_chronic", labelAr: "ألم مزمن",        color: "#f97316" },
  { key: "fracture",     labelAr: "كسر",             color: "#dc2626" },
  { key: "arthritis",    labelAr: "التهاب مفصل",     color: "#8b5cf6" },
  { key: "injury",       labelAr: "إصابة رياضية",    color: "#3b82f6" },
  { key: "degeneration", labelAr: "تدهور / فقرات",   color: "#92400e" },
  { key: "post_op",      labelAr: "ما بعد العملية",  color: "#10b981" },
  { key: "other",        labelAr: "أخرى",            color: "#6b7280" },
];

// Calibrated precisely on the 960×1856 Wikimedia skeleton image
type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

// ── FRONT VIEW — measured on actual 960×1856 image ───────────────────────────
const FRONT_REGIONS: Region[] = [
  // Head
  { id: "skull",           labelAr: "الجمجمة",              shape: "ellipse", cx: 480, cy: 148, rx: 122, ry: 94  },
  { id: "jaw",             labelAr: "الفك السفلي",          shape: "ellipse", cx: 480, cy: 278, rx: 72,  ry: 30  },
  // Spine
  { id: "cervical",        labelAr: "الفقرات العنقية",      shape: "rect",    x: 440,  y: 302,  w: 80,   h: 96,  rx: 14 },
  { id: "thoracic",        labelAr: "الفقرات الصدرية",      shape: "rect",    x: 448,  y: 396,  w: 64,   h: 390, rx: 10 },
  { id: "lumbar",          labelAr: "الفقرات القطنية",      shape: "rect",    x: 448,  y: 786,  w: 64,   h: 178, rx: 10 },
  // Chest
  { id: "left_clavicle",   labelAr: "الترقوة اليسرى",      shape: "rect",    x: 162,  y: 388,  w: 316,  h: 44,  rx: 20 },
  { id: "right_clavicle",  labelAr: "الترقوة اليمنى",      shape: "rect",    x: 482,  y: 388,  w: 316,  h: 44,  rx: 20 },
  { id: "ribcage",         labelAr: "القفص الصدري",         shape: "ellipse", cx: 480, cy: 540, rx: 318, ry: 210 },
  // Shoulders
  { id: "left_shoulder",   labelAr: "مفصل الكتف الأيسر",   shape: "ellipse", cx: 140, cy: 388, rx: 92,  ry: 72  },
  { id: "right_shoulder",  labelAr: "مفصل الكتف الأيمن",   shape: "ellipse", cx: 820, cy: 388, rx: 92,  ry: 72  },
  // Upper arms
  { id: "left_humerus",    labelAr: "عظمة العضد الأيسر",   shape: "rect",    x: 100,  y: 482,  w: 84,   h: 336, rx: 38 },
  { id: "right_humerus",   labelAr: "عظمة العضد الأيمن",   shape: "rect",    x: 776,  y: 482,  w: 84,   h: 336, rx: 38 },
  // Elbows
  { id: "left_elbow",      labelAr: "مفصل الكوع الأيسر",   shape: "ellipse", cx: 142, cy: 778, rx: 64,  ry: 48  },
  { id: "right_elbow",     labelAr: "مفصل الكوع الأيمن",   shape: "ellipse", cx: 818, cy: 778, rx: 64,  ry: 48  },
  // Forearms
  { id: "left_radius",     labelAr: "عظام الساعد الأيسر",  shape: "rect",    x: 96,   y: 876,  w: 74,   h: 258, rx: 34 },
  { id: "right_radius",    labelAr: "عظام الساعد الأيمن",  shape: "rect",    x: 790,  y: 876,  w: 74,   h: 258, rx: 34 },
  // Wrists
  { id: "left_wrist",      labelAr: "مفصل الرسغ الأيسر",   shape: "ellipse", cx: 133, cy: 1042, rx: 58, ry: 38  },
  { id: "right_wrist",     labelAr: "مفصل الرسغ الأيمن",   shape: "ellipse", cx: 827, cy: 1042, rx: 58, ry: 38  },
  // Pelvis
  { id: "pelvis",          labelAr: "الحوض",                shape: "ellipse", cx: 480, cy: 946,  rx: 232, ry: 80 },
  { id: "left_hip",        labelAr: "مفصل الورك الأيسر",   shape: "ellipse", cx: 296, cy: 994,  rx: 102, ry: 96 },
  { id: "right_hip",       labelAr: "مفصل الورك الأيمن",   shape: "ellipse", cx: 664, cy: 994,  rx: 102, ry: 96 },
  // Thighs
  { id: "left_femur",      labelAr: "عظمة الفخذ اليسرى",   shape: "rect",    x: 238,  y: 1164, w: 114,  h: 336, rx: 50 },
  { id: "right_femur",     labelAr: "عظمة الفخذ اليمنى",   shape: "rect",    x: 608,  y: 1164, w: 114,  h: 336, rx: 50 },
  // Knees
  { id: "left_knee",       labelAr: "مفصل الركبة اليسرى",  shape: "ellipse", cx: 296, cy: 1414, rx: 70,  ry: 56  },
  { id: "right_knee",      labelAr: "مفصل الركبة اليمنى",  shape: "ellipse", cx: 664, cy: 1414, rx: 70,  ry: 56  },
  // Lower legs
  { id: "left_tibia",      labelAr: "عظمة الساق اليسرى",   shape: "rect",    x: 242,  y: 1564, w: 108,  h: 204, rx: 44 },
  { id: "right_tibia",     labelAr: "عظمة الساق اليمنى",   shape: "rect",    x: 610,  y: 1564, w: 108,  h: 204, rx: 44 },
  // Ankles
  { id: "left_ankle",      labelAr: "مفصل الكاحل الأيسر",  shape: "ellipse", cx: 294, cy: 1678, rx: 78,  ry: 48  },
  { id: "right_ankle",     labelAr: "مفصل الكاحل الأيمن",  shape: "ellipse", cx: 666, cy: 1678, rx: 78,  ry: 48  },
  // Feet
  { id: "left_foot",       labelAr: "عظام القدم اليسرى",   shape: "ellipse", cx: 266, cy: 1720, rx: 110, ry: 46  },
  { id: "right_foot",      labelAr: "عظام القدم اليمنى",   shape: "ellipse", cx: 694, cy: 1720, rx: 110, ry: 46  },
];

// ── BACK VIEW — measured on actual 960×1856 back image ───────────────────────
const BACK_REGIONS: Region[] = [
  // Head
  { id: "skull_b",          labelAr: "الجمجمة (خلفي)",     shape: "ellipse", cx: 480, cy: 148, rx: 122, ry: 94  },
  // Spine (very prominent from back)
  { id: "cervical_b",       labelAr: "الفقرات العنقية",    shape: "rect",    x: 440,  y: 302,  w: 80,   h: 96,  rx: 14 },
  { id: "thoracic_b",       labelAr: "الفقرات الصدرية",    shape: "rect",    x: 442,  y: 396,  w: 76,   h: 390, rx: 10 },
  { id: "lumbar_b",         labelAr: "الفقرات القطنية",    shape: "rect",    x: 442,  y: 786,  w: 76,   h: 178, rx: 10 },
  { id: "sacrum",           labelAr: "العجز والعصعص",      shape: "ellipse", cx: 480, cy: 870,  rx: 76,  ry: 86  },
  // Scapulas (visible from back only)
  { id: "left_scapula",     labelAr: "لوح الكتف الأيسر",  shape: "ellipse", cx: 220, cy: 448,  rx: 138, ry: 160 },
  { id: "right_scapula",    labelAr: "لوح الكتف الأيمن",  shape: "ellipse", cx: 740, cy: 448,  rx: 138, ry: 160 },
  // Clavicles
  { id: "left_clavicle_b",  labelAr: "الترقوة اليسرى",    shape: "rect",    x: 162,  y: 388,  w: 316,  h: 44,  rx: 20 },
  { id: "right_clavicle_b", labelAr: "الترقوة اليمنى",    shape: "rect",    x: 482,  y: 388,  w: 316,  h: 44,  rx: 20 },
  // Ribcage (from back)
  { id: "ribcage_b",        labelAr: "القفص الصدري",       shape: "ellipse", cx: 480, cy: 540,  rx: 318, ry: 210 },
  // Shoulders
  { id: "left_shoulder_b",  labelAr: "مفصل الكتف الأيسر", shape: "ellipse", cx: 140, cy: 388,  rx: 92,  ry: 72  },
  { id: "right_shoulder_b", labelAr: "مفصل الكتف الأيمن", shape: "ellipse", cx: 820, cy: 388,  rx: 92,  ry: 72  },
  // Arms
  { id: "left_humerus_b",   labelAr: "عظمة العضد الأيسر", shape: "rect",    x: 100,  y: 482,  w: 84,   h: 336, rx: 38 },
  { id: "right_humerus_b",  labelAr: "عظمة العضد الأيمن", shape: "rect",    x: 776,  y: 482,  w: 84,   h: 336, rx: 38 },
  { id: "left_elbow_b",     labelAr: "مفصل الكوع الأيسر", shape: "ellipse", cx: 142, cy: 778,  rx: 64,  ry: 48  },
  { id: "right_elbow_b",    labelAr: "مفصل الكوع الأيمن", shape: "ellipse", cx: 818, cy: 778,  rx: 64,  ry: 48  },
  { id: "left_radius_b",    labelAr: "ساعد أيسر",          shape: "rect",    x: 96,   y: 876,  w: 74,   h: 258, rx: 34 },
  { id: "right_radius_b",   labelAr: "ساعد أيمن",          shape: "rect",    x: 790,  y: 876,  w: 74,   h: 258, rx: 34 },
  // Pelvis & hips
  { id: "pelvis_b",         labelAr: "الحوض",              shape: "ellipse", cx: 480, cy: 946,  rx: 232, ry: 80  },
  { id: "left_buttock",     labelAr: "الأرداف الأيسر",    shape: "ellipse", cx: 340, cy: 950,  rx: 130, ry: 90  },
  { id: "right_buttock",    labelAr: "الأرداف الأيمن",    shape: "ellipse", cx: 620, cy: 950,  rx: 130, ry: 90  },
  // Thighs
  { id: "left_femur_b",     labelAr: "فخذ أيسر (خلفي)",   shape: "rect",    x: 238,  y: 1164, w: 114,  h: 336, rx: 50 },
  { id: "right_femur_b",    labelAr: "فخذ أيمن (خلفي)",   shape: "rect",    x: 608,  y: 1164, w: 114,  h: 336, rx: 50 },
  // Knees
  { id: "left_knee_b",      labelAr: "الركبة اليسرى",     shape: "ellipse", cx: 296, cy: 1414, rx: 70,  ry: 56  },
  { id: "right_knee_b",     labelAr: "الركبة اليمنى",     shape: "ellipse", cx: 664, cy: 1414, rx: 70,  ry: 56  },
  // Lower legs (calves from back)
  { id: "left_calf",        labelAr: "بطة الساق اليسرى",  shape: "rect",    x: 242,  y: 1564, w: 108,  h: 204, rx: 44 },
  { id: "right_calf",       labelAr: "بطة الساق اليمنى",  shape: "rect",    x: 610,  y: 1564, w: 108,  h: 204, rx: 44 },
  // Heels/Calcaneus
  { id: "left_heel",        labelAr: "الكعب الأيسر",      shape: "ellipse", cx: 286, cy: 1692, rx: 76,  ry: 46  },
  { id: "right_heel",       labelAr: "الكعب الأيمن",      shape: "ellipse", cx: 674, cy: 1692, rx: 76,  ry: 46  },
  // Feet
  { id: "left_foot_b",      labelAr: "عظام القدم اليسرى", shape: "ellipse", cx: 268, cy: 1720, rx: 108, ry: 44  },
  { id: "right_foot_b",     labelAr: "عظام القدم اليمنى", shape: "ellipse", cx: 692, cy: 1720, rx: 108, ry: 44  },
];

type Annotation = { id: string; regionId: string; label: string; color: string; notes: string | null };

function RegionEl({ region, fill, stroke, sw, dash }: {
  region: Region; fill: string; stroke: string; sw: number; dash?: string;
}) {
  const p = { fill, stroke, strokeWidth: sw, strokeDasharray: dash };
  if (region.shape === "ellipse")
    return <ellipse cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...p} />;
  return <rect x={region.x} y={region.y} width={region.w} height={region.h} rx={region.rx ?? 0} {...p} />;
}

export default function SkeletonMapClient({
  patientId,
  specialtyCode,
  initialAnnotations,
}: {
  patientId: string;
  specialtyCode: string;
  initialAnnotations: Annotation[];
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [view, setView]               = useState<"front" | "back">("front");
  const [selected, setSelected]       = useState<string | null>(null);
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const regions     = view === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const selRegion   = regions.find((r) => r.id === selected);
  const selAnn      = annotations.find((a) => a.regionId === selected) ?? null;

  function labelX(r: Region) { return r.shape === "ellipse" ? r.cx : r.x + r.w / 2; }
  function labelY(r: Region) { return r.shape === "ellipse" ? r.cy - r.ry - 18 : r.y - 18; }

  function handleSelect(id: string) {
    const same = selected === id;
    setSelected(same ? null : id);
    setNotes(same ? "" : (annotations.find((a) => a.regionId === id)?.notes ?? ""));
  }

  async function saveAnnotation(key: string) {
    if (!selected) return;
    const cond = CONDITION_TYPES.find((c) => c.key === key)!;
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialtyCode, regionId: selected, label: key, color: cond.color, notes: notes || null }),
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
      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        {(["front", "back"] as const).map((v) => (
          <button key={v}
            onClick={() => { setView(v); setSelected(null); setNotes(""); }}
            style={{
              padding: "6px 18px", borderRadius: 20, fontSize: 13, fontWeight: 800,
              background: view === v ? "#1e3a8a" : "#f1f5f9",
              color: view === v ? "white" : "#475569",
              border: "none", cursor: "pointer",
            }}>
            {v === "front" ? "🦴 منظر أمامي" : "🫀 منظر خلفي"}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginRight: "auto" }}>
          انقر على أي منطقة لتأشير الحالة
        </span>
      </div>

      {/* Image + SVG overlay */}
      <div style={{
        position: "relative", width: "100%", paddingBottom: "193.3%",
        borderRadius: 14, overflow: "hidden",
        border: "1px solid #e2e8f0", background: "white",
      }}>
        <Image
          src={view === "front" ? "/skeleton-front.png" : "/skeleton-back.png"}
          alt={view === "front" ? "هيكل عظمي أمامي" : "هيكل عظمي خلفي"}
          fill
          style={{ objectFit: "contain" }}
          priority
        />

        <svg
          viewBox="0 0 960 1856"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
        >
          {regions.map((region) => {
            const ann  = annotations.find((a) => a.regionId === region.id) ?? null;
            const isSel = selected === region.id;
            return (
              <g key={region.id} onClick={() => handleSelect(region.id)} style={{ cursor: "pointer" }}>
                {/* colour overlay when annotated */}
                <RegionEl region={region} fill={ann ? ann.color + "40" : "transparent"} stroke="transparent" sw={0} />
                {/* selection border */}
                {isSel && (
                  <RegionEl region={region} fill={ann ? ann.color + "40" : "#1e3a8a18"} stroke="#1e3a8a" sw={4} dash="10 5" />
                )}
                {/* label above selected region */}
                {isSel && (
                  <>
                    <rect
                      x={labelX(region) - 100} y={labelY(region) - 28}
                      width={200} height={34} rx={8}
                      fill="#1e3a8a" opacity={0.9}
                    />
                    <text
                      x={labelX(region)} y={labelY(region) - 6}
                      textAnchor="middle" fontSize={22} fontWeight={900} fill="white"
                    >
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
        {CONDITION_TYPES.map((t) => (
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
            {selRegion.labelAr} — اختر نوع الحالة:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {CONDITION_TYPES.map((t) => (
              <button key={t.key} onClick={() => saveAnnotation(t.key)} disabled={saving}
                style={{
                  padding: "6px 14px", borderRadius: 20, background: t.color, color: "white",
                  fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer",
                  opacity: saving ? 0.6 : 1,
                }}>
                {t.labelAr}
              </button>
            ))}
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظة تشخيصية (اختياري)"
            style={{ width: "100%", padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: "border-box" }}
          />
          {selAnn && (
            <button onClick={clearAnnotation} disabled={saving}
              style={{ padding: "5px 14px", borderRadius: 20, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", cursor: "pointer" }}>
              مسح الحالة
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {annotations.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 8 }}>ملخص الحالات:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {annotations.map((a) => {
              const cond   = CONDITION_TYPES.find((c) => c.key === a.label);
              const region = [...FRONT_REGIONS, ...BACK_REGIONS].find((r) => r.id === a.regionId);
              return (
                <span key={a.id} style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: (cond?.color ?? "#6b7280") + "20",
                  color: cond?.color ?? "#6b7280",
                  fontSize: 11, fontWeight: 800,
                  border: `1px solid ${(cond?.color ?? "#6b7280")}40`,
                }}>
                  {region?.labelAr ?? a.regionId} — {cond?.labelAr ?? a.label}
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
