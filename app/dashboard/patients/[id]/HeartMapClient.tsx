"use client";

import { useState } from "react";
import type { MouseEvent } from "react";

const CONDITION_TYPES = [
  { key: "blockage",     labelAr: "انسداد",           color: "#dc2626" },
  { key: "valve",        labelAr: "خلل صمام",         color: "#f97316" },
  { key: "arrhythmia",   labelAr: "اضطراب نظم",       color: "#8b5cf6" },
  { key: "heart_fail",   labelAr: "فشل قلبي",         color: "#1d4ed8" },
  { key: "congenital",   labelAr: "خلقي",              color: "#0891b2" },
  { key: "pericarditis", labelAr: "التهاب تامور",      color: "#f59e0b" },
  { key: "hypertrophy",  labelAr: "تضخم",              color: "#7c3aed" },
  { key: "thrombus",     labelAr: "جلطة",              color: "#b91c1c" },
  { key: "ischemia",     labelAr: "نقص تروية",        color: "#ea580c" },
  { key: "other",        labelAr: "أخرى",             color: "#6b7280" },
];

// Image: 1280 × 896 px — OpenStax anterior view (CC BY)
// Heart center ≈ (580, 430)
type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const REGIONS: Region[] = [
  // ── Chambers ─────────────────────────────────────────────────────────────
  { id: "right_atrium",    labelAr: "الأذين الأيمن",         shape: "ellipse", cx: 340, cy: 400, rx: 90,  ry: 100 },
  { id: "left_atrium",     labelAr: "الأذين الأيسر",          shape: "ellipse", cx: 750, cy: 310, rx: 110, ry: 85  },
  { id: "right_ventricle", labelAr: "البطين الأيمن",          shape: "ellipse", cx: 440, cy: 600, rx: 110, ry: 130 },
  { id: "left_ventricle",  labelAr: "البطين الأيسر",          shape: "ellipse", cx: 720, cy: 590, rx: 100, ry: 140 },
  { id: "septum",          labelAr: "الحاجز البطيني",         shape: "rect",    x: 555, y: 430,  w: 50,   h: 220, rx: 15 },

  // ── Valves ────────────────────────────────────────────────────────────────
  { id: "tricuspid",       labelAr: "الصمام ثلاثي الشُرَف",  shape: "ellipse", cx: 400, cy: 500, rx: 55,  ry: 45  },
  { id: "mitral",          labelAr: "الصمام التاجي",          shape: "ellipse", cx: 680, cy: 440, rx: 55,  ry: 45  },
  { id: "aortic_valve",    labelAr: "الصمام الأورطي",         shape: "ellipse", cx: 565, cy: 370, rx: 45,  ry: 40  },
  { id: "pulm_valve",      labelAr: "الصمام الرئوي",          shape: "ellipse", cx: 470, cy: 330, rx: 45,  ry: 40  },

  // ── Major Vessels ─────────────────────────────────────────────────────────
  { id: "aorta",           labelAr: "الشريان الأورطي",        shape: "ellipse", cx: 540, cy: 95,  rx: 70,  ry: 80  },
  { id: "sup_vena_cava",   labelAr: "الوريد الأجوف العلوي",  shape: "ellipse", cx: 380, cy: 105, rx: 55,  ry: 80  },
  { id: "inf_vena_cava",   labelAr: "الوريد الأجوف السفلي",  shape: "ellipse", cx: 335, cy: 760, rx: 55,  ry: 60  },
  { id: "pulm_trunk",      labelAr: "الجذع الرئوي",           shape: "ellipse", cx: 455, cy: 180, rx: 60,  ry: 60  },
  { id: "r_pulm_artery",   labelAr: "الشريان الرئوي الأيمن", shape: "rect",    x: 270, y: 185,  w: 120,  h: 45, rx: 20 },
  { id: "l_pulm_artery",   labelAr: "الشريان الرئوي الأيسر", shape: "rect",    x: 710, y: 140,  w: 150,  h: 45, rx: 20 },
  { id: "r_pulm_veins",    labelAr: "الأوردة الرئوية اليمنى",shape: "rect",    x: 215, y: 300,  w: 95,   h: 100, rx: 20 },
  { id: "l_pulm_veins",    labelAr: "الأوردة الرئوية اليسرى",shape: "rect",    x: 870, y: 270,  w: 95,   h: 100, rx: 20 },

  // ── Myocardium ────────────────────────────────────────────────────────────
  { id: "myocardium",      labelAr: "عضلة القلب",             shape: "ellipse", cx: 850, cy: 620, rx: 60,  ry: 40  },
  { id: "pericardium",     labelAr: "التامور",                shape: "ellipse", cx: 850, cy: 550, rx: 60,  ry: 35  },
];

