"use client";

import { useState } from "react";

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

type ShapeEllipse = { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number };
type ShapeRect    = { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number };
type ShapePath    = { shape: "path";    d: string };
type Region = { id: string; labelAr: string } & (ShapeEllipse | ShapeRect | ShapePath);

// Clickable regions — coordinates match the 280×640 viewBox
const SKELETON_REGIONS: Region[] = [
  { id: "skull",          labelAr: "الجمجمة",            shape: "ellipse", cx: 140, cy: 46,  rx: 42, ry: 46 },
  { id: "jaw",            labelAr: "الفك السفلي",        shape: "path",    d: "M108,78 Q108,98 140,100 Q172,98 172,78" },
  { id: "cervical",       labelAr: "الفقرات العنقية",    shape: "rect",    x: 130, y: 100, w: 20, h: 32, rx: 4 },
  { id: "left_clavicle",  labelAr: "الترقوة اليسرى",    shape: "path",    d: "M130,120 Q104,116 78,108" },
  { id: "right_clavicle", labelAr: "الترقوة اليمنى",    shape: "path",    d: "M150,120 Q176,116 202,108" },
  { id: "ribcage",        labelAr: "القفص الصدري",       shape: "ellipse", cx: 140, cy: 178, rx: 56, ry: 62 },
  { id: "thoracic",       labelAr: "الفقرات الصدرية",   shape: "rect",    x: 132, y: 130, w: 16, h: 88, rx: 4 },
  { id: "lumbar",         labelAr: "الفقرات القطنية",   shape: "rect",    x: 132, y: 218, w: 16, h: 48, rx: 4 },
  { id: "pelvis",         labelAr: "الحوض",              shape: "ellipse", cx: 140, cy: 280, rx: 60, ry: 36 },
  { id: "left_shoulder",  labelAr: "مفصل الكتف الأيسر", shape: "ellipse", cx: 72,  cy: 120, rx: 22, ry: 20 },
  { id: "right_shoulder", labelAr: "مفصل الكتف الأيمن", shape: "ellipse", cx: 208, cy: 120, rx: 22, ry: 20 },
  { id: "left_humerus",   labelAr: "عضد أيسر",           shape: "rect",    x: 54,  y: 136, w: 20, h: 90, rx: 9 },
  { id: "right_humerus",  labelAr: "عضد أيمن",           shape: "rect",    x: 206, y: 136, w: 20, h: 90, rx: 9 },
  { id: "left_elbow",     labelAr: "الكوع الأيسر",       shape: "ellipse", cx: 64,  cy: 232, rx: 14, ry: 11 },
  { id: "right_elbow",    labelAr: "الكوع الأيمن",       shape: "ellipse", cx: 216, cy: 232, rx: 14, ry: 11 },
  { id: "left_radius",    labelAr: "ساعد أيسر",          shape: "rect",    x: 50,  y: 242, w: 18, h: 80, rx: 8 },
  { id: "right_radius",   labelAr: "ساعد أيمن",          shape: "rect",    x: 212, y: 242, w: 18, h: 80, rx: 8 },
  { id: "left_wrist",     labelAr: "الرسغ الأيسر",       shape: "ellipse", cx: 59,  cy: 328, rx: 14, ry: 9 },
  { id: "right_wrist",    labelAr: "الرسغ الأيمن",       shape: "ellipse", cx: 221, cy: 328, rx: 14, ry: 9 },
  { id: "left_hip",       labelAr: "مفصل الورك الأيسر",  shape: "ellipse", cx: 110, cy: 306, rx: 26, ry: 24 },
  { id: "right_hip",      labelAr: "مفصل الورك الأيمن",  shape: "ellipse", cx: 170, cy: 306, rx: 26, ry: 24 },
  { id: "left_femur",     labelAr: "عظمة الفخذ اليسرى",  shape: "rect",    x: 96,  y: 328, w: 26, h: 106, rx: 11 },
  { id: "right_femur",    labelAr: "عظمة الفخذ اليمنى",  shape: "rect",    x: 158, y: 328, w: 26, h: 106, rx: 11 },
  { id: "left_knee",      labelAr: "الركبة اليسرى",      shape: "ellipse", cx: 109, cy: 442, rx: 22, ry: 17 },
  { id: "right_knee",     labelAr: "الركبة اليمنى",      shape: "ellipse", cx: 171, cy: 442, rx: 22, ry: 17 },
  { id: "left_tibia",     labelAr: "عظمة الساق اليسرى",  shape: "rect",    x: 98,  y: 458, w: 24, h: 90, rx: 9 },
  { id: "right_tibia",    labelAr: "عظمة الساق اليمنى",  shape: "rect",    x: 158, y: 458, w: 24, h: 90, rx: 9 },
  { id: "left_ankle",     labelAr: "الكاحل الأيسر",      shape: "ellipse", cx: 110, cy: 555, rx: 18, ry: 12 },
  { id: "right_ankle",    labelAr: "الكاحل الأيمن",      shape: "ellipse", cx: 170, cy: 555, rx: 18, ry: 12 },
  { id: "left_foot_bone", labelAr: "عظام القدم اليسرى",  shape: "ellipse", cx: 106, cy: 578, rx: 30, ry: 14 },
  { id: "right_foot_bone",labelAr: "عظام القدم اليمنى",  shape: "ellipse", cx: 174, cy: 578, rx: 30, ry: 14 },
];

