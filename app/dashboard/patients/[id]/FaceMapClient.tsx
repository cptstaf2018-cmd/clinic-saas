"use client";

import { useState } from "react";

const FACE_MARKERS = [
  { key: "botox",      labelAr: "بوتوكس",          color: "#2563eb" },
  { key: "filler",     labelAr: "فيلر",             color: "#7c3aed" },
  { key: "prp",        labelAr: "PRP / ميزوثيرابي", color: "#059669" },
  { key: "laser",      labelAr: "ليزر",             color: "#dc2626" },
  { key: "threads",    labelAr: "خيوط شد",          color: "#0891b2" },
  { key: "peel",       labelAr: "تقشير / بيل",      color: "#d97706" },
  { key: "fat",        labelAr: "إذابة دهون",        color: "#ea580c" },
  { key: "other",      labelAr: "أخرى",             color: "#6b7280" },
];

// viewBox: 0 0 400 520 — front face, patient right = screen left
type Zone = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const ZONES: Zone[] = [
  { id: "forehead",         labelAr: "الجبهة",                    shape: "rect",    x: 82,  y: 48,  w: 236, h: 80,  rx: 14 },
  { id: "glabella",         labelAr: "بين الحاجبين (خطوط الغضب)", shape: "ellipse", cx: 200, cy: 162, rx: 36, ry: 20 },
  { id: "r_crows_feet",     labelAr: "أرجل الغراب — يمين",        shape: "ellipse", cx: 90,  cy: 190, rx: 35, ry: 22 },
  { id: "l_crows_feet",     labelAr: "أرجل الغراب — يسار",        shape: "ellipse", cx: 310, cy: 190, rx: 35, ry: 22 },
  { id: "r_under_eye",      labelAr: "تحت العين — يمين",           shape: "ellipse", cx: 148, cy: 212, rx: 38, ry: 17 },
  { id: "l_under_eye",      labelAr: "تحت العين — يسار",           shape: "ellipse", cx: 252, cy: 212, rx: 38, ry: 17 },
  { id: "r_cheek",          labelAr: "الخد الأيمن",                shape: "ellipse", cx: 96,  cy: 278, rx: 50, ry: 52 },
  { id: "l_cheek",          labelAr: "الخد الأيسر",                shape: "ellipse", cx: 304, cy: 278, rx: 50, ry: 52 },
  { id: "nose",             labelAr: "الأنف / خطوط الأرنبة",      shape: "ellipse", cx: 200, cy: 258, rx: 28, ry: 38 },
  { id: "r_nasolabial",     labelAr: "الطية الأنفية الشفوية — يمين", shape: "ellipse", cx: 153, cy: 298, rx: 21, ry: 42 },
  { id: "l_nasolabial",     labelAr: "الطية الأنفية الشفوية — يسار", shape: "ellipse", cx: 247, cy: 298, rx: 21, ry: 42 },
  { id: "upper_lip",        labelAr: "الشفة العليا",               shape: "ellipse", cx: 200, cy: 332, rx: 50, ry: 17 },
  { id: "lower_lip",        labelAr: "الشفة السفلى",               shape: "ellipse", cx: 200, cy: 358, rx: 50, ry: 19 },
  { id: "r_marionette",     labelAr: "خطوط الدمية — يمين",         shape: "ellipse", cx: 158, cy: 374, rx: 18, ry: 27 },
  { id: "l_marionette",     labelAr: "خطوط الدمية — يسار",         shape: "ellipse", cx: 242, cy: 374, rx: 18, ry: 27 },
  { id: "chin",             labelAr: "الذقن",                      shape: "ellipse", cx: 200, cy: 408, rx: 46, ry: 30 },
  { id: "r_jaw",            labelAr: "الفك / الماستر — يمين",      shape: "ellipse", cx: 100, cy: 348, rx: 36, ry: 46 },
  { id: "l_jaw",            labelAr: "الفك / الماستر — يسار",      shape: "ellipse", cx: 300, cy: 348, rx: 36, ry: 46 },
  { id: "neck",             labelAr: "الرقبة / الأشرطة الرقبية",  shape: "rect",    x: 148, y: 448, w: 104, h: 52, rx: 18 },
];

