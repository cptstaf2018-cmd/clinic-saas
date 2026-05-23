"use client";

import { useState } from "react";

const CONDITIONS = [
  { key: "detachment",  labelAr: "انفصال شبكية",       color: "#ef4444" },
  { key: "hemorrhage",  labelAr: "نزيف",                color: "#dc2626" },
  { key: "exudate",     labelAr: "إفرازات صلبة",        color: "#f59e0b" },
  { key: "tear",        labelAr: "ثقب / تمزق",          color: "#f97316" },
  { key: "diabetic",    labelAr: "تغيرات سكري",         color: "#8b5cf6" },
  { key: "degeneration",labelAr: "ضمور بقعي",           color: "#6366f1" },
  { key: "neovasc",     labelAr: "أوعية دموية جديدة",   color: "#0891b2" },
  { key: "laser",       labelAr: "ليزر",                color: "#84cc16" },
  { key: "glaucoma",    labelAr: "زرق / جلوكوما",       color: "#475569" },
  { key: "other",       labelAr: "أخرى",               color: "#6b7280" },
];

// SVG arc sector helper — angles in degrees, clockwise (SVG convention)
function arc(cx: number, cy: number, r1: number, r2: number, a1: number, a2: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const c = Math.cos, s = Math.sin;
  const large = a2 - a1 > 180 ? 1 : 0;
  const x1o = cx + r2 * c(rad(a1)), y1o = cy + r2 * s(rad(a1));
  const x2o = cx + r2 * c(rad(a2)), y2o = cy + r2 * s(rad(a2));
  if (r1 === 0) {
    return `M ${cx} ${cy} L ${x1o} ${y1o} A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o} Z`;
  }
  const x1i = cx + r1 * c(rad(a2)), y1i = cy + r1 * s(rad(a2));
  const x2i = cx + r1 * c(rad(a1)), y2i = cy + r1 * s(rad(a1));
  return `M ${x1o} ${y1o} A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${r1} ${r1} 0 ${large} 0 ${x2i} ${y2i} Z`;
}

// SVG angles: 0=right, 90=down, 180=left, 270=top(-90=top)
// Quadrants clockwise from top: top-right(-90→0), bot-right(0→90), bot-left(90→180), top-left(180→270)
const R_OUT = 220;   // outer boundary
const R_MID = 130;   // equator / posterior pole boundary
const R_DISC = 24;   // optic disc
const R_MAC  = 16;   // macula

const EYES = {
  OD: { cx: 270, cy: 380, label: "OD", sublabel: "العين اليمنى", discDx: -55, discDy: 0, macDx: 55, macDy: 0 },
  OS: { cx: 900, cy: 380, label: "OS", sublabel: "العين اليسرى", discDx:  55, discDy: 0, macDx:-55, macDy: 0 },
} as const;

type EyeKey = keyof typeof EYES;

interface Zone { id: string; labelAr: string; path: string }

function buildZones(eye: EyeKey): Zone[] {
  const { cx, cy } = EYES[eye];
  const isOD = eye === "OD";
  // Quadrant label helpers
  const sup = "علوي", inf = "سفلي";
  const temp = "صدغي", nas = "أنفي";
  // For OD: right side = temporal, left = nasal. For OS: reversed.
  const [topRight, botRight, botLeft, topLeft] = isOD
    ? [`${sup} ${temp}`, `${inf} ${temp}`, `${inf} ${nas}`, `${sup} ${nas}`]
    : [`${sup} ${nas}`,  `${inf} ${nas}`,  `${inf} ${temp}`, `${sup} ${temp}`];

  return [
    // Peripheral ring (4 quadrants)
    { id: `${eye}_per_tr`, labelAr: `محيط ${topRight}`,  path: arc(cx, cy, R_MID, R_OUT, -90, 0) },
    { id: `${eye}_per_br`, labelAr: `محيط ${botRight}`,  path: arc(cx, cy, R_MID, R_OUT, 0, 90) },
    { id: `${eye}_per_bl`, labelAr: `محيط ${botLeft}`,   path: arc(cx, cy, R_MID, R_OUT, 90, 180) },
    { id: `${eye}_per_tl`, labelAr: `محيط ${topLeft}`,   path: arc(cx, cy, R_MID, R_OUT, 180, 270) },
    // Posterior pole (4 quadrants)
    { id: `${eye}_post_tr`, labelAr: `قطب خلفي ${topRight}`,  path: arc(cx, cy, 0, R_MID, -90, 0) },
    { id: `${eye}_post_br`, labelAr: `قطب خلفي ${botRight}`,  path: arc(cx, cy, 0, R_MID, 0, 90) },
    { id: `${eye}_post_bl`, labelAr: `قطب خلفي ${botLeft}`,   path: arc(cx, cy, 0, R_MID, 90, 180) },
    { id: `${eye}_post_tl`, labelAr: `قطب خلفي ${topLeft}`,   path: arc(cx, cy, 0, R_MID, 180, 270) },
  ];
}

