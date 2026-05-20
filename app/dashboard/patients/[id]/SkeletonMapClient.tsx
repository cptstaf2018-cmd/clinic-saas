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

// Calibrated for Wikimedia 960×1856 image
type Region = {
  id: string;
  labelAr: string;
  front?: boolean; // show only on front view (default true)
  back?: boolean;  // show only on back view
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const FRONT_REGIONS: Region[] = [
  // ── Head ──────────────────────────────────────────────────────────────────
  { id: "skull",          labelAr: "الجمجمة",              shape: "ellipse", cx: 480, cy: 175,  rx: 135, ry: 150 },
  { id: "jaw",            labelAr: "الفك السفلي",          shape: "ellipse", cx: 480, cy: 345,  rx: 90,  ry: 55  },
  // ── Spine ─────────────────────────────────────────────────────────────────
  { id: "cervical",       labelAr: "الفقرات العنقية",      shape: "rect",    x: 445,  y: 390,   w: 70,   h: 120, rx: 15 },
  { id: "thoracic",       labelAr: "الفقرات الصدرية",      shape: "rect",    x: 450,  y: 510,   w: 60,   h: 330, rx: 12 },
  { id: "lumbar",         labelAr: "الفقرات القطنية",      shape: "rect",    x: 450,  y: 840,   w: 60,   h: 150, rx: 12 },
  // ── Chest ─────────────────────────────────────────────────────────────────
  { id: "left_clavicle",  labelAr: "الترقوة اليسرى",      shape: "rect",    x: 290,  y: 445,   w: 168,  h: 36,  rx: 18 },
  { id: "right_clavicle", labelAr: "الترقوة اليمنى",      shape: "rect",    x: 502,  y: 445,   w: 168,  h: 36,  rx: 18 },
  { id: "ribcage",        labelAr: "القفص الصدري",         shape: "ellipse", cx: 480, cy: 670,  rx: 190, ry: 215 },
  // ── Shoulders ─────────────────────────────────────────────────────────────
  { id: "left_shoulder",  labelAr: "مفصل الكتف الأيسر",   shape: "ellipse", cx: 255, cy: 460,  rx: 75,  ry: 65  },
  { id: "right_shoulder", labelAr: "مفصل الكتف الأيمن",   shape: "ellipse", cx: 705, cy: 460,  rx: 75,  ry: 65  },
  // ── Arms ──────────────────────────────────────────────────────────────────
  { id: "left_humerus",   labelAr: "عظمة العضد الأيسر",   shape: "rect",    x: 185,  y: 510,   w: 66,   h: 270, rx: 30 },
  { id: "right_humerus",  labelAr: "عظمة العضد الأيمن",   shape: "rect",    x: 709,  y: 510,   w: 66,   h: 270, rx: 30 },
  { id: "left_elbow",     labelAr: "مفصل الكوع الأيسر",   shape: "ellipse", cx: 215, cy: 800,  rx: 52,  ry: 40  },
  { id: "right_elbow",    labelAr: "مفصل الكوع الأيمن",   shape: "ellipse", cx: 745, cy: 800,  rx: 52,  ry: 40  },
  { id: "left_radius",    labelAr: "عظام الساعد الأيسر",  shape: "rect",    x: 165,  y: 840,   w: 60,   h: 250, rx: 25 },
  { id: "right_radius",   labelAr: "عظام الساعد الأيمن",  shape: "rect",    x: 735,  y: 840,   w: 60,   h: 250, rx: 25 },
  { id: "left_wrist",     labelAr: "مفصل الرسغ الأيسر",   shape: "ellipse", cx: 196, cy: 1105, rx: 48,  ry: 30  },
  { id: "right_wrist",    labelAr: "مفصل الرسغ الأيمن",   shape: "ellipse", cx: 764, cy: 1105, rx: 48,  ry: 30  },
  // ── Pelvis ────────────────────────────────────────────────────────────────
  { id: "pelvis",         labelAr: "الحوض",                shape: "ellipse", cx: 480, cy: 1005, rx: 198, ry: 110 },
  { id: "left_hip",       labelAr: "مفصل الورك الأيسر",   shape: "ellipse", cx: 356, cy: 1045, rx: 88,  ry: 80  },
  { id: "right_hip",      labelAr: "مفصل الورك الأيمن",   shape: "ellipse", cx: 604, cy: 1045, rx: 88,  ry: 80  },
  // ── Legs ──────────────────────────────────────────────────────────────────
  { id: "left_femur",     labelAr: "عظمة الفخذ اليسرى",   shape: "rect",    x: 306,  y: 1110,  w: 100,  h: 320, rx: 40 },
  { id: "right_femur",    labelAr: "عظمة الفخذ اليمنى",   shape: "rect",    x: 554,  y: 1110,  w: 100,  h: 320, rx: 40 },
  { id: "left_knee",      labelAr: "مفصل الركبة اليسرى",  shape: "ellipse", cx: 358, cy: 1455, rx: 82,  ry: 60  },
  { id: "right_knee",     labelAr: "مفصل الركبة اليمنى",  shape: "ellipse", cx: 602, cy: 1455, rx: 82,  ry: 60  },
  { id: "left_tibia",     labelAr: "عظمة الساق اليسرى",   shape: "rect",    x: 310,  y: 1510,  w: 90,   h: 280, rx: 35 },
  { id: "right_tibia",    labelAr: "عظمة الساق اليمنى",   shape: "rect",    x: 558,  y: 1510,  w: 90,   h: 280, rx: 35 },
  { id: "left_ankle",     labelAr: "مفصل الكاحل الأيسر",  shape: "ellipse", cx: 354, cy: 1810, rx: 70,  ry: 42  },
  { id: "right_ankle",    labelAr: "مفصل الكاحل الأيمن",  shape: "ellipse", cx: 606, cy: 1810, rx: 70,  ry: 42  },
  { id: "left_foot",      labelAr: "عظام القدم اليسرى",   shape: "ellipse", cx: 332, cy: 1848, rx: 98,  ry: 36  },
  { id: "right_foot",     labelAr: "عظام القدم اليمنى",   shape: "ellipse", cx: 628, cy: 1848, rx: 98,  ry: 36  },
];

const BACK_REGIONS: Region[] = [
  { id: "skull_b",         labelAr: "الجمجمة (خلفي)",      shape: "ellipse", cx: 480, cy: 175,  rx: 135, ry: 150 },
  { id: "cervical_b",      labelAr: "الفقرات العنقية",     shape: "rect",    x: 445,  y: 390,   w: 70,   h: 120, rx: 15 },
  { id: "left_scapula",    labelAr: "لوح الكتف الأيسر",   shape: "ellipse", cx: 290, cy: 590,  rx: 110, ry: 130 },
  { id: "right_scapula",   labelAr: "لوح الكتف الأيمن",   shape: "ellipse", cx: 670, cy: 590,  rx: 110, ry: 130 },
  { id: "thoracic_b",      labelAr: "الفقرات الصدرية",     shape: "rect",    x: 435,  y: 510,   w: 90,   h: 330, rx: 12 },
  { id: "lumbar_b",        labelAr: "الفقرات القطنية",     shape: "rect",    x: 440,  y: 840,   w: 80,   h: 150, rx: 12 },
  { id: "left_shoulder_b", labelAr: "مفصل الكتف الأيسر",  shape: "ellipse", cx: 255, cy: 460,  rx: 75,  ry: 65  },
  { id: "right_shoulder_b",labelAr: "مفصل الكتف الأيمن",  shape: "ellipse", cx: 705, cy: 460,  rx: 75,  ry: 65  },
  { id: "left_humerus_b",  labelAr: "عظمة العضد الأيسر",  shape: "rect",    x: 185,  y: 510,   w: 66,   h: 270, rx: 30 },
  { id: "right_humerus_b", labelAr: "عظمة العضد الأيمن",  shape: "rect",    x: 709,  y: 510,   w: 66,   h: 270, rx: 30 },
  { id: "left_elbow_b",    labelAr: "مفصل الكوع الأيسر",  shape: "ellipse", cx: 215, cy: 800,  rx: 52,  ry: 40  },
  { id: "right_elbow_b",   labelAr: "مفصل الكوع الأيمن",  shape: "ellipse", cx: 745, cy: 800,  rx: 52,  ry: 40  },
  { id: "left_radius_b",   labelAr: "ساعد أيسر",           shape: "rect",    x: 165,  y: 840,   w: 60,   h: 250, rx: 25 },
  { id: "right_radius_b",  labelAr: "ساعد أيمن",           shape: "rect",    x: 735,  y: 840,   w: 60,   h: 250, rx: 25 },
  { id: "sacrum",          labelAr: "العجز",                shape: "ellipse", cx: 480, cy: 940,  rx: 72,  ry: 90  },
  { id: "pelvis_b",        labelAr: "الحوض (خلفي)",        shape: "ellipse", cx: 480, cy: 1010, rx: 198, ry: 110 },
  { id: "left_buttock",    labelAr: "الأرداف الأيسر",      shape: "ellipse", cx: 380, cy: 1040, rx: 110, ry: 90  },
  { id: "right_buttock",   labelAr: "الأرداف الأيمن",      shape: "ellipse", cx: 580, cy: 1040, rx: 110, ry: 90  },
  { id: "left_femur_b",    labelAr: "فخذ أيسر (خلفي)",    shape: "rect",    x: 306,  y: 1120,  w: 100,  h: 310, rx: 40 },
  { id: "right_femur_b",   labelAr: "فخذ أيمن (خلفي)",    shape: "rect",    x: 554,  y: 1120,  w: 100,  h: 310, rx: 40 },
  { id: "left_knee_b",     labelAr: "الركبة اليسرى",       shape: "ellipse", cx: 358, cy: 1450, rx: 82,  ry: 60  },
  { id: "right_knee_b",    labelAr: "الركبة اليمنى",       shape: "ellipse", cx: 602, cy: 1450, rx: 82,  ry: 60  },
  { id: "left_calf",       labelAr: "بطة الساق اليسرى",   shape: "rect",    x: 310,  y: 1510,  w: 90,   h: 280, rx: 35 },
  { id: "right_calf",      labelAr: "بطة الساق اليمنى",   shape: "rect",    x: 558,  y: 1510,  w: 90,   h: 280, rx: 35 },
  { id: "left_heel",       labelAr: "الكعب الأيسر",        shape: "ellipse", cx: 354, cy: 1810, rx: 70,  ry: 42  },
  { id: "right_heel",      labelAr: "الكعب الأيمن",        shape: "ellipse", cx: 606, cy: 1810, rx: 70,  ry: 42  },
];

type Annotation = { id: string; regionId: string; label: string; color: string; notes: string | null };

function renderRegionShape(
  region: Region,
  fill: string,
  stroke: string,
  strokeWidth: number,
  strokeDasharray?: string
) {
  const props = { fill, stroke, strokeWidth, strokeDasharray };
  if (region.shape === "ellipse")
    return <ellipse key={region.id} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...props} />;
  return <rect key={region.id} x={region.x} y={region.y} width={region.w} height={region.h} rx={region.rx ?? 0} {...props} />;
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

  const regions        = view === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const selectedRegion = regions.find((r) => r.id === selected);
  const selectedAnn    = annotations.find((a) => a.regionId === selected) ?? null;

  function handleSelect(id: string) {
    const same = selected === id;
    setSelected(same ? null : id);
    setNotes(same ? "" : (annotations.find((a) => a.regionId === id)?.notes ?? ""));
  }

  async function saveAnnotation(conditionKey: string) {
    if (!selected) return;
    const cond = CONDITION_TYPES.find((c) => c.key === conditionKey)!;
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialtyCode, regionId: selected, label: conditionKey, color: cond.color, notes: notes || null }),
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
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
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
            {v === "front" ? "🦴 منظر أمامي" : "🫀 منظر خلفي"}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginRight: "auto" }}>
          انقر على أي عظمة أو مفصل
        </span>
      </div>

      {/* Skeleton image with SVG overlay */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "193.3%", borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", background: "white" }}>
        <Image
          src={view === "front" ? "/skeleton-front.png" : "/skeleton-back.png"}
          alt={view === "front" ? "هيكل عظمي أمامي" : "هيكل عظمي خلفي"}
          fill
          style={{ objectFit: "contain" }}
          priority
        />

        {/* Transparent SVG click overlay */}
        <svg
          viewBox="0 0 960 1856"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
        >
          {regions.map((region) => {
            const ann  = annotations.find((a) => a.regionId === region.id) ?? null;
            const isSel = selected === region.id;
            return (
              <g key={region.id} onClick={() => handleSelect(region.id)} style={{ cursor: "pointer" }}>
                {renderRegionShape(region, ann ? ann.color + "44" : "transparent", "transparent", 0)}
                {isSel && renderRegionShape(region, ann ? ann.color + "44" : "#1e3a8a22", "#1e3a8a", 3, "8 4")}
                {isSel && (
                  <text
                    x={region.shape === "ellipse" ? region.cx : region.x + region.w / 2}
                    y={region.shape === "ellipse" ? region.cy - region.ry - 10 : region.y - 10}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={900}
                    fill="#1e3a8a"
                  >
                    {region.labelAr}
                  </text>
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
      {selected && selectedRegion && (
        <div style={{ marginTop: 14, background: "white", borderRadius: 14, border: "1.5px solid #dbeafe", padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#1e3a8a", marginBottom: 10 }}>
            {selectedRegion.labelAr} — اختر نوع الحالة:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {CONDITION_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => saveAnnotation(t.key)}
                disabled={saving}
                style={{
                  padding: "6px 14px", borderRadius: 20, background: t.color,
                  color: "white", fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1,
                }}
              >
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
          {selectedAnn && (
            <button
              onClick={clearAnnotation}
              disabled={saving}
              style={{ padding: "5px 14px", borderRadius: 20, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", cursor: "pointer" }}
            >
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
                <span
                  key={a.id}
                  style={{
                    padding: "3px 10px", borderRadius: 20,
                    background: (cond?.color ?? "#6b7280") + "20",
                    color: cond?.color ?? "#6b7280",
                    fontSize: 11, fontWeight: 800,
                    border: `1px solid ${(cond?.color ?? "#6b7280")}40`,
                  }}
                >
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
