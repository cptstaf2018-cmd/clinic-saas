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
  // ── FRONT (viewBox 500×700, front centered at x=125) ──
  { id: "head_f",       labelAr: "الرأس",          shape: "ellipse", cx: 125, cy: 72,  rx: 46, ry: 52 },
  { id: "neck_f",       labelAr: "الرقبة",         shape: "rect",    x: 108,  y: 118,  w: 34,  h: 24, rx: 8 },
  { id: "chest_f",      labelAr: "الصدر",          shape: "rect",    x: 65,   y: 138,  w: 120, h: 80, rx: 12 },
  { id: "abdomen_f",    labelAr: "البطن",          shape: "rect",    x: 68,   y: 215,  w: 114, h: 60, rx: 12 },
  { id: "pelvis_f",     labelAr: "الحوض",          shape: "ellipse", cx: 125, cy: 280, rx: 56, ry: 20 },
  { id: "r_arm_f",      labelAr: "الذراع الأيمن",  shape: "rect",    x: 38,   y: 148,  w: 28,  h: 148, rx: 12 },
  { id: "l_arm_f",      labelAr: "الذراع الأيسر",  shape: "rect",    x: 184,  y: 148,  w: 28,  h: 148, rx: 12 },
  { id: "r_hand_f",     labelAr: "اليد اليمنى",    shape: "ellipse", cx: 56,  cy: 312, rx: 18, ry: 22 },
  { id: "l_hand_f",     labelAr: "اليد اليسرى",    shape: "ellipse", cx: 194, cy: 312, rx: 18, ry: 22 },
  { id: "r_thigh_f",    labelAr: "الفخذ الأيمن",   shape: "rect",    x: 72,   y: 288,  w: 40,  h: 140, rx: 14 },
  { id: "l_thigh_f",    labelAr: "الفخذ الأيسر",   shape: "rect",    x: 138,  y: 288,  w: 40,  h: 140, rx: 14 },
  { id: "r_knee_f",     labelAr: "الركبة اليمنى",  shape: "ellipse", cx: 91,  cy: 432, rx: 20, ry: 14 },
  { id: "l_knee_f",     labelAr: "الركبة اليسرى",  shape: "ellipse", cx: 159, cy: 432, rx: 20, ry: 14 },
  { id: "r_leg_f",      labelAr: "الساق اليمنى",   shape: "rect",    x: 72,   y: 444,  w: 38,  h: 128, rx: 12 },
  { id: "l_leg_f",      labelAr: "الساق اليسرى",   shape: "rect",    x: 140,  y: 444,  w: 38,  h: 128, rx: 12 },
  { id: "r_foot_f",     labelAr: "القدم اليمنى",   shape: "ellipse", cx: 91,  cy: 584, rx: 26, ry: 14 },
  { id: "l_foot_f",     labelAr: "القدم اليسرى",   shape: "ellipse", cx: 159, cy: 584, rx: 26, ry: 14 },

  // ── BACK (centered at x=375) ──
  { id: "head_b",       labelAr: "الرأس (خلف)",    shape: "ellipse", cx: 375, cy: 72,  rx: 46, ry: 52 },
  { id: "neck_b",       labelAr: "الرقبة (خلف)",   shape: "rect",    x: 358,  y: 118,  w: 34,  h: 24, rx: 8 },
  { id: "upper_back",   labelAr: "أعلى الظهر",     shape: "rect",    x: 315,  y: 138,  w: 120, h: 80, rx: 12 },
  { id: "lower_back",   labelAr: "أسفل الظهر",     shape: "rect",    x: 318,  y: 215,  w: 114, h: 60, rx: 12 },
  { id: "buttocks",     labelAr: "المنطقة السفلية", shape: "ellipse", cx: 375, cy: 280, rx: 56, ry: 20 },
  { id: "r_arm_b",      labelAr: "الذراع (خلف أيمن)", shape: "rect", x: 288,  y: 148,  w: 28,  h: 148, rx: 12 },
  { id: "l_arm_b",      labelAr: "الذراع (خلف أيسر)", shape: "rect", x: 434,  y: 148,  w: 28,  h: 148, rx: 12 },
  { id: "r_thigh_b",    labelAr: "الفخذ (خلف أيمن)", shape: "rect",  x: 322,  y: 288,  w: 40,  h: 140, rx: 14 },
  { id: "l_thigh_b",    labelAr: "الفخذ (خلف أيسر)", shape: "rect",  x: 388,  y: 288,  w: 40,  h: 140, rx: 14 },
  { id: "r_calf",       labelAr: "ربلة الساق (يمين)", shape: "rect", x: 322,  y: 444,  w: 38,  h: 128, rx: 12 },
  { id: "l_calf",       labelAr: "ربلة الساق (يسار)", shape: "rect", x: 390,  y: 444,  w: 38,  h: 128, rx: 12 },
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

  const imgW = 500;
  const imgH = 700;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">خريطة الجسم — طب الأطفال</h3>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 relative rounded-xl overflow-hidden border border-gray-200 bg-[#f8fafd]" style={{ aspectRatio: `${imgW}/${imgH}` }}>

          <svg viewBox={`0 0 ${imgW} ${imgH}`} className="absolute inset-0 w-full h-full" style={{ cursor: "pointer" }}>
            {/* ── Medical-standard child body outline (NHS style) ── */}
            <rect width="500" height="700" fill="#ffffff"/>

            {/* Labels */}
            <text x="125" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#94a3b8" letterSpacing="2">FRONT</text>
            <text x="375" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#94a3b8" letterSpacing="2">BACK</text>
            <line x1="250" y1="8" x2="250" y2="692" stroke="#e2e8f0" strokeWidth="1"/>

            {/* ══════ FRONT ══════ */}
            {/* Head */}
            <ellipse cx="125" cy="72" rx="44" ry="50" fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Ears */}
            <path d="M81 62 Q74 72 81 82" stroke="#374151" strokeWidth="2" fill="none"/>
            <path d="M169 62 Q176 72 169 82" stroke="#374151" strokeWidth="2" fill="none"/>
            {/* Eyes */}
            <ellipse cx="110" cy="70" rx="5" ry="5.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
            <ellipse cx="140" cy="70" rx="5" ry="5.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
            <circle cx="110" cy="71" r="2.5" fill="#374151"/>
            <circle cx="140" cy="71" r="2.5" fill="#374151"/>
            {/* Nose */}
            <path d="M121 78 Q125 84 129 78" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* Mouth */}
            <path d="M113 88 Q125 95 137 88" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* Hair lines */}
            <path d="M88 45 Q125 28 162 45" stroke="#374151" strokeWidth="1.5" fill="none"/>
            {/* Neck */}
            <path d="M108 120 L108 138 M142 120 L142 138" stroke="#374151" strokeWidth="2" fill="none"/>
            {/* Torso — child has wider torso relative to body */}
            <path d="M108 138 Q70 142 60 158 L56 260 Q56 276 72 278 L178 278 Q194 276 194 260 L190 158 Q180 142 142 138 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Belly button */}
            <circle cx="125" cy="230" r="3" fill="none" stroke="#374151" strokeWidth="1.5"/>
            {/* Collar bones */}
            <path d="M108 144 Q90 140 70 148" stroke="#374151" strokeWidth="1" fill="none"/>
            <path d="M142 144 Q160 140 180 148" stroke="#374151" strokeWidth="1" fill="none"/>
            {/* Left arm (viewer's right) */}
            <path d="M60 162 Q44 168 40 200 L38 280 Q38 294 50 296 L62 296 Q74 294 74 280 L72 200 Q68 168 60 162 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Left hand */}
            <ellipse cx="56" cy="312" rx="16" ry="20" fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right arm */}
            <path d="M190 162 Q206 168 210 200 L212 280 Q212 294 200 296 L188 296 Q176 294 176 280 L178 200 Q182 168 190 162 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right hand */}
            <ellipse cx="194" cy="312" rx="16" ry="20" fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Groin/hips */}
            <ellipse cx="125" cy="280" rx="54" ry="18" fill="white" stroke="#374151" strokeWidth="1.5"/>
            {/* Left leg */}
            <path d="M82 290 Q76 296 72 320 L68 430 Q68 446 80 448 L100 448 Q112 446 112 430 L110 320 Q108 296 102 290 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Left knee cap */}
            <ellipse cx="91" cy="432" rx="14" ry="10" fill="white" stroke="#374151" strokeWidth="1.5"/>
            {/* Left lower leg */}
            <path d="M78 448 Q74 452 72 470 L70 560 Q70 574 82 576 L100 576 Q112 574 112 560 L110 470 Q108 452 104 448 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Left foot */}
            <path d="M70 572 Q68 588 72 596 L106 596 Q118 596 120 588 L112 572 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right leg */}
            <path d="M148 290 Q154 296 158 320 L162 430 Q162 446 150 448 L130 448 Q118 446 118 430 L120 320 Q122 296 128 290 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right knee cap */}
            <ellipse cx="159" cy="432" rx="14" ry="10" fill="white" stroke="#374151" strokeWidth="1.5"/>
            {/* Right lower leg */}
            <path d="M146 448 Q142 452 140 470 L138 560 Q138 574 150 576 L168 576 Q180 574 180 560 L178 470 Q176 452 172 448 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right foot */}
            <path d="M138 572 Q130 588 132 596 L166 596 Q170 596 180 588 L180 572 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>

            {/* ══════ BACK ══════ */}
            {/* Head back */}
            <ellipse cx="375" cy="72" rx="44" ry="50" fill="white" stroke="#374151" strokeWidth="2"/>
            <path d="M331 62 Q324 72 331 82" stroke="#374151" strokeWidth="2" fill="none"/>
            <path d="M419 62 Q426 72 419 82" stroke="#374151" strokeWidth="2" fill="none"/>
            {/* Hair back */}
            <path d="M338 45 Q375 28 412 45" stroke="#374151" strokeWidth="1.5" fill="none"/>
            {/* Neck back */}
            <path d="M358 120 L358 138 M392 120 L392 138" stroke="#374151" strokeWidth="2" fill="none"/>
            {/* Torso back */}
            <path d="M358 138 Q320 142 310 158 L306 260 Q306 276 322 278 L428 278 Q444 276 444 260 L440 158 Q430 142 392 138 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Spine */}
            <path d="M375 145 L375 270" stroke="#9ca3af" strokeWidth="1" strokeDasharray="5 4"/>
            {/* Shoulder blades */}
            <ellipse cx="348" cy="180" rx="16" ry="22" fill="none" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3"/>
            <ellipse cx="402" cy="180" rx="16" ry="22" fill="none" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3"/>
            {/* Left arm back */}
            <path d="M310 162 Q294 168 290 200 L288 280 Q288 294 300 296 L312 296 Q324 294 324 280 L322 200 Q318 168 310 162 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            <ellipse cx="306" cy="312" rx="16" ry="20" fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right arm back */}
            <path d="M440 162 Q456 168 460 200 L462 280 Q462 294 450 296 L438 296 Q426 294 426 280 L428 200 Q432 168 440 162 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            <ellipse cx="444" cy="312" rx="16" ry="20" fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Hips back */}
            <ellipse cx="375" cy="280" rx="54" ry="18" fill="white" stroke="#374151" strokeWidth="1.5"/>
            {/* Left leg back */}
            <path d="M332 290 Q326 296 322 320 L318 430 Q318 446 330 448 L350 448 Q362 446 362 430 L360 320 Q358 296 352 290 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            <path d="M328 448 Q324 452 322 470 L320 560 Q320 574 332 576 L350 576 Q362 574 362 560 L360 470 Q358 452 354 448 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Left foot back */}
            <path d="M320 572 Q318 588 322 596 L356 596 Q368 596 370 588 L362 572 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right leg back */}
            <path d="M398 290 Q404 296 408 320 L412 430 Q412 446 400 448 L380 448 Q368 446 368 430 L370 320 Q372 296 378 290 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            <path d="M396 448 Q400 452 402 470 L404 560 Q404 574 392 576 L374 576 Q362 574 362 560 L364 470 Q366 452 370 448 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Right foot back */}
            <path d="M362 572 Q358 588 362 596 L396 596 Q400 596 406 588 L404 572 Z"
              fill="white" stroke="#374151" strokeWidth="2"/>
            {/* Gluteal line */}
            <path d="M328 278 Q375 292 422 278" stroke="#9ca3af" strokeWidth="1" fill="none" strokeDasharray="4 3"/>
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
