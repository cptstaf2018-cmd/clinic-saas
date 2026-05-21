type Annotation = { regionId: string; label: string; color: string; notes?: string | null };

type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

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

export default function PediatricBodyReport({ annotations }: { annotations: Annotation[] }) {
  if (annotations.length === 0) return null;

  const getAnn = (id: string) => annotations.find(a => a.regionId === id);

  return (
    <div className="flex gap-6 items-start">
      {/* Body SVG */}
      <div className="shrink-0" style={{ width: 180 }}>
        <svg viewBox="0 0 250 570" width="180" height="410" style={{ display: "block" }}>
          <rect width="250" height="570" fill="#ffffff"/>

          {/* ── Child body outline ── */}
          <ellipse cx="125" cy="52" rx="41" ry="46" fill="white" stroke="#374151" strokeWidth="2"/>
          <path d="M84 43 Q77 52 84 61" stroke="#374151" strokeWidth="1.5" fill="none"/>
          <path d="M166 43 Q173 52 166 61" stroke="#374151" strokeWidth="1.5" fill="none"/>
          <ellipse cx="111" cy="50" rx="5" ry="5.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
          <ellipse cx="139" cy="50" rx="5" ry="5.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
          <circle cx="111" cy="51" r="2.5" fill="#374151"/>
          <circle cx="139" cy="51" r="2.5" fill="#374151"/>
          <path d="M121 58 Q125 64 129 58" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M114 68 Q125 75 136 68" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M90 28 Q125 12 160 28" stroke="#374151" strokeWidth="1.5" fill="none"/>
          <path d="M112 96 L112 113 M138 96 L138 113" stroke="#374151" strokeWidth="1.8" fill="none"/>
          <path d="M112 113 Q74 117 64 132 L60 232 Q60 248 76 250 L174 250 Q190 248 190 232 L186 132 Q176 117 138 113 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>
          <circle cx="125" cy="210" r="2.5" fill="none" stroke="#374151" strokeWidth="1.5"/>
          <path d="M112 118 Q94 114 74 122" stroke="#374151" strokeWidth="1" fill="none"/>
          <path d="M138 118 Q156 114 176 122" stroke="#374151" strokeWidth="1" fill="none"/>
          {/* Arms */}
          <path d="M64 136 Q48 142 44 172 L42 252 Q42 266 54 268 L66 268 Q78 266 78 252 L76 172 Q72 142 64 136 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>
          <ellipse cx="55" cy="284" rx="14" ry="18" fill="white" stroke="#374151" strokeWidth="2"/>
          <path d="M186 136 Q202 142 206 172 L208 252 Q208 266 196 268 L184 268 Q172 266 172 252 L174 172 Q178 142 186 136 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>
          <ellipse cx="195" cy="284" rx="14" ry="18" fill="white" stroke="#374151" strokeWidth="2"/>
          {/* Hips */}
          <ellipse cx="125" cy="252" rx="52" ry="16" fill="white" stroke="#374151" strokeWidth="1.5"/>
          {/* Left leg */}
          <path d="M84 262 Q78 268 74 290 L70 396 Q70 411 82 413 L102 413 Q114 411 114 396 L112 290 Q110 268 104 262 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>
          <ellipse cx="93" cy="396" rx="13" ry="9" fill="white" stroke="#374151" strokeWidth="1.5"/>
          <path d="M80 413 Q76 418 74 434 L72 518 Q72 530 84 532 L102 532 Q114 530 114 518 L112 434 Q110 418 106 413 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>
          <path d="M72 526 Q70 540 74 548 L108 548 Q118 548 120 540 L112 526 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>
          {/* Right leg */}
          <path d="M146 262 Q152 268 156 290 L160 396 Q160 411 148 413 L128 413 Q116 411 116 396 L118 290 Q120 268 126 262 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>
          <ellipse cx="157" cy="396" rx="13" ry="9" fill="white" stroke="#374151" strokeWidth="1.5"/>
          <path d="M144 413 Q140 418 138 434 L136 518 Q136 530 148 532 L166 532 Q178 530 178 518 L176 434 Q174 418 170 413 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>
          <path d="M136 526 Q130 540 132 548 L166 548 Q170 548 178 540 L178 526 Z"
            fill="white" stroke="#374151" strokeWidth="2"/>

          {/* ── Annotated region overlays ── */}
          {REGIONS.map(region => {
            const ann = getAnn(region.id);
            if (!ann) return null;
            const props = {
              fill: ann.color,
              fillOpacity: 0.45,
              stroke: ann.color,
              strokeOpacity: 0.8,
              strokeWidth: 2,
            };
            return region.shape === "ellipse"
              ? <ellipse key={region.id} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...props}/>
              : <rect    key={region.id} x={region.x}  y={region.y}  width={region.w} height={region.h} rx={region.rx ?? 7} {...props}/>;
          })}
        </svg>
      </div>

      {/* Annotations list */}
      <div className="flex-1 space-y-2 pt-2">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">الملاحظات على الجسم</p>
        {annotations.map(ann => {
          const region = REGIONS.find(r => r.id === ann.regionId);
          return (
            <div key={ann.regionId} className="flex items-start gap-2 text-sm">
              <span
                className="mt-0.5 w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: ann.color }}
              />
              <div>
                <span className="font-black text-slate-800">{region?.labelAr ?? ann.regionId}</span>
                <span className="mx-1 text-slate-400">—</span>
                <span className="font-bold text-slate-600">{ann.label}</span>
                {ann.notes && (
                  <p className="text-xs text-slate-500 mt-0.5">{ann.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