function zonePoint(id: string) {
  const eye = id.startsWith("OD") ? "OD" : "OS";
  const eyeInfo = EYES[eye];
  const { cx, cy, discDx, discDy, macDx, macDy } = eyeInfo;
  if (id.endsWith("_disc")) return { x: cx + discDx, y: cy + discDy };
  if (id.endsWith("_macula")) return { x: cx + macDx, y: cy + macDy };

  const radius = id.includes("_per_") ? (R_MID + R_OUT) / 2 : R_MID / 2;
  const suffix = id.slice(-2);
  const angles: Record<string, number> = { tr: -45, br: 45, bl: 135, tl: 225 };
  const angle = (angles[suffix] ?? 0) * Math.PI / 180;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

type Annotation = { zoneId: string; condition: string; color: string; notes?: string };
type Props = { patientId: string; initialAnnotations?: Annotation[] };

export default function EyeMapClient({ patientId, initialAnnotations = [] }: Props) {
  const [annotations, setAnnotations]     = useState<Annotation[]>(initialAnnotations);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedCond, setSelectedCond]   = useState(CONDITIONS[0].key);
  const [notes, setNotes]                 = useState("");
  const [saving, setSaving]               = useState(false);

  const getAnn = (id: string) => annotations.find(a => a.zoneId === id);

  const pick = (id: string, label: string) => {
    const ex = getAnn(id);
    setSelectedId(id); setSelectedLabel(label);
    setSelectedCond(ex?.condition ?? CONDITIONS[0].key);
    setNotes(ex?.notes ?? "");
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    const cond = CONDITIONS.find(c => c.key === selectedCond)!;
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialtyCode: "ophthalmology", regionId: selectedId, label: cond.labelAr, color: cond.color, notes }),
      });
      setAnnotations(prev => [...prev.filter(a => a.zoneId !== selectedId), { zoneId: selectedId, condition: selectedCond, color: cond.color, notes }]);
      setSelectedId(null);
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}/annotations`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialtyCode: "ophthalmology", regionId: selectedId }),
      });
      setAnnotations(prev => prev.filter(a => a.zoneId !== selectedId));
      setSelectedId(null);
    } finally { setSaving(false); }
  };

  const renderEye = (eye: EyeKey) => {
    const { cx, cy, label, sublabel, discDx, discDy, macDx, macDy } = EYES[eye];
    const zones = buildZones(eye);
    const discId = `${eye}_disc`, macId = `${eye}_macula`;

    return (
      <g key={eye}>
        {/* Outer background */}
        <circle cx={cx} cy={cy} r={R_OUT} fill="#fafafa" stroke="#1e293b" strokeWidth={2.5} />

        {/* Zones */}
        {zones.map(z => {
          const sel = selectedId === z.id;
          return (
            <path key={z.id} d={z.path}
              fill="transparent"
              fillOpacity={0}
              stroke={sel ? "#2563eb" : "#cbd5e1"}
              strokeWidth={sel ? 2 : 1}
              strokeDasharray={sel ? "5 3" : undefined}
              className="cursor-pointer hover:fill-blue-100 hover:fill-opacity-50"
              onClick={() => pick(z.id, z.labelAr)} />
          );
        })}

        {/* Rings */}
        <circle cx={cx} cy={cy} r={R_MID} fill="none" stroke="#94a3b8" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={R_OUT} fill="none" stroke="#1e293b" strokeWidth={2.5} />

        {/* Cross dividers */}
        <line x1={cx} y1={cy - R_OUT} x2={cx} y2={cy + R_OUT} stroke="#94a3b8" strokeWidth={1} />
        <line x1={cx - R_OUT} y1={cy} x2={cx + R_OUT} y2={cy} stroke="#94a3b8" strokeWidth={1} />

        {/* Optic disc */}
        {(() => {
          const sel = selectedId === discId;
          const dx = cx + discDx, dy = cy + discDy;
          return (
            <g onClick={() => pick(discId, `القرص البصري (${label})`)} className="cursor-pointer">
              <circle cx={dx} cy={dy} r={R_DISC}
                fill="#fef3c7"
                fillOpacity={1}
                stroke={sel ? "#2563eb" : "#d97706"}
                strokeWidth={sel ? 3 : 2} />
              <circle cx={dx} cy={dy} r={R_DISC * 0.5} fill="#fde68a" stroke="#d97706" strokeWidth={1} />
              <text x={dx} y={dy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#78350f" fontWeight="bold" style={{ pointerEvents: "none" }}>Disc</text>
            </g>
          );
        })()}

        {/* Macula */}
        {(() => {
          const sel = selectedId === macId;
          const mx = cx + macDx, my = cy + macDy;
          return (
            <g onClick={() => pick(macId, `البقعة الصفراء (${label})`)} className="cursor-pointer">
              <circle cx={mx} cy={my} r={R_MAC}
                fill="#fdf2f8"
                fillOpacity={1}
                stroke={sel ? "#2563eb" : "#db2777"}
                strokeWidth={sel ? 3 : 2} />
              <circle cx={mx} cy={my} r={5} fill="#db2777" style={{ pointerEvents: "none" }} />
            </g>
          );
        })()}

        {/* Labels */}
        <text x={cx} y={cy - R_OUT - 22} textAnchor="middle" fontSize={18} fontWeight="900" fill="#0f172a">{label}</text>
        <text x={cx} y={cy - R_OUT - 6} textAnchor="middle" fontSize={11} fill="#64748b">{sublabel}</text>
        <text x={cx} y={cy - R_MID - 8} textAnchor="middle" fontSize={8} fill="#94a3b8">Superior</text>
        <text x={cx} y={cy + R_MID + 14} textAnchor="middle" fontSize={8} fill="#94a3b8">Inferior</text>
        <text x={cx + (eye === "OD" ? -R_OUT + 6 : R_OUT - 6)} y={cy + 3} textAnchor="middle" fontSize={8} fill="#94a3b8">N</text>
        <text x={cx + (eye === "OD" ? R_OUT - 6 : -R_OUT + 6)} y={cy + 3} textAnchor="middle" fontSize={8} fill="#94a3b8">T</text>

        {/* Annotations count badge */}
        {annotations.filter(a => a.zoneId.startsWith(eye)).map((ann) => {
          const point = zonePoint(ann.zoneId);
          const sel = selectedId === ann.zoneId;
          return (
            <g key={`${ann.zoneId}-marker`} onClick={() => pick(ann.zoneId, allAnnotated.find(a => a.zoneId === ann.zoneId)?.label ?? ann.zoneId)} className="cursor-pointer">
              <circle cx={point.x} cy={point.y} r={sel ? 17 : 12} fill={ann.color} fillOpacity={0.32} stroke={ann.color} strokeWidth={sel ? 5 : 3} strokeDasharray={sel ? "5 3" : undefined} />
              <circle cx={point.x} cy={point.y} r={3.5} fill={ann.color} />
            </g>
          );
        })}
        {(() => {
          const count = annotations.filter(a => a.zoneId.startsWith(eye)).length;
          return count > 0 ? (
            <g>
              <circle cx={cx + R_OUT - 10} cy={cy - R_OUT + 10} r={12} fill="#ef4444" />
              <text x={cx + R_OUT - 10} y={cy - R_OUT + 10} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white" fontWeight="bold">{count}</text>
            </g>
          ) : null;
        })()}
      </g>
    );
  };

  const allAnnotated = annotations.map(ann => {
    const allZones = [...buildZones("OD"), ...buildZones("OS"),
      { id: "OD_disc", labelAr: "القرص البصري (OD)" },
      { id: "OD_macula", labelAr: "البقعة الصفراء (OD)" },
      { id: "OS_disc", labelAr: "القرص البصري (OS)" },
      { id: "OS_macula", labelAr: "البقعة الصفراء (OS)" },
    ];
    return { ...ann, label: allZones.find(z => z.id === ann.zoneId)?.labelAr ?? ann.zoneId };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">مخطط قاع العين — Fundus Diagram</h3>

      <div className="flex flex-col xl:flex-row gap-4">
        {/* Fundus SVG */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <svg viewBox="0 0 1170 760" className="w-full" style={{ cursor: "crosshair" }}>
            <rect width="1170" height="760" fill="#f8fafc" />
            {/* Separator */}
            <line x1="585" y1="60" x2="585" y2="690" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="6 4" />
            {/* Eyes */}
            {renderEye("OD")}
            {renderEye("OS")}
            {/* Selected hint */}
            {selectedId && (
              <text x="585" y="730" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#2563eb">
                ✦ {selectedLabel}
              </text>
            )}
            {!selectedId && (
              <text x="585" y="730" textAnchor="middle" fontSize="11" fill="#94a3b8">
                انقر على أي منطقة لتوثيق الحالة
              </text>
            )}
          </svg>
        </div>

        {/* Panel */}
        <div className="w-full xl:w-60 space-y-3 shrink-0">
          {selectedId ? (
            <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-blue-800 text-sm">{selectedLabel}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CONDITIONS.map(c => (
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
                <button onClick={save} disabled={saving}
                  className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "..." : "حفظ"}
                </button>
                {getAnn(selectedId) && (
                  <button onClick={remove} disabled={saving}
                    className="px-3 bg-red-50 text-red-600 text-xs py-2 rounded-lg hover:bg-red-100">حذف</button>
                )}
                <button onClick={() => setSelectedId(null)}
                  className="px-3 bg-gray-50 text-gray-600 text-xs py-2 rounded-lg hover:bg-gray-100">إغلاق</button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
              انقر على منطقة في المخطط
            </div>
          )}

          {allAnnotated.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">التوثيق ({allAnnotated.length})</p>
              {allAnnotated.map(ann => {
                const cond = CONDITIONS.find(c => c.key === ann.condition);
                return (
                  <div key={ann.zoneId} className="flex items-start gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: ann.color }} />
                    <div>
                      <span className="text-gray-700 font-medium">{ann.label}</span>
                      <span className="text-gray-400"> — {cond?.labelAr}</span>
                      {ann.notes && <p className="text-gray-400 text-[10px] mt-0.5">{ann.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-600 mb-2">دليل الألوان</p>
            {CONDITIONS.map(c => (
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