type Annotation = { id: string; regionId: string; label: string; color: string; notes: string | null };

function RegionShape({ region, fill, stroke, strokeWidth, strokeDasharray }: {
  region: Region; fill: string; stroke: string; strokeWidth: number; strokeDasharray?: string;
}) {
  const base = { fill, stroke, strokeWidth, strokeDasharray };
  if (region.shape === "ellipse") return <ellipse cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...base} />;
  if (region.shape === "rect")   return <rect x={region.x} y={region.y} width={region.w} height={region.h} rx={region.rx ?? 0} {...base} />;
  return <path d={region.d} {...base} />;
}

// ── Anatomical Skeleton SVG Drawing ──────────────────────────────────────────
function SkeletonDrawing() {
  const bone = { fill: "#e8ecf1", stroke: "#94a3b8", strokeWidth: 1.5 };
  const cavity = { fill: "#c8cdd6" };
  const joint = { fill: "#dde2ea", stroke: "#94a3b8", strokeWidth: 1.2 };

  return (
    <>
      {/* ── SKULL ── */}
      {/* Cranium */}
      <path d="M140,4 C112,4 96,20 96,40 C96,58 104,70 114,77 C118,80 124,82 130,84 L150,84 C156,82 162,80 166,77 C176,70 184,58 184,40 C184,20 168,4 140,4 Z" {...bone}/>
      {/* Eye sockets */}
      <ellipse cx="122" cy="46" rx="13" ry="10" {...cavity}/>
      <ellipse cx="158" cy="46" rx="13" ry="10" {...cavity}/>
      {/* Nasal cavity */}
      <path d="M134,58 L140,52 L146,58 L144,65 Q140,67 136,65 Z" {...cavity} strokeWidth={1}/>
      {/* Zygomatic arches */}
      <path d="M110,50 C104,50 100,55 100,60 C100,65 104,67 110,66" fill="none" stroke="#94a3b8" strokeWidth="1.2"/>
      <path d="M170,50 C176,50 180,55 180,60 C180,65 176,67 170,66" fill="none" stroke="#94a3b8" strokeWidth="1.2"/>
      {/* Jaw / mandible */}
      <path d="M110,76 C108,82 108,90 110,96 Q126,102 140,102 Q154,102 170,96 C172,90 172,82 170,76" fill="none" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Teeth line */}
      <line x1="118" y1="86" x2="162" y2="86" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3,2"/>

      {/* ── CERVICAL SPINE (neck) ── */}
      {[102,109,116,123].map((y, i) => (
        <rect key={i} x="133" y={y} width="14" height="6" rx="2" {...bone}/>
      ))}

      {/* ── CLAVICLES ── */}
      <path d="M140,122 Q108,118 74,108" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>
      <path d="M140,122 Q172,118 206,108" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round"/>

      {/* ── STERNUM ── */}
      <path d="M136,122 Q140,120 144,122 L146,210 Q140,214 134,210 Z" {...bone}/>

      {/* ── RIBS (7 pairs) ── */}
      {/* Left ribs — arcing from spine to sternum */}
      {[
        { y: 130, ox: 82, oy: 148, ex: 136, ey: 144 },
        { y: 142, ox: 76, oy: 162, ex: 136, ey: 158 },
        { y: 154, ox: 72, oy: 176, ex: 136, ey: 172 },
        { y: 166, ox: 70, oy: 189, ex: 136, ey: 186 },
        { y: 178, ox: 70, oy: 201, ex: 136, ey: 198 },
        { y: 190, ox: 72, oy: 212, ex: 136, ey: 209 },
        { y: 200, ox: 74, oy: 222, ex: 136, ey: 219 },
      ].map((r, i) => (
        <path key={i}
          d={`M134,${r.y} C${r.ox + 30},${r.y} ${r.ox},${r.oy - 10} ${r.ox},${r.oy} C${r.ox},${r.oy + 10} ${r.ex - 40},${r.ey + 4} ${r.ex},${r.ey}`}
          fill="none" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round"/>
      ))}
      {/* Right ribs — mirror */}
      {[
        { y: 130, ox: 198, oy: 148, ex: 144, ey: 144 },
        { y: 142, ox: 204, oy: 162, ex: 144, ey: 158 },
        { y: 154, ox: 208, oy: 176, ex: 144, ey: 172 },
        { y: 166, ox: 210, oy: 189, ex: 144, ey: 186 },
        { y: 178, ox: 210, oy: 201, ex: 144, ey: 198 },
        { y: 190, ox: 208, oy: 212, ex: 144, ey: 209 },
        { y: 200, ox: 206, oy: 222, ex: 144, ey: 219 },
      ].map((r, i) => (
        <path key={i}
          d={`M146,${r.y} C${r.ox - 30},${r.y} ${r.ox},${r.oy - 10} ${r.ox},${r.oy} C${r.ox},${r.oy + 10} ${r.ex + 40},${r.ey + 4} ${r.ex},${r.ey}`}
          fill="none" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round"/>
      ))}

      {/* ── THORACIC + LUMBAR SPINE ── */}
      {[130,138,146,154,162,170,178,186,194,202,210,218,226,234,242,250,258].map((y, i) => (
        <rect key={i} x="133" y={y} width="14" height="7" rx="2" {...bone}/>
      ))}

      {/* ── PELVIS ── */}
      {/* Left iliac wing */}
      <path d="M140,262 C118,254 90,256 80,268 C70,280 76,300 92,308 C100,312 110,310 116,304 L120,290 L136,278 Z"
        fill="#dde2ea" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Right iliac wing */}
      <path d="M140,262 C162,254 190,256 200,268 C210,280 204,300 188,308 C180,312 170,310 164,304 L160,290 L144,278 Z"
        fill="#dde2ea" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Sacrum */}
      <path d="M128,262 Q140,270 152,262 L154,298 Q140,306 126,298 Z" fill="#d4d8e1" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Pubic symphysis */}
      <rect x="128" y="306" width="24" height="12" rx="4" fill="#dde2ea" stroke="#94a3b8" strokeWidth="1.2"/>

      {/* ── SHOULDER JOINTS ── */}
      <circle cx="72"  cy="120" r="18" {...joint}/>
      <circle cx="208" cy="120" r="18" {...joint}/>

      {/* ── HUMERUS (upper arm) ── */}
      {/* Left — round head at top, widens at condyles */}
      <path d="M66,132 C60,132 54,136 54,142 L52,218 C52,226 56,232 64,234 C72,236 76,232 76,224 L76,144 C76,136 72,132 66,132 Z" {...bone}/>
      {/* Right */}
      <path d="M214,132 C220,132 226,136 226,142 L228,218 C228,226 224,232 216,234 C208,236 204,232 204,224 L204,144 C204,136 208,132 214,132 Z" {...bone}/>

      {/* ── ELBOW JOINTS ── */}
      <ellipse cx="64"  cy="234" rx="14" ry="10" {...joint}/>
      <ellipse cx="216" cy="234" rx="14" ry="10" {...joint}/>

      {/* ── RADIUS + ULNA (forearm) ── */}
      {/* Left — two parallel bones */}
      <rect x="52"  y="242" width="10" height="82" rx="5" {...bone}/>
      <rect x="64"  y="242" width="8"  height="82" rx="4" {...bone}/>
      {/* Right */}
      <rect x="218" y="242" width="10" height="82" rx="5" {...bone}/>
      <rect x="208" y="242" width="8"  height="82" rx="4" {...bone}/>

      {/* ── WRIST / CARPAL ── */}
      <ellipse cx="59"  cy="328" rx="14" ry="8" {...bone}/>
      <ellipse cx="221" cy="328" rx="14" ry="8" {...bone}/>

      {/* ── HAND BONES ── */}
      {/* Left — 5 metacarpals */}
      {[-10,-5,0,5,10].map((dx, i) => (
        <rect key={i} x={52+i*6} y="334" width="5" height="22" rx="2" {...bone}/>
      ))}
      {/* Right */}
      {[-10,-5,0,5,10].map((dx, i) => (
        <rect key={i} x={210+i*6} y="334" width="5" height="22" rx="2" {...bone}/>
      ))}

      {/* ── HIP JOINTS ── */}
      <circle cx="110" cy="306" r="22" {...joint}/>
      <circle cx="170" cy="306" r="22" {...joint}/>
      {/* Femoral head */}
      <circle cx="116" cy="300" r="12" fill="#cdd2db" stroke="#94a3b8" strokeWidth="1.2"/>
      <circle cx="164" cy="300" r="12" fill="#cdd2db" stroke="#94a3b8" strokeWidth="1.2"/>

      {/* ── FEMUR (thigh bone) ── */}
      {/* Left — angled slightly, wider at ends */}
      <path d="M104,316 C100,316 96,320 96,326 L98,424 C98,432 102,440 110,442 C118,444 122,438 122,430 L120,326 C120,318 116,316 112,316 Z" {...bone}/>
      {/* Right */}
      <path d="M176,316 C180,316 184,320 184,326 L182,424 C182,432 178,440 170,442 C162,444 158,438 158,430 L160,326 C160,318 164,316 168,316 Z" {...bone}/>

      {/* ── PATELLA (kneecap) ── */}
      <ellipse cx="109" cy="444" rx="14" ry="11" fill="#dde2ea" stroke="#94a3b8" strokeWidth="1.5"/>
      <ellipse cx="171" cy="444" rx="14" ry="11" fill="#dde2ea" stroke="#94a3b8" strokeWidth="1.5"/>

      {/* ── TIBIA + FIBULA (lower leg) ── */}
      {/* Left tibia (larger, medial) */}
      <rect x="98"  y="454" width="18" height="96" rx="8" {...bone}/>
      {/* Left fibula (thin, lateral) */}
      <rect x="118" y="458" width="6"  height="90" rx="3" {...bone}/>
      {/* Right tibia */}
      <rect x="164" y="454" width="18" height="96" rx="8" {...bone}/>
      {/* Right fibula */}
      <rect x="156" y="458" width="6"  height="90" rx="3" {...bone}/>

      {/* ── ANKLE / TALUS ── */}
      <ellipse cx="110" cy="556" rx="18" ry="12" {...bone}/>
      <ellipse cx="170" cy="556" rx="18" ry="12" {...bone}/>

      {/* ── FOOT BONES ── */}
      {/* Left — 5 metatarsals fanning out */}
      {[-14,-7,0,7,14].map((dx, i) => (
        <path key={i}
          d={`M${105 + dx * 0.3},560 L${94 + dx},578`}
          fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/>
      ))}
      {/* Left heel */}
      <ellipse cx="110" cy="560" rx="18" ry="10" fill="#d4d8e1" stroke="#94a3b8" strokeWidth="1"/>
      {/* Right */}
      {[-14,-7,0,7,14].map((dx, i) => (
        <path key={i}
          d={`M${175 + dx * 0.3},560 L${164 + dx},578`}
          fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round"/>
      ))}
      <ellipse cx="170" cy="560" rx="18" ry="10" fill="#d4d8e1" stroke="#94a3b8" strokeWidth="1"/>
    </>
  );
}

