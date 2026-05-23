"use client";

import { useState } from "react";

const CONDITION_TYPES = [
  { key: "pain",         labelAr: "ألم",           color: "#ef4444" },
  { key: "inflamed",     labelAr: "التهاب",        color: "#f97316" },
  { key: "stone",        labelAr: "حصوة",          color: "#eab308" },
  { key: "cyst",         labelAr: "كيس",           color: "#8b5cf6" },
  { key: "tumor",        labelAr: "ورم",           color: "#dc2626" },
  { key: "abscess",      labelAr: "خراج",          color: "#a16207" },
  { key: "bleeding",     labelAr: "نزيف",          color: "#b91c1c" },
  { key: "obstruction",  labelAr: "انسداد",        color: "#0369a1" },
  { key: "chronic",      labelAr: "مزمن",          color: "#475569" },
  { key: "other",        labelAr: "أخرى",          color: "#6b7280" },
];

// SVG viewBox: 0 0 1363 1211  (landscape — body figure centered ~x=640)
// Anatomical convention: patient RIGHT = screen LEFT (front view)
type Organ = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const ORGANS: Organ[] = [
  // ── HEAD & NECK ──────────────────────────────────────────────────────────
  { id: "brain",         labelAr: "الدماغ",             shape: "ellipse", cx: 640, cy: 85,  rx: 85,  ry: 80  },
  { id: "pharynx",       labelAr: "الحلق / البلعوم",    shape: "ellipse", cx: 640, cy: 195, rx: 45,  ry: 40  },
  { id: "thyroid",       labelAr: "الغدة الدرقية",       shape: "ellipse", cx: 640, cy: 248, rx: 55,  ry: 26  },

  // ── THORAX ───────────────────────────────────────────────────────────────
  { id: "right_lung",    labelAr: "الرئة اليمنى",       shape: "ellipse", cx: 575, cy: 310, rx: 52,  ry: 88  },
  { id: "left_lung",     labelAr: "الرئة اليسرى",       shape: "ellipse", cx: 720, cy: 310, rx: 52,  ry: 88  },
  { id: "heart",         labelAr: "القلب",               shape: "ellipse", cx: 618, cy: 390, rx: 50,  ry: 55  },

  // ── UPPER ABDOMEN ─────────────────────────────────────────────────────────
  { id: "liver",         labelAr: "الكبد",               shape: "ellipse", cx: 594, cy: 490, rx: 82,  ry: 56  },
  { id: "gallbladder",   labelAr: "المرارة",              shape: "ellipse", cx: 620, cy: 553, rx: 28,  ry: 28  },
  { id: "stomach",       labelAr: "المعدة",               shape: "ellipse", cx: 700, cy: 495, rx: 52,  ry: 52  },
  { id: "spleen",        labelAr: "الطحال",               shape: "ellipse", cx: 765, cy: 468, rx: 40,  ry: 44  },
  { id: "pancreas",      labelAr: "البنكرياس",            shape: "rect",    x: 565,  y: 555,  w: 168,  h: 36, rx: 18 },

  // ── MIDDLE ABDOMEN ────────────────────────────────────────────────────────
  { id: "right_kidney",  labelAr: "الكلية اليمنى",       shape: "ellipse", cx: 562, cy: 600, rx: 33,  ry: 50  },
  { id: "left_kidney",   labelAr: "الكلية اليسرى",       shape: "ellipse", cx: 735, cy: 600, rx: 33,  ry: 50  },
  { id: "small_bowel",   labelAr: "الأمعاء الدقيقة",     shape: "ellipse", cx: 643, cy: 730, rx: 110, ry: 95  },
  { id: "large_bowel",   labelAr: "الأمعاء الغليظة",     shape: "rect",    x: 510,  y: 640,  w: 270,  h: 200, rx: 30 },

  // ── LOWER ABDOMEN ─────────────────────────────────────────────────────────
  { id: "bladder",       labelAr: "المثانة",              shape: "ellipse", cx: 640, cy: 1000, rx: 65, ry: 50  },
  { id: "aorta",         labelAr: "الشريان الأورطي",     shape: "rect",    x: 628,  y: 290,  w: 30,   h: 680, rx: 15 },
];

type Annotation = {
  organId: string;
  condition: string;
  color: string;
  notes?: string;
};

type Props = {
  patientId: string;
  clinicId: string;
  initialAnnotations?: Annotation[];
};

