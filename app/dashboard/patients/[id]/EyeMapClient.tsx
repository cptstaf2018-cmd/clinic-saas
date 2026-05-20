"use client";

import { useState } from "react";

const CONDITION_TYPES = [
  { key: "redness",     labelAr: "احمرار",         color: "#ef4444" },
  { key: "ulcer",       labelAr: "تقرح / قرحة",    color: "#dc2626" },
  { key: "cataract",    labelAr: "ماء أبيض",        color: "#94a3b8" },
  { key: "glaucoma",    labelAr: "ماء أزرق",        color: "#0284c7" },
  { key: "pterygium",   labelAr: "جناح",            color: "#f59e0b" },
  { key: "discharge",   labelAr: "إفراز / رمص",     color: "#84cc16" },
  { key: "injury",      labelAr: "إصابة / جرح",     color: "#b91c1c" },
  { key: "inflammation",labelAr: "التهاب",          color: "#f97316" },
  { key: "opacity",     labelAr: "تعتم / ضبابية",   color: "#64748b" },
  { key: "other",       labelAr: "أخرى",            color: "#6b7280" },
];

// Image: 2788 × 1864 px — close-up front view of eye
// Iris center: approximately cx=1170, cy=870
type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const REGIONS: Region[] = [
  { id: "pupil",        labelAr: "الحدقة",          shape: "ellipse", cx: 1170, cy: 870,  rx: 200,  ry: 205  },
  { id: "iris",         labelAr: "القزحية",          shape: "ellipse", cx: 1170, cy: 870,  rx: 530,  ry: 535  },
  { id: "cornea",       labelAr: "القرنية",          shape: "ellipse", cx: 1170, cy: 870,  rx: 580,  ry: 585  },
  { id: "limbus",       labelAr: "الحوف (الحدقة)",   shape: "ellipse", cx: 1170, cy: 870,  rx: 555,  ry: 560  },
  { id: "sclera_r",     labelAr: "الصلبة",           shape: "rect",    x: 1760,  y: 620,   w: 960,   h: 560,  rx: 40 },
  { id: "conjunctiva",  labelAr: "الملتحمة",         shape: "ellipse", cx: 2200, cy: 900,  rx: 420,  ry: 280  },
  { id: "upper_lid",    labelAr: "الجفن العلوي",     shape: "rect",    x: 200,   y: 0,     w: 2400,  h: 340,  rx: 30 },
  { id: "lower_lid",    labelAr: "الجفن السفلي",     shape: "rect",    x: 200,   y: 1540,  w: 2400,  h: 324,  rx: 30 },
  { id: "lacrimal",     labelAr: "القناة الدمعية",   shape: "ellipse", cx: 350,  cy: 870,  rx: 200,  ry: 160  },
];

type Annotation = {
  regionId: string;
  condition: string;
  color: string;
  notes?: string;
};

type Props = {
  patientId: string;
  initialAnnotations?: Annotation[];
};

export default function EyeMapClient({ patientId, initialAnnotations = [] }: Props) {
  const [annotations, setAnnotations]     = useState<Annotation[]>(initialAnnotations);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCond, setSelectedCond]   = useState(CONDITION_TYPES[0].key);
  const [notes, setNotes]                 = useState("");
  const [saving, setSaving]               = useState(false);
  const [eye, setEye]                     = useState<"right" | "left">("right");

  const getAnnotation = (id: string) => annotations.find(a => a.regionId === id);

  const handleClick = (region: Region) => {
    const existing = getAnnotation(region.id);
    setSelectedRegion(region);
    setSelectedCond(existing?.condition ?? CONDITION_TYPES[0].key);
    setNotes(existing?.notes ?? "");
  };

  const handleSave = async () => {
    if (!selectedRegion) return;
    setSaving(true);
    const cond = CONDITION_TYPES.find(c => c.key === selectedCond)!;
    const specialtyCode = `ophthalmology_${eye}`;
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialtyCode,
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
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedRegion) return;
    setSaving(true);
    const specialtyCode = `ophthalmology_${eye}`;
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialtyCode, regionId: selectedRegion.id }),
      });
      setAnnotations(prev => prev.filter(a => a.regionId !== selectedRegion.id));
      setSelectedRegion(null);
    } finally {
      setSaving(false);
    }
  };

  const imgW = 2788;
  const imgH = 1864;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">خريطة العين التفاعلية</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["right", "left"] as const).map(e => (
            <button
              key={e}
              onClick={() => { setEye(e); setAnnotations([]); setSelectedRegion(null); }}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${eye === e ? "bg-white shadow text-blue-700 font-semibold" : "text-gray-500 hover:text-gray-700"}`}
            >
              {e === "right" ? "العين اليمنى" : "العين اليسرى"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* ── Map ── */}
        <div
          className="relative flex-1 min-w-0 rounded-xl overflow-hidden border border-gray-200"
          style={{ aspectRatio: `${imgW}/${imgH}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eye-map.jpg"
            alt="صورة العين"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <svg
            viewBox={`0 0 ${imgW} ${imgH}`}
            className="absolute inset-0 w-full h-full"
            style={{ cursor: "pointer" }}
          >
            {REGIONS.map(region => {
              const ann = getAnnotation(region.id);
              const isSelected = selectedRegion?.id === region.id;
              const fill = ann ? ann.color : "transparent";
              const fillOpacity = ann ? 0.4 : 0;
              const stroke = isSelected ? "#ffffff" : ann ? ann.color : "rgba(255,255,255,0.6)";
              const strokeOpacity = isSelected ? 1 : ann ? 0.8 : 0;
              const strokeWidth = isSelected ? 5 : 3;

              const props = {
                fill,
                fillOpacity,
                stroke,
                strokeOpacity: isSelected ? 1 : strokeOpacity,
                strokeWidth,
                strokeDasharray: isSelected ? "10 5" : undefined,
                onClick: () => handleClick(region),
                style: { cursor: "pointer", transition: "all 0.15s" },
              };

              if (region.shape === "ellipse") {
                return <ellipse key={region.id} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...props} />;
              }
              return <rect key={region.id} x={region.x} y={region.y} width={region.w} height={region.h} rx={region.rx ?? 10} {...props} />;
            })}

            {/* Region labels on hover (always show selected) */}
            {selectedRegion && (() => {
              const r = selectedRegion;
              const lx = r.shape === "ellipse" ? r.cx : r.x + r.w / 2;
              const ly = r.shape === "ellipse" ? r.cy - r.ry - 30 : r.y - 20;
              return (
                <text x={lx} y={ly} textAnchor="middle" fill="white" fontSize={60} fontWeight="bold"
                  style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}>
                  {r.labelAr}
                </text>
              );
            })()}
          </svg>
        </div>

        {/* ── Panel ── */}
        <div className="w-full lg:w-64 space-y-3 shrink-0">
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
                {getAnnotation(selectedRegion.id) && (
                  <button onClick={handleRemove} disabled={saving}
                    className="px-3 bg-red-50 text-red-600 text-xs py-2 rounded-lg hover:bg-red-100">
                    حذف
                  </button>
                )}
                <button onClick={() => setSelectedRegion(null)}
                  className="px-3 bg-gray-50 text-gray-600 text-xs py-2 rounded-lg hover:bg-gray-100">
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
              انقر على منطقة العين لتسجيل الملاحظة
            </div>
          )}

          {annotations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">المناطق المُحددة</p>
              {annotations.map(ann => {
                const region = REGIONS.find(r => r.id === ann.regionId);
                const cond = CONDITION_TYPES.find(c => c.key === ann.condition);
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
