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

const AGE_STAGES = [
  { key: "newborn",   labelAr: "حديث الولادة", ageRange: "0–3 شهر"  },
  { key: "infant",    labelAr: "رضيع",         ageRange: "3–12 شهر" },
  { key: "toddler",   labelAr: "طفل صغير",     ageRange: "1–3 سنة"  },
  { key: "preschool", labelAr: "ما قبل المدرسة", ageRange: "3–6 سنة" },
  { key: "school",    labelAr: "سن المدرسة",   ageRange: "6–12 سنة" },
  { key: "teen",      labelAr: "مراهق",        ageRange: "12+ سنة"  },
];

type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

// Single front-view child body (viewBox 0 0 250 570)
const REGIONS: Region[] = [
  { id: "head",     labelAr: "الرأس",          shape: "ellipse", cx: 125, cy: 52,  rx: 43, ry: 47 },
  { id: "neck",     labelAr: "الرقبة",         shape: "rect",    x: 112,  y: 97,   w: 26,  h: 20, rx: 7  },
  { id: "chest",    labelAr: "الصدر",          shape: "rect",    x: 68,   y: 115,  w: 114, h: 68, rx: 12 },
  { id: "abdomen",  labelAr: "البطن",          shape: "rect",    x: 71,   y: 181,  w: 108, h: 50, rx: 12 },
  { id: "pelvis",   labelAr: "الحوض",          shape: "ellipse", cx: 125, cy: 240, rx: 52, ry: 16 },
  { id: "r_arm",    labelAr: "الذراع الأيمن",  shape: "rect",    x: 42,   y: 124,  w: 24,  h: 130, rx: 11 },
  { id: "l_arm",    labelAr: "الذراع الأيسر",  shape: "rect",    x: 184,  y: 124,  w: 24,  h: 130, rx: 11 },
  { id: "r_hand",   labelAr: "اليد اليمنى",    shape: "ellipse", cx: 56,  cy: 272, rx: 16, ry: 19 },
  { id: "l_hand",   labelAr: "اليد اليسرى",    shape: "ellipse", cx: 194, cy: 272, rx: 16, ry: 19 },
  { id: "r_thigh",  labelAr: "الفخذ الأيمن",   shape: "rect",    x: 76,   y: 248,  w: 36,  h: 124, rx: 13 },
  { id: "l_thigh",  labelAr: "الفخذ الأيسر",   shape: "rect",    x: 138,  y: 248,  w: 36,  h: 124, rx: 13 },
  { id: "r_knee",   labelAr: "الركبة اليمنى",  shape: "ellipse", cx: 94,  cy: 378, rx: 18, ry: 12 },
  { id: "l_knee",   labelAr: "الركبة اليسرى",  shape: "ellipse", cx: 156, cy: 378, rx: 18, ry: 12 },
  { id: "r_leg",    labelAr: "الساق اليمنى",   shape: "rect",    x: 76,   y: 390,  w: 34,  h: 112, rx: 11 },
  { id: "l_leg",    labelAr: "الساق اليسرى",   shape: "rect",    x: 140,  y: 390,  w: 34,  h: 112, rx: 11 },
  { id: "r_foot",   labelAr: "القدم اليمنى",   shape: "ellipse", cx: 94,  cy: 516, rx: 24, ry: 12 },
  { id: "l_foot",   labelAr: "القدم اليسرى",   shape: "ellipse", cx: 156, cy: 516, rx: 24, ry: 12 },
];

// Growth stage silhouette data: [head_ry, torso_h, legs_h] relative to baseline
const STAGE_SHAPES: Record<string, { headRx: number; headRy: number; torsoH: number; legsH: number }> = {
  newborn:   { headRx: 11, headRy: 12, torsoH: 10, legsH:  5 },
  infant:    { headRx: 11, headRy: 12, torsoH: 14, legsH: 10 },
  toddler:   { headRx: 10, headRy: 11, torsoH: 18, legsH: 18 },
  preschool: { headRx:  9, headRy: 10, torsoH: 22, legsH: 26 },
  school:    { headRx:  9, headRy: 10, torsoH: 26, legsH: 34 },
  teen:      { headRx:  8, headRy:  9, torsoH: 30, legsH: 42 },
};

type Annotation = { regionId: string; condition: string; color: string; notes?: string };
type Props      = { patientId: string; initialAnnotations?: Annotation[] };