type Annotation = { id: string; regionId: string; label: string; color: string; notes: string | null };

function ZoneEl({ z, fill, stroke, sw, dash }: {
  z: Zone; fill: string; stroke: string; sw: number; dash?: string;
}) {
  const p = { fill, stroke, strokeWidth: sw, strokeDasharray: dash };
  if (z.shape === "ellipse") return <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...p} />;
  return <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx ?? 0} {...p} />;
}

function labelX(z: Zone) { return z.shape === "ellipse" ? z.cx : z.x + z.w / 2; }
function labelY(z: Zone) { return z.shape === "ellipse" ? z.cy - z.ry - 12 : z.y - 12; }

export default function FaceMapClient({
  patientId,
  initialAnnotations,
}: {
  patientId: string;
  initialAnnotations: Annotation[];
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [selected, setSelected]       = useState<string | null>(null);
  const [quantity, setQuantity]       = useState("");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const selZone = ZONES.find((z) => z.id === selected);
  const selAnn  = annotations.find((a) => a.regionId === selected) ?? null;

  function handleSelect(id: string) {
    const same = selected === id;
    setSelected(same ? null : id);
    const ann = annotations.find((a) => a.regionId === id);
    setNotes(same ? "" : (ann?.notes ?? ""));
    setQuantity("");
  }

  async function saveAnnotation(markerKey: string) {
    if (!selected) return;
    const marker = FACE_MARKERS.find((m) => m.key === markerKey)!;
    setSaving(true);
    const notesVal = [quantity, notes].filter(Boolean).join(" · ") || null;
    const res = await fetch(`/api/patients/${patientId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        specialtyCode: "aesthetic",
        regionId: selected,
        label: markerKey,
        color: marker.color,
        notes: notesVal,
      }),
    });
    if (res.ok) {
      const { annotation } = await res.json();
      setAnnotations((prev) => [...prev.filter((a) => a.regionId !== selected), annotation]);
    }
    setSaving(false);
    setSelected(null);
    setQuantity("");
    setNotes("");
  }

  async function clearAnnotation() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/patients/${patientId}/annotations`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialtyCode: "aesthetic", regionId: selected }),
    });
    setAnnotations((prev) => prev.filter((a) => a.regionId !== selected));
    setSaving(false);
    setSelected(null);
    setQuantity("");
    setNotes("");
  }

  return (
    <div dir="rtl">
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 700 }}>
        انقر على منطقة الوجه لتأشير الإجراء — يمين الشاشة = يسار المريض
      </p>

      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <svg viewBox="0 0 400 520" style={{ width: "100%", cursor: "pointer", display: "block" }}>

          {/* ── Face outline ── */}
          {/* Head */}
          <ellipse cx={200} cy={210} rx={158} ry={188} fill="#fef3c7" stroke="#d1d5db" strokeWidth={2} />
          {/* Ears */}
          <ellipse cx={43}  cy={210} rx={20} ry={35} fill="#fde68a" stroke="#d1d5db" strokeWidth={1.5} />
          <ellipse cx={357} cy={210} rx={20} ry={35} fill="#fde68a" stroke="#d1d5db" strokeWidth={1.5} />
          {/* Neck */}
          <rect x={160} y={390} width={80} height={70} rx={10} fill="#fef3c7" stroke="#d1d5db" strokeWidth={1.5} />

          {/* Eyes */}
          <ellipse cx={148} cy={190} rx={30} ry={18} fill="white" stroke="#9ca3af" strokeWidth={1.5} />
          <ellipse cx={252} cy={190} rx={30} ry={18} fill="white" stroke="#9ca3af" strokeWidth={1.5} />
          <ellipse cx={148} cy={190} rx={12} ry={12} fill="#374151" />
          <ellipse cx={252} cy={190} rx={12} ry={12} fill="#374151" />
          {/* Eyebrows */}
          <path d="M 116 168 Q 148 156 180 168" stroke="#6b7280" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M 220 168 Q 252 156 284 168" stroke="#6b7280" strokeWidth={3} fill="none" strokeLinecap="round" />
          {/* Nose */}
          <path d="M 192 218 L 182 268 Q 200 278 218 268 L 208 218" stroke="#9ca3af" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* Mouth */}
          <path d="M 165 342 Q 200 360 235 342" stroke="#9ca3af" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M 170 342 Q 200 335 230 342" stroke="#9ca3af" strokeWidth={1} fill="none" strokeLinecap="round" />

          {/* ── Clickable zones ── */}
          {ZONES.map((zone) => {
            const ann   = annotations.find((a) => a.regionId === zone.id) ?? null;
            const isSel = selected === zone.id;
            const marker = ann ? FACE_MARKERS.find((m) => m.key === ann.label) : null;
            return (
              <g key={zone.id} onClick={() => handleSelect(zone.id)} style={{ cursor: "pointer" }}>
                <ZoneEl
                  z={zone}
                  fill={ann ? ann.color + "55" : "transparent"}
                  stroke={ann ? ann.color : "transparent"}
                  sw={ann ? 1.5 : 0}
                />
                {isSel && (
                  <ZoneEl z={zone} fill="#1e3a8a18" stroke="#1e3a8a" sw={2.5} dash="7 4" />
                )}
                {isSel && (
                  <>
                    <rect
                      x={labelX(zone) - 95} y={labelY(zone) - 24}
                      width={190} height={26} rx={6}
                      fill="#1e3a8a" opacity={0.93}
                    />
                    <text
                      x={labelX(zone)} y={labelY(zone) - 7}
                      textAnchor="middle" fontSize={14} fontWeight={900} fill="white"
                    >
                      {zone.labelAr}
                    </text>
                  </>
                )}
                {ann && !isSel && (
                  <>
                    <circle
                      cx={labelX(zone)} cy={labelY(zone) + 8}
                      r={9} fill={ann.color}
                    />
                    <text
                      x={labelX(zone)} y={labelY(zone) + 13}
                      textAnchor="middle" fontSize={10} fontWeight={900} fill="white"
                    >
                      {marker?.labelAr?.slice(0, 2) ?? "•"}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {FACE_MARKERS.map((m) => (
          <span key={m.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#475569" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: m.color, display: "inline-block" }} />
            {m.labelAr}
          </span>
        ))}
      </div>

      {/* Edit panel */}
      {selected && selZone && (
        <div style={{ marginTop: 14, background: "white", borderRadius: 14, border: "1.5px solid #dbeafe", padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#1e3a8a", marginBottom: 10 }}>
            {selZone.labelAr} — اختر الإجراء:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {FACE_MARKERS.map((m) => (
              <button key={m.key} onClick={() => saveAnnotation(m.key)} disabled={saving}
                style={{
                  padding: "6px 14px", borderRadius: 20, background: m.color,
                  color: "white", fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1,
                }}>
                {m.labelAr}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="الكمية (مثال: 20 units، 0.5ml)"
              style={{ flex: 1, padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12 }}
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظة"
              style={{ flex: 1, padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12 }}
            />
          </div>
          {selAnn && (
            <button onClick={clearAnnotation} disabled={saving}
              style={{ padding: "5px 14px", borderRadius: 20, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", cursor: "pointer" }}>
              مسح الإجراء
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {annotations.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 8 }}>ملخص الإجراءات:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {annotations.map((a) => {
              const marker = FACE_MARKERS.find((m) => m.key === a.label);
              const zone   = ZONES.find((z) => z.id === a.regionId);
              return (
                <span key={a.id} style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: (marker?.color ?? "#6b7280") + "20",
                  color: marker?.color ?? "#6b7280",
                  fontSize: 11, fontWeight: 800,
                  border: `1px solid ${(marker?.color ?? "#6b7280")}40`,
                }}>
                  {zone?.labelAr ?? a.regionId} — {marker?.labelAr ?? a.label}
                  {a.notes && <span style={{ opacity: 0.7 }}> · {a.notes}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