type Annotation = { regionId: string; condition: string; color: string; notes?: string };
type Props      = { patientId: string; initialAnnotations?: Annotation[] };
type PointSelection = { id: string; x: number; y: number; saved: boolean };

function makePointId(x: number, y: number) {
  return `point:heart:${x.toFixed(1)}:${y.toFixed(1)}:${Date.now()}`;
}

function parsePointId(id: string): PointSelection | null {
  const [prefix, map, x, y] = id.split(":");
  if (prefix !== "point" || map !== "heart") return null;
  const px = Number(x);
  const py = Number(y);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  return { id, x: px, y: py, saved: true };
}

export default function HeartMapClient({ patientId, initialAnnotations = [] }: Props) {
  const [annotations, setAnnotations]       = useState<Annotation[]>(initialAnnotations);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedPoint, setSelectedPoint]   = useState<PointSelection | null>(null);
  const [selectedCond, setSelectedCond]     = useState(CONDITION_TYPES[0].key);
  const [notes, setNotes]                   = useState("");
  const [saving, setSaving]                 = useState(false);

  const getAnn = (id: string) => annotations.find(a => a.regionId === id);
  const pointAnnotations = annotations
    .map((annotation) => ({ annotation, point: parsePointId(annotation.regionId) }))
    .filter((item): item is { annotation: Annotation; point: PointSelection } => !!item.point);

  const handleClick = (region: Region) => {
    const existing = getAnn(region.id);
    setSelectedRegion(region);
    setSelectedPoint(null);
    setSelectedCond(existing?.condition ?? CONDITION_TYPES[0].key);
    setNotes(existing?.notes ?? "");
  };

  const handlePointClick = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * imgW;
    const y = ((event.clientY - rect.top) / rect.height) * imgH;
    setSelectedRegion(null);
    setSelectedPoint({ id: makePointId(x, y), x, y, saved: false });
    setSelectedCond(CONDITION_TYPES[0].key);
    setNotes("");
  };

  const handleSavedPointClick = (event: MouseEvent<SVGGElement>, point: PointSelection) => {
    event.stopPropagation();
    const existing = getAnn(point.id);
    setSelectedRegion(null);
    setSelectedPoint(point);
    setSelectedCond(existing?.condition ?? CONDITION_TYPES[0].key);
    setNotes(existing?.notes ?? "");
  };

  const handleSave = async () => {
    const regionId = selectedPoint?.id ?? selectedRegion?.id;
    if (!regionId) return;
    setSaving(true);
    const cond = CONDITION_TYPES.find(c => c.key === selectedCond)!;
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialtyCode: "cardiology",
          regionId,
          label: cond.labelAr,
          color: cond.color,
          notes,
        }),
      });
      setAnnotations(prev => [
        ...prev.filter(a => a.regionId !== regionId),
        { regionId, condition: selectedCond, color: cond.color, notes },
      ]);
      setSelectedRegion(null);
      setSelectedPoint(null);
    } finally { setSaving(false); }
  };

  const handleRemove = async () => {
    const regionId = selectedPoint?.id ?? selectedRegion?.id;
    if (!regionId) return;
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialtyCode: "cardiology", regionId }),
      });
      setAnnotations(prev => prev.filter(a => a.regionId !== regionId));
      setSelectedRegion(null);
      setSelectedPoint(null);
    } finally { setSaving(false); }
  };

  const imgW = 1280;
  const imgH = 896;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">خريطة القلب التفاعلية</h3>

      <div className="flex flex-col xl:flex-row gap-4">
        {/* ── Map ── */}
        <div className="flex-1 min-w-0 relative rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ aspectRatio: `${imgW}/${imgH}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/heart-map.jpg" alt="خريطة القلب" className="absolute inset-0 w-full h-full object-contain" />

          <svg viewBox={`0 0 ${imgW} ${imgH}`} onClick={handlePointClick} className="absolute inset-0 w-full h-full" style={{ cursor: "pointer" }}>
            {REGIONS.map(region => {
              const ann   = getAnn(region.id);
              const isSel = selectedRegion?.id === region.id;
              const props = {
                fill:          "transparent",
                fillOpacity:   0,
                stroke:        isSel ? "#facc15" : ann ? ann.color : "rgba(0,0,0,0.3)",
                strokeOpacity: isSel ? 1 : ann ? 0.8 : 0,
                strokeWidth:   isSel ? 5 : 3,
                strokeDasharray: isSel ? "10 5" : undefined,
                onClick: () => handleClick(region),
                style: { cursor: "pointer", transition: "all 0.15s" },
                className: "hover:fill-yellow-300 hover:fill-opacity-20",
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
              const color = ann?.color ?? "#dc2626";
              return (
                <g key={`${region.id}-marker`}>
                  <circle cx={x} cy={y} r={isSel ? 30 : 22} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={isSel ? 7 : 5} strokeDasharray={isSel ? "10 5" : undefined} />
                  <circle cx={x} cy={y} r={6} fill={color} />
                </g>
              );
            })}

            {pointAnnotations.map(({ annotation, point }) => {
              const isSel = selectedPoint?.id === point.id;
              return (
                <g key={point.id} onClick={(event) => handleSavedPointClick(event, point)} style={{ cursor: "pointer" }}>
                  <circle cx={point.x} cy={point.y} r={isSel ? 30 : 22} fill={annotation.color} fillOpacity={0.32} stroke={annotation.color} strokeWidth={isSel ? 7 : 5} />
                  <circle cx={point.x} cy={point.y} r={6} fill={annotation.color} />
                </g>
              );
            })}
            {selectedPoint && !selectedPoint.saved && (
              <g>
                <circle cx={selectedPoint.x} cy={selectedPoint.y} r={30} fill="#dc2626" fillOpacity={0.18} stroke="#dc2626" strokeWidth={6} strokeDasharray="10 5" />
                <circle cx={selectedPoint.x} cy={selectedPoint.y} r={6} fill="#dc2626" />
              </g>
            )}

            {/* Selected label */}
            {selectedRegion && (() => {
              const r  = selectedRegion;
              const lx = r.shape === "ellipse" ? r.cx : r.x + r.w / 2;
              const ly = r.shape === "ellipse" ? r.cy - r.ry - 30 : r.y - 20;
              return (
                <text x={lx} y={Math.max(50, ly)} textAnchor="middle" fill="#facc15" fontSize={40} fontWeight="bold"
                  style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.9))" }}>
                  {r.labelAr}
                </text>
              );
            })()}
          </svg>
        </div>

        {/* ── Panel ── */}
        <div className="w-full xl:w-60 space-y-3 shrink-0">
          {selectedRegion || selectedPoint ? (
            <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-red-800 text-sm">{selectedPoint ? "نقطة محددة على القلب" : selectedRegion?.labelAr}</p>
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
                className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-red-400" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-red-600 text-white text-xs py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {saving ? "..." : "حفظ"}
                </button>
                {getAnn(selectedPoint?.id ?? selectedRegion?.id ?? "") && (
                  <button onClick={handleRemove} disabled={saving}
                    className="px-3 bg-red-50 text-red-600 text-xs py-2 rounded-lg hover:bg-red-100">حذف</button>
                )}
                <button onClick={() => { setSelectedRegion(null); setSelectedPoint(null); }}
                  className="px-3 bg-gray-50 text-gray-600 text-xs py-2 rounded-lg hover:bg-gray-100">إغلاق</button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
              انقر على منطقة القلب لتسجيل الملاحظة
            </div>
          )}

          {annotations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">المناطق المُحددة</p>
              {annotations.map(ann => {
                const region = REGIONS.find(r => r.id === ann.regionId);
                const point = parsePointId(ann.regionId);
                const cond   = CONDITION_TYPES.find(c => c.key === ann.condition);
                return (
                  <div key={ann.regionId} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ann.color }} />
                    <span className="text-gray-700 font-medium">{region?.labelAr ?? (point ? "نقطة محددة" : ann.regionId)}</span>
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