function GrowthStageSilhouette({ stageKey, selected, onClick }: {
  stageKey: string; selected: boolean; onClick: () => void;
}) {
  const s = STAGE_SHAPES[stageKey];
  const stage = AGE_STAGES.find(a => a.key === stageKey)!;
  const color = selected ? "#2563eb" : "#cbd5e1";
  const totalH = s.headRy * 2 + s.torsoH + s.legsH + 2;
  const baseline = totalH;
  // head center y = baseline - legsH - torsoH - headRy
  const headCy = baseline - s.legsH - s.torsoH - s.headRy;
  // torso top = after head bottom
  const torsoY = headCy + s.headRy;
  // torso width at head = headRx*1.5, slightly wider than head
  const torsoW = s.headRx * 2.6;
  // legs start at torso bottom
  const legsY = torsoY + s.torsoH;
  const legW = torsoW * 0.38;

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group focus:outline-none">
      <svg viewBox={`-18 -4 36 ${totalH + 8}`} className="w-10 h-16" style={{ overflow: "visible" }}>
        {/* Head */}
        <ellipse cx="0" cy={headCy} rx={s.headRx} ry={s.headRy} fill={color}/>
        {/* Torso */}
        <rect x={-torsoW/2} y={torsoY} width={torsoW} height={s.torsoH} rx="3" fill={color}/>
        {/* Arms */}
        <rect x={-torsoW/2 - legW - 2} y={torsoY + 2} width={legW} height={s.torsoH * 0.85} rx="2" fill={color}/>
        <rect x={torsoW/2 + 2} y={torsoY + 2} width={legW} height={s.torsoH * 0.85} rx="2" fill={color}/>
        {/* Legs */}
        <rect x={-torsoW/2 + 1} y={legsY} width={torsoW * 0.44} height={s.legsH} rx="2.5" fill={color}/>
        <rect x={torsoW * 0.06} y={legsY} width={torsoW * 0.44} height={s.legsH} rx="2.5" fill={color}/>
      </svg>
      <span className={`text-[10px] font-bold leading-tight text-center ${selected ? "text-blue-700" : "text-slate-400"}`}>
        {stage.labelAr}
      </span>
      <span className="text-[9px] text-slate-300 leading-none">{stage.ageRange}</span>
    </button>
  );
}

