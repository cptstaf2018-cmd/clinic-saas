"use client";

import { useState } from "react";

const CONDITION_TYPES = [
  { key: "pain_acute",    labelAr: "ألم حاد",        color: "#ef4444" },
  { key: "pain_chronic",  labelAr: "ألم مزمن",        color: "#f97316" },
  { key: "fracture",      labelAr: "كسر",             color: "#dc2626" },
  { key: "arthritis",     labelAr: "التهاب مفصل",     color: "#8b5cf6" },
  { key: "injury",        labelAr: "إصابة رياضية",    color: "#3b82f6" },
  { key: "degeneration",  labelAr: "تدهور / فقرات",   color: "#92400e" },
  { key: "post_op",       labelAr: "ما بعد العملية",  color: "#10b981" },
  { key: "other",         labelAr: "أخرى",            color: "#6b7280" },
];

type ShapeEllipse = { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number };
type ShapeRect = { shape: "rect"; x: number; y: number; w: number; h: number; rx?: number };
type Region = { id: string; labelAr: string } & (ShapeEllipse | ShapeRect);

const SKELETON_REGIONS: Region[] = [
  { id: "skull",          labelAr: "الجمجمة",                 shape: "ellipse", cx: 130, cy: 36,  rx: 38, ry: 32 },
  { id: "jaw",            labelAr: "الفك السفلي",             shape: "ellipse", cx: 130, cy: 70,  rx: 22, ry: 10 },
  { id: "cervical",       labelAr: "الفقرات العنقية",          shape: "rect",    x: 122,  y: 78,   w: 16,  h: 30,  rx: 5 },
  { id: "left_clavicle",  labelAr: "الترقوة اليسرى",          shape: "rect",    x: 66,   y: 104,  w: 54,  h: 10,  rx: 5 },
  { id: "right_clavicle", labelAr: "الترقوة اليمنى",          shape: "rect",    x: 140,  y: 104,  w: 54,  h: 10,  rx: 5 },
  { id: "thoracic",       labelAr: "الفقرات الصدرية",          shape: "rect",    x: 122,  y: 108,  w: 16,  h: 76,  rx: 5 },
  { id: "ribcage",        labelAr: "القفص الصدري",            shape: "ellipse", cx: 130, cy: 157, rx: 50, ry: 54 },
  { id: "lumbar",         labelAr: "الفقرات القطنية",          shape: "rect",    x: 122,  y: 184,  w: 16,  h: 44,  rx: 5 },
  { id: "pelvis",         labelAr: "الحوض",                   shape: "ellipse", cx: 130, cy: 240, rx: 52, ry: 28 },
  { id: "left_shoulder",  labelAr: "مفصل الكتف الأيسر",       shape: "ellipse", cx: 76,  cy: 108, rx: 22, ry: 18 },
  { id: "right_shoulder", labelAr: "مفصل الكتف الأيمن",       shape: "ellipse", cx: 184, cy: 108, rx: 22, ry: 18 },
  { id: "left_humerus",   labelAr: "عظمة العضد الأيسر",       shape: "rect",    x: 59,   y: 124,  w: 18,  h: 76,  rx: 8 },
  { id: "right_humerus",  labelAr: "عظمة العضد الأيمن",       shape: "rect",    x: 183,  y: 124,  w: 18,  h: 76,  rx: 8 },
  { id: "left_elbow",     labelAr: "مفصل الكوع الأيسر",       shape: "ellipse", cx: 68,  cy: 208, rx: 14, ry: 10 },
  { id: "right_elbow",    labelAr: "مفصل الكوع الأيمن",       shape: "ellipse", cx: 192, cy: 208, rx: 14, ry: 10 },
  { id: "left_radius",    labelAr: "عظام الساعد الأيسر",      shape: "rect",    x: 57,   y: 218,  w: 16,  h: 70,  rx: 7 },
  { id: "right_radius",   labelAr: "عظام الساعد الأيمن",      shape: "rect",    x: 187,  y: 218,  w: 16,  h: 70,  rx: 7 },
  { id: "left_wrist",     labelAr: "مفصل الرسغ الأيسر",       shape: "ellipse", cx: 65,  cy: 296, rx: 14, ry: 8 },
  { id: "right_wrist",    labelAr: "مفصل الرسغ الأيمن",       shape: "ellipse", cx: 195, cy: 296, rx: 14, ry: 8 },
  { id: "left_hip",       labelAr: "مفصل الورك الأيسر",       shape: "ellipse", cx: 107, cy: 256, rx: 24, ry: 22 },
  { id: "right_hip",      labelAr: "مفصل الورك الأيمن",       shape: "ellipse", cx: 153, cy: 256, rx: 24, ry: 22 },
  { id: "left_femur",     labelAr: "عظمة الفخذ اليسرى",       shape: "rect",    x: 96,   y: 278,  w: 22,  h: 96,  rx: 9 },
  { id: "right_femur",    labelAr: "عظمة الفخذ اليمنى",       shape: "rect",    x: 142,  y: 278,  w: 22,  h: 96,  rx: 9 },
  { id: "left_knee",      labelAr: "مفصل الركبة اليسرى",      shape: "ellipse", cx: 107, cy: 382, rx: 20, ry: 15 },
  { id: "right_knee",     labelAr: "مفصل الركبة اليمنى",      shape: "ellipse", cx: 153, cy: 382, rx: 20, ry: 15 },
  { id: "left_tibia",     labelAr: "عظمة الساق اليسرى",       shape: "rect",    x: 97,   y: 397,  w: 20,  h: 82,  rx: 8 },
  { id: "right_tibia",    labelAr: "عظمة الساق اليمنى",       shape: "rect",    x: 143,  y: 397,  w: 20,  h: 82,  rx: 8 },
  { id: "left_ankle",     labelAr: "مفصل الكاحل الأيسر",      shape: "ellipse", cx: 107, cy: 486, rx: 16, ry: 11 },
  { id: "right_ankle",    labelAr: "مفصل الكاحل الأيمن",      shape: "ellipse", cx: 153, cy: 486, rx: 16, ry: 11 },
  { id: "left_foot_bone", labelAr: "عظام القدم اليسرى",       shape: "ellipse", cx: 107, cy: 510, rx: 27, ry: 15 },
  { id: "right_foot_bone",labelAr: "عظام القدم اليمنى",       shape: "ellipse", cx: 153, cy: 510, rx: 27, ry: 15 },
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
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedRegion = SKELETON_REGIONS.find((r) => r.id === selected);
  const selectedAnnotation = annotations.find((a) => a.regionId === selected) ?? null;

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
      body: JSON.stringify({
        specialtyCode,
        regionId: selected,
        label: conditionKey,
        color: cond.color,
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
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 700 }}>
        🦴 انقر على أي عظمة أو مفصل لتحديد الحالة
      </p>

      {/* Skeleton SVG */}
      <div style={{
        background: "white", borderRadius: 14, border: "1px solid #e2e8f0",
        padding: "12px 8px", userSelect: "none",
      }}>
        <svg viewBox="0 0 260 534" style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}>
          {/* Skeleton background shapes */}
          {/* skull */}
          <ellipse cx="130" cy="36" rx="38" ry="32" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="130" cy="70" rx="22" ry="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* spine */}
          <rect x="122" y="78" width="16" height="152" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* clavicles */}
          <rect x="66" y="104" width="54" height="10" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="140" y="104" width="54" height="10" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* ribcage */}
          <ellipse cx="130" cy="157" rx="50" ry="54" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* pelvis */}
          <ellipse cx="130" cy="240" rx="52" ry="28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* shoulders */}
          <ellipse cx="76" cy="108" rx="22" ry="18" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="184" cy="108" rx="22" ry="18" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* arms */}
          <rect x="59" y="124" width="18" height="76" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="183" y="124" width="18" height="76" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* elbows */}
          <ellipse cx="68" cy="208" rx="14" ry="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="192" cy="208" rx="14" ry="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* forearms */}
          <rect x="57" y="218" width="16" height="70" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="187" y="218" width="16" height="70" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* wrists */}
          <ellipse cx="65" cy="296" rx="14" ry="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="195" cy="296" rx="14" ry="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* hips */}
          <ellipse cx="107" cy="256" rx="24" ry="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="153" cy="256" rx="24" ry="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* femurs */}
          <rect x="96" y="278" width="22" height="96" rx="9" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="142" y="278" width="22" height="96" rx="9" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* knees */}
          <ellipse cx="107" cy="382" rx="20" ry="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="153" cy="382" rx="20" ry="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* tibias */}
          <rect x="97" y="397" width="20" height="82" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="143" y="397" width="20" height="82" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* ankles */}
          <ellipse cx="107" cy="486" rx="16" ry="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="153" cy="486" rx="16" ry="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* feet */}
          <ellipse cx="107" cy="510" rx="27" ry="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <ellipse cx="153" cy="510" rx="27" ry="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* clickable regions */}
          {SKELETON_REGIONS.map((region) => {
            const ann = annotations.find((a) => a.regionId === region.id) ?? null;
            const isSel = selected === region.id;
            return (
              <g key={region.id} onClick={() => handleSelect(region.id)} style={{ cursor: "pointer" }}>
                <RegionShape
                  region={region}
                  fill={ann ? ann.color + "55" : "transparent"}
                  stroke={isSel ? "#1e3a8a" : "transparent"}
                  strokeWidth={isSel ? 2.5 : 0}
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
            placeholder="ملاحظة تشخيصية (اختياري)"
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
              const cond = CONDITION_TYPES.find((c) => c.key === a.label);
              const region = SKELETON_REGIONS.find((r) => r.id === a.regionId);
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
