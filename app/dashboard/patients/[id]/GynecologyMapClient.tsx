"use client";

import { useState } from "react";

const CONDITION_TYPES = [
  { key: "cyst",        labelAr: "كيس",              color: "#8b5cf6" },
  { key: "fibroid",     labelAr: "ليفة / ورم ليفي",  color: "#f97316" },
  { key: "inflammation",labelAr: "التهاب",            color: "#ef4444" },
  { key: "polyp",       labelAr: "ورم حميد",          color: "#f59e0b" },
  { key: "cancer",      labelAr: "ورم خبيث",          color: "#dc2626" },
  { key: "adhesion",    labelAr: "التصاقات",          color: "#b45309" },
  { key: "ectopic",     labelAr: "حمل خارج الرحم",   color: "#0891b2" },
  { key: "prolapse",    labelAr: "هبوط",              color: "#6d28d9" },
  { key: "pregnancy",   labelAr: "حمل",               color: "#10b981" },
  { key: "other",       labelAr: "أخرى",             color: "#6b7280" },
];

// Image: 1280 × 754 px — CDC public domain female reproductive system
// Patient right = screen left (anatomical convention)
type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const REGIONS: Region[] = [
  { id: "uterus",        labelAr: "الرحم",                    shape: "ellipse", cx: 640, cy: 300, rx: 120, ry: 110 },
  { id: "r_ovary",       labelAr: "المبيض الأيمن",            shape: "ellipse", cx: 240, cy: 270, rx: 55,  ry: 48  },
  { id: "l_ovary",       labelAr: "المبيض الأيسر",            shape: "ellipse", cx: 1040,cy: 270, rx: 55,  ry: 48  },
  { id: "r_fallopian",   labelAr: "قناة فالوب اليمنى",        shape: "rect",    x: 280,  y: 180,  w: 310,  h: 50,  rx: 25 },
  { id: "l_fallopian",   labelAr: "قناة فالوب اليسرى",        shape: "rect",    x: 690,  y: 180,  w: 310,  h: 50,  rx: 25 },
  { id: "cervix",        labelAr: "عنق الرحم",                shape: "ellipse", cx: 640, cy: 430, rx: 65,  ry: 55  },
  { id: "vagina",        labelAr: "المهبل",                   shape: "rect",    x: 580,  y: 490,  w: 120,  h: 140, rx: 20 },
  { id: "vulva",         labelAr: "الفرج",                    shape: "ellipse", cx: 640, cy: 670, rx: 90,  ry: 50  },
  { id: "endometrium",   labelAr: "بطانة الرحم",              shape: "ellipse", cx: 640, cy: 295, rx: 65,  ry: 65  },
  { id: "r_parametrium", labelAr: "النسيج المحيط (أيمن)",     shape: "ellipse", cx: 390, cy: 340, rx: 70,  ry: 50  },
  { id: "l_parametrium", labelAr: "النسيج المحيط (أيسر)",     shape: "ellipse", cx: 890, cy: 340, rx: 70,  ry: 50  },
];

type Annotation = { regionId: string; condition: string; color: string; notes?: string };
type Props      = { patientId: string; initialAnnotations?: Annotation[] };

export default function GynecologyMapClient({ patientId, initialAnnotations = [] }: Props) {
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
          specialtyCode: "gynecology",
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
        body: JSON.stringify({ specialtyCode: "gynecology", regionId: selectedRegion.id }),
      });
      setAnnotations(prev => prev.filter(a => a.regionId !== selectedRegion.id));
      setSelectedRegion(null);
    } finally { setSaving(false); }
  };

  const imgW = 1280;
  const imgH = 754;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">خريطة الجهاز التناسلي التفاعلية</h3>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 min-w-0 relative rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ aspectRatio: `${imgW}/${imgH}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gynecology-map.png" alt="خريطة الجهاز التناسلي" className="absolute inset-0 w-full h-full object-contain" />

          <svg viewBox={`0 0 ${imgW} ${imgH}`} className="absolute inset-0 w-full h-full" style={{ cursor: "pointer" }}>
            {REGIONS.map(region => {
              const ann   = getAnn(region.id);
              const isSel = selectedRegion?.id === region.id;
              const props = {
                fill:          "transparent",
                fillOpacity:   0,
                stroke:        isSel ? "#facc15" : ann ? ann.color : "rgba(100,0,100,0.4)",
                strokeOpacity: isSel ? 1 : ann ? 0.8 : 0,
                strokeWidth:   isSel ? 5 : 3,
                strokeDasharray: isSel ? "10 5" : undefined,
                onClick: () => handleClick(region),
                style: { cursor: "pointer", transition: "all 0.15s" },
                className: "hover:fill-purple-300 hover:fill-opacity-20",
              };
              return region.shape === "ellipse"
                ? <ellipse key={region.id} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...props} />
                : <rect key={region.id} x={region.x} y={region.y} width={region.w} height={region.h} rx={region.rx ?? 10} {...props} />;
            })}
            {REGIONS.map(region => {
              const ann = getAnn(region.id);
              const isSel = selectedRegion?.id === region.id;
              if (!ann && !isSel) return null;
              const x = region.shape === "ellipse" ? region.cx : region.x + region.w / 2;
              const y = region.shape === "ellipse" ? region.cy : region.y + region.h / 2;
              const color = ann?.color ?? "#7c3aed";
              return (
                <g key={`${region.id}-marker`}>
                  <circle cx={x} cy={y} r={isSel ? 30 : 22} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={isSel ? 7 : 5} strokeDasharray={isSel ? "10 5" : undefined} />
                  <circle cx={x} cy={y} r={6} fill={color} />
                </g>
              );
            })}
            {selectedRegion && (() => {
              const r  = selectedRegion;
              const lx = r.shape === "ellipse" ? r.cx : r.x + r.w / 2;
              const ly = r.shape === "ellipse" ? r.cy - r.ry - 25 : r.y - 18;
              return (
                <text x={lx} y={Math.max(40, ly)} textAnchor="middle" fill="#facc15" fontSize={38} fontWeight="bold"
                  style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.8))" }}>
                  {r.labelAr}
                </text>
              );
            })()}
          </svg>
        </div>

        <div className="w-full xl:w-60 space-y-3 shrink-0">
          {selectedRegion ? (
            <div className="bg-white border border-purple-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-purple-800 text-sm">{selectedRegion.labelAr}</p>
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
                className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-purple-400" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-purple-600 text-white text-xs py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
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
