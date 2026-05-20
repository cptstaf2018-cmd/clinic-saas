"use client";

import { useState } from "react";

const CONDITION_TYPES = [
  { key: "redness",      labelAr: "احمرار",          color: "#ef4444" },
  { key: "ulcer",        labelAr: "تقرح / قرحة",     color: "#dc2626" },
  { key: "cataract",     labelAr: "ماء أبيض",         color: "#94a3b8" },
  { key: "glaucoma",     labelAr: "ماء أزرق",         color: "#0284c7" },
  { key: "pterygium",    labelAr: "جناح",             color: "#f59e0b" },
  { key: "discharge",    labelAr: "إفراز / رمص",      color: "#84cc16" },
  { key: "injury",       labelAr: "إصابة / جرح",      color: "#b91c1c" },
  { key: "inflammation", labelAr: "التهاب",           color: "#f97316" },
  { key: "opacity",      labelAr: "تعتم / ضبابية",    color: "#64748b" },
  { key: "detachment",   labelAr: "انفصال شبكية",     color: "#7c3aed" },
  { key: "other",        labelAr: "أخرى",             color: "#6b7280" },
];

type Region = {
  id: string;
  labelAr: string;
  view: "front" | "side";
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

// Front view: 2934 × 1924 px — eye in orbital socket
const FRONT_REGIONS: Region[] = [
  { id: "f_pupil",    labelAr: "الحدقة",             view: "front", shape: "ellipse", cx: 1467, cy: 962, rx: 260, ry: 265 },
  { id: "f_iris",     labelAr: "القزحية",             view: "front", shape: "ellipse", cx: 1467, cy: 962, rx: 660, ry: 660 },
  { id: "f_cornea",   labelAr: "القرنية",             view: "front", shape: "ellipse", cx: 1467, cy: 962, rx: 720, ry: 720 },
  { id: "f_sclera",   labelAr: "الصلبة",              view: "front", shape: "ellipse", cx: 1467, cy: 962, rx: 1100, ry: 1050 },
  { id: "f_muscle_t", labelAr: "العضلة العلوية",      view: "front", shape: "rect", x: 1050, y: 100, w: 800, h: 250, rx: 40 },
  { id: "f_muscle_b", labelAr: "العضلة السفلية",      view: "front", shape: "rect", x: 1050, y: 1600, w: 800, h: 250, rx: 40 },
  { id: "f_muscle_r", labelAr: "العضلة الإنسية",      view: "front", shape: "rect", x: 100,  y: 650, w: 480, h: 620, rx: 40 },
  { id: "f_muscle_l", labelAr: "العضلة الوحشية",      view: "front", shape: "rect", x: 2360, y: 650, w: 480, h: 620, rx: 40 },
];

// Side view: 2175 × 1242 px — cross-section (OpenStax CC BY)
const SIDE_REGIONS: Region[] = [
  { id: "s_cornea",   labelAr: "القرنية",             view: "side", shape: "ellipse", cx: 1870, cy: 621, rx: 160, ry: 350 },
  { id: "s_iris",     labelAr: "القزحية",             view: "side", shape: "ellipse", cx: 1640, cy: 621, rx: 80,  ry: 340 },
  { id: "s_pupil",    labelAr: "الحدقة",             view: "side", shape: "ellipse", cx: 1700, cy: 621, rx: 55,  ry: 175 },
  { id: "s_lens",     labelAr: "العدسة",              view: "side", shape: "ellipse", cx: 1560, cy: 621, rx: 130, ry: 280 },
  { id: "s_vitreous", labelAr: "الجسم الزجاجي",       view: "side", shape: "ellipse", cx: 1050, cy: 621, rx: 480, ry: 460 },
  { id: "s_retina",   labelAr: "الشبكية",             view: "side", shape: "ellipse", cx: 950,  cy: 621, rx: 600, ry: 570 },
  { id: "s_choroid",  labelAr: "المشيمية",             view: "side", shape: "ellipse", cx: 920,  cy: 621, rx: 650, ry: 615 },
  { id: "s_sclera",   labelAr: "الصلبة",              view: "side", shape: "ellipse", cx: 900,  cy: 621, rx: 720, ry: 680 },
  { id: "s_fovea",    labelAr: "النقرة المركزية",      view: "side", shape: "ellipse", cx: 860,  cy: 621, rx: 55,  ry: 55  },
  { id: "s_opticD",   labelAr: "القرص البصري",         view: "side", shape: "ellipse", cx: 670,  cy: 680, rx: 65,  ry: 80  },
  { id: "s_opticN",   labelAr: "العصب البصري",         view: "side", shape: "rect",    x: 180,   y: 590,  w: 490,  h: 130, rx: 20 },
  { id: "s_ciliary",  labelAr: "الجسم الهدبي",         view: "side", shape: "ellipse", cx: 1450, cy: 380, rx: 120, ry: 100 },
];

const ALL_REGIONS = [...FRONT_REGIONS, ...SIDE_REGIONS];

type Annotation = { regionId: string; condition: string; color: string; notes?: string };
type Props      = { patientId: string; initialAnnotations?: Annotation[] };

export default function EyeMapClient({ patientId, initialAnnotations = [] }: Props) {
  const [annotations, setAnnotations]       = useState<Annotation[]>(initialAnnotations);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCond, setSelectedCond]     = useState(CONDITION_TYPES[0].key);
  const [notes, setNotes]                   = useState("");
  const [saving, setSaving]                 = useState(false);
  const [eye, setEye]                       = useState<"right" | "left">("right");

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
          specialtyCode: `ophthalmology_${eye}`,
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
        body: JSON.stringify({ specialtyCode: `ophthalmology_${eye}`, regionId: selectedRegion.id }),
      });
      setAnnotations(prev => prev.filter(a => a.regionId !== selectedRegion.id));
      setSelectedRegion(null);
    } finally { setSaving(false); }
  };

  const renderMap = (regions: Region[], imgSrc: string, imgW: number, imgH: number, label: string) => (
    <div className="flex-1 min-w-0 space-y-1">
      <p className="text-xs font-medium text-gray-500 text-center">{label}</p>
      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black" style={{ aspectRatio: `${imgW}/${imgH}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={label} className="absolute inset-0 w-full h-full object-contain" />
        <svg viewBox={`0 0 ${imgW} ${imgH}`} className="absolute inset-0 w-full h-full" style={{ cursor: "pointer" }}>
          {regions.map(region => {
            const ann = getAnn(region.id);
            const isSel = selectedRegion?.id === region.id;
            const props = {
              fill: ann ? ann.color : "transparent",
              fillOpacity: ann ? 0.38 : 0,
              stroke: isSel ? "#facc15" : ann ? ann.color : "rgba(255,255,255,0.5)",
              strokeOpacity: isSel ? 1 : ann ? 0.85 : 0,
              strokeWidth: isSel ? 6 : 3,
              strokeDasharray: isSel ? "12 6" : undefined,
              onClick: () => handleClick(region),
              style: { cursor: "pointer", transition: "all 0.15s" },
              className: "hover:fill-yellow-300 hover:fill-opacity-20",
            };
            return region.shape === "ellipse"
              ? <ellipse key={region.id} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...props} />
              : <rect key={region.id} x={region.x} y={region.y} width={region.w} height={region.h} rx={region.rx ?? 10} {...props} />;
          })}
          {/* Label for selected region */}
          {selectedRegion && regions.find(r => r.id === selectedRegion.id) && (() => {
            const r = selectedRegion;
            const lx = r.shape === "ellipse" ? r.cx : r.x + r.w / 2;
            const ly = r.shape === "ellipse" ? r.cy - r.ry - 40 : r.y - 30;
            return (
              <text x={lx} y={Math.max(80, ly)} textAnchor="middle" fill="#facc15" fontSize={55} fontWeight="bold"
                style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.9))" }}>
                {r.labelAr}
              </text>
            );
          })()}
        </svg>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">خريطة العين التفاعلية</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["right", "left"] as const).map(e => (
            <button key={e}
              onClick={() => { setEye(e); setAnnotations([]); setSelectedRegion(null); }}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${eye === e ? "bg-white shadow text-blue-700 font-semibold" : "text-gray-500"}`}>
              {e === "right" ? "العين اليمنى" : "العين اليسرى"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        {/* ── Maps ── */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {renderMap(FRONT_REGIONS, "/eye-front.jpg", 2934, 1924, "منظر أمامي — المقلة والعضلات")}
            {renderMap(SIDE_REGIONS,  "/eye-side.jpg",  2175, 1242, "منظر جانبي — القطاع التشريحي")}
          </div>
        </div>

        {/* ── Panel ── */}
        <div className="w-full xl:w-60 space-y-3 shrink-0">
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
              انقر على منطقة في أي صورة
            </div>
          )}

          {annotations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">المناطق المُحددة</p>
              {annotations.map(ann => {
                const region = ALL_REGIONS.find(r => r.id === ann.regionId);
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