export default function PediatricBodyClient({ patientId, initialAnnotations = [] }: Props) {
  const [annotations, setAnnotations]       = useState<Annotation[]>(initialAnnotations);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCond, setSelectedCond]     = useState(CONDITION_TYPES[0].key);
  const [selectedStage, setSelectedStage]   = useState("toddler");
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
          ageStage: selectedStage,
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

  const currentStage = AGE_STAGES.find(s => s.key === selectedStage)!;

  return (
    <div className="space-y-4">
      {/* ─── Growth stages selector ─── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
          مراحل نمو الطفل
        </p>
        <div className="flex justify-around items-end">
          {AGE_STAGES.map(stage => (
            <GrowthStageSilhouette
              key={stage.key}
              stageKey={stage.key}
              selected={selectedStage === stage.key}
              onClick={() => setSelectedStage(stage.key)}
            />
          ))}
        </div>
      </div>

      <p className="text-xs font-bold text-slate-500 text-center">
        المرحلة المحددة: <span className="text-blue-700">{currentStage.labelAr}</span>
        <span className="text-slate-400 mr-1">({currentStage.ageRange})</span>
        — انقر على منطقة من الجسم لتسجيل ملاحظة
      </p>

      {/* ─── Body map + annotation panel ─── */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Single front-view child body */}
        <div
          className="flex-1 min-w-0 relative rounded-xl overflow-hidden border border-gray-100 bg-white"
          style={{ aspectRatio: "250/570" }}
        >
          <svg
            viewBox="0 0 250 570"
            className="absolute inset-0 w-full h-full"
            style={{ cursor: "pointer" }}
          >
            <rect width="250" height="570" fill="#ffffff"/>

            {/* ── Child body outline (front, NHS-style) ── */}
            {/* Head */}
            <ellipse cx="125" cy="52" rx="41" ry="46" fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Ears */}
            <path d="M84 43 Q77 52 84 61" stroke="#374151" strokeWidth="1.5" fill="none"/>
            <path d="M166 43 Q173 52 166 61" stroke="#374151" strokeWidth="1.5" fill="none"/>
            {/* Eyes */}
            <ellipse cx="111" cy="50" rx="5" ry="5.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
            <ellipse cx="139" cy="50" rx="5" ry="5.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
            <circle cx="111" cy="51" r="2.5" fill="#374151"/>
            <circle cx="139" cy="51" r="2.5" fill="#374151"/>
            {/* Nose */}
            <path d="M121 58 Q125 64 129 58" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* Mouth */}
            <path d="M114 68 Q125 75 136 68" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* Hair */}
            <path d="M90 28 Q125 12 160 28" stroke="#374151" strokeWidth="1.5" fill="none"/>
            {/* Neck */}
            <path d="M112 96 L112 113 M138 96 L138 113" stroke="#374151" strokeWidth="1.8" fill="none"/>
            {/* Torso */}
            <path d="M112 113 Q74 117 64 132 L60 232 Q60 248 76 250 L174 250 Q190 248 190 232 L186 132 Q176 117 138 113 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Belly button */}
            <circle cx="125" cy="210" r="2.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
            {/* Collar bones */}
            <path d="M112 118 Q94 114 74 122" stroke="#374151" strokeWidth="1" fill="none"/>
            <path d="M138 118 Q156 114 176 122" stroke="#374151" strokeWidth="1" fill="none"/>
            {/* Left arm (viewer's right) */}
            <path d="M64 136 Q48 142 44 172 L42 252 Q42 266 54 268 L66 268 Q78 266 78 252 L76 172 Q72 142 64 136 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Left hand */}
            <ellipse cx="55" cy="284" rx="14" ry="18" fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right arm */}
            <path d="M186 136 Q202 142 206 172 L208 252 Q208 266 196 268 L184 268 Q172 266 172 252 L174 172 Q178 142 186 136 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right hand */}
            <ellipse cx="195" cy="284" rx="14" ry="18" fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Hips */}
            <ellipse cx="125" cy="252" rx="52" ry="16" fill="white" stroke="#374151" strokeWidth="1.5"/>
            {/* Left leg */}
            <path d="M84 262 Q78 268 74 290 L70 396 Q70 411 82 413 L102 413 Q114 411 114 396 L112 290 Q110 268 104 262 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Left knee */}
            <ellipse cx="93" cy="396" rx="13" ry="9" fill="white" stroke="#374151" strokeWidth="1.5"/>
            {/* Left lower leg */}
            <path d="M80 413 Q76 418 74 434 L72 518 Q72 530 84 532 L102 532 Q114 530 114 518 L112 434 Q110 418 106 413 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Left foot */}
            <path d="M72 526 Q70 540 74 548 L108 548 Q118 548 120 540 L112 526 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right leg */}
            <path d="M146 262 Q152 268 156 290 L160 396 Q160 411 148 413 L128 413 Q116 411 116 396 L118 290 Q120 268 126 262 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right knee */}
            <ellipse cx="157" cy="396" rx="13" ry="9" fill="white" stroke="#374151" strokeWidth="1.5"/>
            {/* Right lower leg */}
            <path d="M144 413 Q140 418 138 434 L136 518 Q136 530 148 532 L166 532 Q178 530 178 518 L176 434 Q174 418 170 413 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right foot */}
            <path d="M136 526 Q130 540 132 548 L166 548 Q170 548 178 540 L178 526 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>

            {/* ── Clickable region overlays ── */}
            {REGIONS.map(region => {
              const ann   = getAnn(region.id);
              const isSel = selectedRegion?.id === region.id;
              const sharedProps = {
                fill:          ann ? ann.color : "transparent",
                fillOpacity:   ann ? 0.35 : 0,
                stroke:        isSel ? "#1d4ed8" : ann ? ann.color : "#64748b",
                strokeOpacity: isSel ? 1 : ann ? 0.6 : 0,
                strokeWidth:   isSel ? 3.5 : 2,
                strokeDasharray: isSel ? "7 4" : undefined,
                onClick: () => handleClick(region),
                style: { cursor: "pointer", transition: "all 0.12s" },
                className: "hover:fill-blue-400 hover:fill-opacity-20",
              };
              return region.shape === "ellipse"
                ? <ellipse key={region.id} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...sharedProps}/>
                : <rect    key={region.id} x={region.x}  y={region.y}  width={region.w} height={region.h} rx={region.rx ?? 7} {...sharedProps}/>;
            })}

            {/* Selected region label */}
            {selectedRegion && (() => {
              const r  = selectedRegion;
              const lx = r.shape === "ellipse" ? r.cx : r.x + r.w / 2;
              const ly = r.shape === "ellipse" ? r.cy - r.ry - 14 : r.y - 12;
              return (
                <text
                  x={lx} y={Math.max(38, Math.min(540, ly))}
                  textAnchor="middle" fill="#1d4ed8" fontSize={26} fontWeight="bold"
                  style={{ filter: "drop-shadow(0 1px 4px rgba(255,255,255,0.95))" }}>
                  {r.labelAr}
                </text>
              );
            })()}
          </svg>
        </div>

        {/* ─── Annotation panel ─── */}
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
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ann.color }}/>
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
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: c.color }}/>
                {c.labelAr}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