export default function InternalOrgansClient({ patientId, clinicId, initialAnnotations = [] }: Props) {
  const [annotations, setAnnotations]     = useState<Annotation[]>(initialAnnotations);
  const [selectedOrgan, setSelectedOrgan] = useState<Organ | null>(null);
  const [selectedCond, setSelectedCond]   = useState(CONDITION_TYPES[0].key);
  const [notes, setNotes]                 = useState("");
  const [saving, setSaving]               = useState(false);

  const getAnnotation = (organId: string) => annotations.find(a => a.organId === organId);

  const handleOrganClick = (organ: Organ) => {
    const existing = getAnnotation(organ.id);
    setSelectedOrgan(organ);
    setSelectedCond(existing?.condition ?? CONDITION_TYPES[0].key);
    setNotes(existing?.notes ?? "");
  };

  const handleSave = async () => {
    if (!selectedOrgan) return;
    setSaving(true);
    const condType = CONDITION_TYPES.find(c => c.key === selectedCond)!;
    const newAnnotation: Annotation = {
      organId: selectedOrgan.id,
      condition: selectedCond,
      color: condType.color,
      notes,
    };
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialtyCode: "internal_medicine",
          regionId: selectedOrgan.id,
          label: condType.labelAr,
          color: condType.color,
          notes,
        }),
      });
      setAnnotations(prev => {
        const filtered = prev.filter(a => a.organId !== selectedOrgan.id);
        return [...filtered, newAnnotation];
      });
      setSelectedOrgan(null);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedOrgan) return;
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialtyCode: "internal_medicine",
          regionId: selectedOrgan.id,
        }),
      });
      setAnnotations(prev => prev.filter(a => a.organId !== selectedOrgan.id));
      setSelectedOrgan(null);
    } finally {
      setSaving(false);
    }
  };

  const svgW = 1363;
  const svgH = 1211;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">خريطة الأعضاء الداخلية</h3>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* ── Map ── */}
        <div className="relative flex-1 min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ aspectRatio: `${svgW}/${svgH}` }}>
          {/* Background anatomical image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/organs-map.svg"
            alt="خريطة الأعضاء"
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* SVG overlay — clickable organ regions */}
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="absolute inset-0 w-full h-full"
            style={{ cursor: "pointer" }}
          >
            {ORGANS.map(organ => {
              const ann = getAnnotation(organ.id);
              const isSelected = selectedOrgan?.id === organ.id;
              const fillColor = "transparent";
              const fillOpacity = 0;
              const stroke = isSelected ? "#1d4ed8" : ann ? ann.color : "#64748b";
              const strokeOpacity = isSelected ? 1 : ann ? 0.7 : 0;
              const strokeWidth = isSelected ? 3 : 2;

              const commonProps = {
                fill: fillColor,
                fillOpacity,
                stroke,
                strokeOpacity: isSelected ? 1 : strokeOpacity,
                strokeWidth,
                strokeDasharray: isSelected ? "6 3" : undefined,
                onClick: () => handleOrganClick(organ),
                style: { cursor: "pointer", transition: "all 0.15s" },
                className: "hover:fill-blue-400 hover:fill-opacity-20",
              };

              if (organ.shape === "ellipse") {
                return (
                  <ellipse key={organ.id} cx={organ.cx} cy={organ.cy} rx={organ.rx} ry={organ.ry} {...commonProps} />
                );
              }
              return (
                <rect key={organ.id} x={organ.x} y={organ.y} width={organ.w} height={organ.h} rx={organ.rx ?? 8} {...commonProps} />
              );
            })}
            {ORGANS.map(organ => {
              const ann = getAnnotation(organ.id);
              const isSelected = selectedOrgan?.id === organ.id;
              if (!ann && !isSelected) return null;
              const x = organ.shape === "ellipse" ? organ.cx : organ.x + organ.w / 2;
              const y = organ.shape === "ellipse" ? organ.cy : organ.y + organ.h / 2;
              const color = ann?.color ?? "#1d4ed8";
              return (
                <g key={`${organ.id}-marker`}>
                  <circle cx={x} cy={y} r={isSelected ? 26 : 20} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={isSelected ? 6 : 4} strokeDasharray={isSelected ? "8 4" : undefined} />
                  <circle cx={x} cy={y} r={5} fill={color} />
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Panel ── */}
        <div className="w-full lg:w-64 space-y-3 shrink-0">
          {selectedOrgan ? (
            <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-blue-800 text-sm">{selectedOrgan.labelAr}</p>

              <div className="grid grid-cols-2 gap-1.5">
                {CONDITION_TYPES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setSelectedCond(c.key)}
                    className="text-xs px-2 py-1.5 rounded-lg border transition-all"
                    style={{
                      backgroundColor: selectedCond === c.key ? c.color : "white",
                      borderColor: c.color,
                      color: selectedCond === c.key ? "white" : c.color,
                      fontWeight: selectedCond === c.key ? 700 : 400,
                    }}
                  >
                    {c.labelAr}
                  </button>
                ))}
              </div>

              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ملاحظات..."
                rows={3}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-blue-400"
                dir="rtl"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "..." : "حفظ"}
                </button>
                {getAnnotation(selectedOrgan.id) && (
                  <button
                    onClick={handleRemove}
                    disabled={saving}
                    className="px-3 bg-red-50 text-red-600 text-xs py-2 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    حذف
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrgan(null)}
                  className="px-3 bg-gray-50 text-gray-600 text-xs py-2 rounded-lg hover:bg-gray-100"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
              انقر على عضو لتسجيل الملاحظة
            </div>
          )}

          {/* Legend */}
          {annotations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">الأعضاء المُحددة</p>
              {annotations.map(ann => {
                const organ = ORGANS.find(o => o.id === ann.organId);
                const cond = CONDITION_TYPES.find(c => c.key === ann.condition);
                return (
                  <div key={ann.organId} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ann.color }} />
                    <span className="text-gray-700 font-medium">{organ?.labelAr}</span>
                    <span className="text-gray-400">— {cond?.labelAr}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Color key */}
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
