"use client";

import { useState } from "react";

const CONDITION_TYPES = [
  { key: "pain",       labelAr: "ألم",              color: "#ef4444" },
  { key: "fever",      labelAr: "حرارة / التهاب",   color: "#f97316" },
  { key: "rash",       labelAr: "طفح جلدي",         color: "#f59e0b" },
  { key: "injury",     labelAr: "إصابة / كدمة",     color: "#dc2626" },
  { key: "swelling",   labelAr: "تورم",              color: "#8b5cf6" },
  { key: "fracture",   labelAr: "كسر",               color: "#1d4ed8" },
  { key: "lymph",      labelAr: "تضخم غدد",         color: "#0891b2" },
  { key: "congenital", labelAr: "تشوه خلقي",         color: "#7c3aed" },
  { key: "growth",     labelAr: "مشكلة نمو",         color: "#059669" },
  { key: "other",      labelAr: "أخرى",             color: "#6b7280" },
];

// Reuses body-map.png (960×1118) — front left, back right
// Same layout as dermatology body map
type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const REGIONS: Region[] = [
  // ── FRONT ──
  { id: "head_f",       labelAr: "الرأس",              shape: "ellipse", cx: 250, cy: 76,   rx: 58,  ry: 64  },
  { id: "neck_f",       labelAr: "الرقبة",             shape: "ellipse", cx: 250, cy: 165,  rx: 30,  ry: 30  },
  { id: "chest_f",      labelAr: "الصدر",              shape: "rect",    x: 150,  y: 180,   w: 200,  h: 150, rx: 18 },
  { id: "abdomen_f",    labelAr: "البطن",              shape: "rect",    x: 158,  y: 330,   w: 184,  h: 140, rx: 16 },
  { id: "r_shoulder_f", labelAr: "الكتف الأيمن",       shape: "ellipse", cx: 118, cy: 196,  rx: 48,  ry: 32  },
  { id: "l_shoulder_f", labelAr: "الكتف الأيسر",       shape: "ellipse", cx: 382, cy: 196,  rx: 48,  ry: 32  },
  { id: "r_arm_f",      labelAr: "الذراع الأيمن",      shape: "rect",    x: 58,   y: 190,   w: 50,   h: 170, rx: 20 },
  { id: "l_arm_f",      labelAr: "الذراع الأيسر",      shape: "rect",    x: 392,  y: 190,   w: 50,   h: 170, rx: 20 },
  { id: "r_hand_f",     labelAr: "اليد اليمنى",        shape: "ellipse", cx: 62,  cy: 546,  rx: 38,  ry: 48  },
  { id: "l_hand_f",     labelAr: "اليد اليسرى",        shape: "ellipse", cx: 430, cy: 546,  rx: 38,  ry: 48  },
  { id: "pelvis_f",     labelAr: "الحوض",              shape: "ellipse", cx: 250, cy: 492,  rx: 85,  ry: 40  },
  { id: "r_thigh_f",    labelAr: "الفخذ الأيمن",       shape: "rect",    x: 172,  y: 530,   w: 58,   h: 160, rx: 22 },
  { id: "l_thigh_f",    labelAr: "الفخذ الأيسر",       shape: "rect",    x: 268,  y: 530,   w: 58,   h: 160, rx: 22 },
  { id: "r_knee_f",     labelAr: "الركبة اليمنى",      shape: "ellipse", cx: 201, cy: 700,  rx: 45,  ry: 34  },
  { id: "l_knee_f",     labelAr: "الركبة اليسرى",      shape: "ellipse", cx: 299, cy: 700,  rx: 45,  ry: 34  },
  { id: "r_leg_f",      labelAr: "الساق اليمنى",       shape: "rect",    x: 178,  y: 736,   w: 46,   h: 230, rx: 16 },
  { id: "l_leg_f",      labelAr: "الساق اليسرى",       shape: "rect",    x: 276,  y: 736,   w: 46,   h: 230, rx: 16 },
  { id: "r_foot_f",     labelAr: "القدم اليمنى",       shape: "ellipse", cx: 200, cy: 1054, rx: 50,  ry: 28  },
  { id: "l_foot_f",     labelAr: "القدم اليسرى",       shape: "ellipse", cx: 298, cy: 1054, rx: 50,  ry: 28  },

  // ── BACK ──
  { id: "head_b",       labelAr: "الرأس (خلف)",        shape: "ellipse", cx: 730, cy: 76,   rx: 58,  ry: 64  },
  { id: "neck_b",       labelAr: "الرقبة (خلف)",       shape: "ellipse", cx: 730, cy: 165,  rx: 30,  ry: 30  },
  { id: "upper_back",   labelAr: "أعلى الظهر",         shape: "rect",    x: 630,  y: 180,   w: 200,  h: 150, rx: 18 },
  { id: "lower_back",   labelAr: "أسفل الظهر",         shape: "rect",    x: 638,  y: 330,   w: 184,  h: 140, rx: 16 },
  { id: "buttocks",     labelAr: "المنطقة السفلية",    shape: "ellipse", cx: 730, cy: 492,  rx: 110, ry: 50  },
  { id: "r_thigh_b",    labelAr: "الفخذ (خلف أيمن)",  shape: "rect",    x: 750,  y: 530,   w: 58,   h: 160, rx: 22 },
  { id: "l_thigh_b",    labelAr: "الفخذ (خلف أيسر)",  shape: "rect",    x: 652,  y: 530,   w: 58,   h: 160, rx: 22 },
  { id: "r_calf",       labelAr: "ربلة الساق (يمين)",  shape: "rect",    x: 752,  y: 736,   w: 46,   h: 230, rx: 16 },
  { id: "l_calf",       labelAr: "ربلة الساق (يسار)",  shape: "rect",    x: 654,  y: 736,   w: 46,   h: 230, rx: 16 },
];