export default function SkeletonMapClient({
  patientId, specialtyCode, initialAnnotations,
}: {
  patientId: string;
  specialtyCode: string;
  initialAnnotations: Annotation[];
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [selected, setSelected]       = useState<string | null>(null);
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const selectedRegion     = SKELETON_REGIONS.find((r) => r.id === selected);
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
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 700 }}>
        🦴 انقر على أي عظمة أو مفصل لتحديد الحالة
      </p>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "10px 6px", userSelect: "none" }}>
        <svg viewBox="0 0 280 600" style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}>
          {/* Anatomical skeleton drawing */}
          <SkeletonDrawing />

          {/* Clickable annotation overlays */}
          {SKELETON_REGIONS.map((region) => {
            const ann  = annotations.find((a) => a.regionId === region.id) ?? null;
            const isSel = selected === region.id;
            return (
              <g key={region.id} onClick={() => handleSelect(region.id)} style={{ cursor: "pointer" }}>
                <RegionShape
                  region={region}
                  fill={ann ? ann.color + "44" : "transparent"}
                  stroke={isSel ? "#1e3a8a" : "transparent"}
                  strokeWidth={isSel ? 2.5 : 0}
                />
                {isSel && (
                  <RegionShape region={region} fill="none" stroke="#1e3a8a" strokeWidth={2} strokeDasharray="5 3" />
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
              <button key={t.key} onClick={() => saveAnnotation(t.key)} disabled={saving}
                style={{ padding: "6px 14px", borderRadius: 20, background: t.color, color: "white", fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {t.labelAr}
              </button>
            ))}
          </div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظة تشخيصية (اختياري)"
            style={{ width: "100%", padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: "border-box" }}
          />
          {selectedAnnotation && (
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
              const region = SKELETON_REGIONS.find((r) => r.id === a.regionId);
              return (
                <span key={a.id} style={{ padding: "3px 10px", borderRadius: 20, background: (cond?.color ?? "#6b7280") + "20", color: cond?.color ?? "#6b7280", fontSize: 11, fontWeight: 800, border: `1px solid ${(cond?.color ?? "#6b7280")}40` }}>
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