type Annotation = { regionId: string; condition: string; color: string; notes?: string };
type Props      = { patientId: string; initialAnnotations?: Annotation[] };

export default function PediatricBodyClient({ patientId, initialAnnotations = [] }: Props) {
  const [annotations, setAnnotations]       = useState<Annotation[]>(initialAnnotations);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCond, setSelectedCond]     = useState(CONDITION_TYPES[0].key);
  const [notes, setNotes]                   = useState("");
  const [saving, setSaving]                 = useState(false);

  const getAnn = (id: string) => annotations.find(a => a.regionId === id);

  const handleClick = (region: Region) => {
    const existing = getAnn(region.id);
    setSelectedRegion(region);
    setSelectedCond(existing?.condition ?? CONDITION_TYPES[0].key);
    setNotes(existing?.notes ?? "");
  };

  const handleSave = async () => {
    if (!selectedRegion) return;
    setSaving(true);
    const cond = CONDITION_TYPES.find(c => c.key === selectedCond)!;
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialtyCode: "pediatrics",
          regionId: selectedRegion.id,
          label: cond.labelAr,
          color: cond.color,
          notes,
        }),
      });
      setAnnotations(prev => [
        ...prev.filter(a => a.regionId !== selectedRegion.id),
        { regionId: selectedRegion.id, condition: selectedCond, color: cond.color, notes },
      ]);
      setSelectedRegion(null);
    } finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!selectedRegion) return;
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialtyCode: "pediatrics", regionId: selectedRegion.id }),
      });
      setAnnotations(prev => prev.filter(a => a.regionId !== selectedRegion.id));
      setSelectedRegion(null);
    } finally { setSaving(false); }
  };

  const imgW = 960;
  const imgH = 1118;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">خريطة الجسم — طب الأطفال</h3>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style={{ aspectRatio: `${imgW}/${imgH}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/body-map.png" alt="خريطة الجسم" className="absolute inset-0 w-full h-full object-contain" />

          <svg viewBox={`0 0 ${imgW} ${imgH}`} className="absolute inset-0 w-full h-full" style={{ cursor: "pointer" }}>
            {REGIONS.map(region => {
              const ann   = getAnn(region.id);
              const isSel = selectedRegion?.id === region.id;
              const props = {
                fill:          ann ? ann.color : "transparent",
                fillOpacity:   ann ? 0.4 : 0,
                stroke:        isSel ? "#1d4ed8" : ann ? ann.color : "#64748b",
                strokeOpacity: isSel ? 1 : ann ? 0.7 : 0,
                strokeWidth:   isSel ? 4 : 2,
                strokeDasharray: isSel ? "8 4" : undefined,
                onClick: () => handleClick(region),
                style: { cursor: "pointer", transition: "all 0.15s" },
                className: "hover:fill-blue-400 hover:fill-opacity-20",
              };
              return region.shape === "ellipse"
                ? <ellipse key={region.id} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...props} />
                : <rect key={region.id} x={region.x} y={region.y} width={region.w} height={region.h} rx={region.rx ?? 8} {...props} />;
            })}
            {selectedRegion && (() => {
              const r  = selectedRegion;
              const lx = r.shape === "ellipse" ? r.cx : r.x + r.w / 2;
              const ly = r.shape === "ellipse" ? r.cy - r.ry - 20 : r.y - 14;
              return (
                <text x={lx} y={Math.max(40, ly)} textAnchor="middle" fill="#1d4ed8" fontSize={32} fontWeight="bold"
                  style={{ filter: "drop-shadow(0 1px 3px rgba(255,255,255,0.9))" }}>
                  {r.labelAr}
                </text>
              );
            })()}
          </svg>
        </div>

        <div className="w-full lg:w-60 space-y-3 shrink-0">
          {selectedRegion ? (
            <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-blue-800 text-sm">{selectedRegion.labelAr}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CONDITION_TYPES.map(c => (
                  <button key={c.key} onClick={() => setSelectedCond(c.key)}
                    className="text-xs px-2 py-1.5 rounded-lg border transition-all"
                    style={{
                      backgroundColor: selectedCond === c.key ? c.color : "white",
                      borderColor: c.color,
                      color: selectedCond === c.key ? "white" : c.color,
                      fontWeight: selectedCond === c.key ? 700 : 400,
                    }}>
                    {c.labelAr}
                  </button>
                ))}
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="ملاحظات..." rows={3} dir="rtl"
                className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-blue-400" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "..." : "حفظ"}
                </button>
                {getAnn(selectedRegion.id) && (
                  <button onClick={handleRemove} disabled={saving}
                    className="px-3 bg-red-50 text-red-600 text-xs py-2 rounded-lg hover:bg-red-100">حذف</button>
                )}
                <button onClick={() => setSelectedRegion(null)}
                  className="px-3 bg-gray-50 text-gray-600 text-xs py-2 rounded-lg hover:bg-gray-100">إغلاق</button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
              انقر على منطقة لتسجيل الملاحظة
            </div>
          )}

          {annotations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">المناطق المُحددة</p>
              {annotations.map(ann => {
                const region = REGIONS.find(r => r.id === ann.regionId);
                const cond   = CONDITION_TYPES.find(c => c.key === ann.condition);
                return (
                  <div key={ann.regionId} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ann.color }} />
                    <span className="text-gray-700 font-medium">{region?.labelAr}</span>
                    <span className="text-gray-400">— {cond?.labelAr}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-600 mb-2">دليل الألوان</p>
            {CONDITION_TYPES.map(c => (
              <div key={c.key} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
                {c.labelAr}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
