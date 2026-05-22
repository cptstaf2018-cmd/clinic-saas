"use client";

import { useState } from "react";
import Image from "next/image";

// Photo credit: Aleksandar Andreev via Pexels (free to use)
// Image: 800×1068px portrait, face centered ~X:240-560, hairline ~Y:340, chin ~Y:850

const FACE_MARKERS = [
  { key: "botox",    labelAr: "بوتوكس",           color: "#2563eb" },
  { key: "filler",   labelAr: "فيلر",              color: "#7c3aed" },
  { key: "prp",      labelAr: "PRP / ميزوثيرابي",  color: "#059669" },
  { key: "laser",    labelAr: "ليزر",              color: "#dc2626" },
  { key: "threads",  labelAr: "خيوط شد",           color: "#0891b2" },
  { key: "peel",     labelAr: "تقشير / بيل",       color: "#d97706" },
  { key: "fat",      labelAr: "إذابة دهون",         color: "#ea580c" },
  { key: "other",    labelAr: "أخرى",              color: "#6b7280" },
];

// SVG viewBox matches image aspect ratio 800×1068
// Face occupies roughly: X 220-580, Y 330-900
// Patient right = screen LEFT (standard medical convention)
type Zone = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const ZONES: Zone[] = [
  // ── Upper face ──
  { id: "forehead",       labelAr: "الجبهة",                     shape: "rect",    x: 250, y: 330, w: 300, h: 90,  rx: 20 },
  { id: "glabella",       labelAr: "بين الحاجبين (خطوط الغضب)",  shape: "ellipse", cx: 400, cy: 450, rx: 50, ry: 28 },
  // ── Eyes ──
  { id: "r_crows_feet",   labelAr: "أرجل الغراب — يمين",         shape: "ellipse", cx: 248, cy: 480, rx: 48, ry: 28 },
  { id: "l_crows_feet",   labelAr: "أرجل الغراب — يسار",         shape: "ellipse", cx: 552, cy: 480, rx: 48, ry: 28 },
  { id: "r_under_eye",    labelAr: "تحت العين — يمين",            shape: "ellipse", cx: 295, cy: 518, rx: 52, ry: 22 },
  { id: "l_under_eye",    labelAr: "تحت العين — يسار",            shape: "ellipse", cx: 505, cy: 518, rx: 52, ry: 22 },
  // ── Mid face ──
  { id: "r_cheek",        labelAr: "الخد الأيمن",                 shape: "ellipse", cx: 240, cy: 610, rx: 62, ry: 65 },
  { id: "l_cheek",        labelAr: "الخد الأيسر",                 shape: "ellipse", cx: 560, cy: 610, rx: 62, ry: 65 },
  { id: "nose",           labelAr: "الأنف / خطوط الأرنبة",       shape: "ellipse", cx: 400, cy: 590, rx: 38, ry: 50 },
  { id: "r_nasolabial",   labelAr: "الطية الأنفية الشفوية — يمين", shape: "ellipse", cx: 308, cy: 648, rx: 28, ry: 52 },
  { id: "l_nasolabial",   labelAr: "الطية الأنفية الشفوية — يسار", shape: "ellipse", cx: 492, cy: 648, rx: 28, ry: 52 },
  // ── Mouth ──
  { id: "upper_lip",      labelAr: "الشفة العليا",                shape: "ellipse", cx: 400, cy: 710, rx: 68, ry: 24 },
  { id: "lower_lip",      labelAr: "الشفة السفلى",                shape: "ellipse", cx: 400, cy: 748, rx: 68, ry: 26 },
  // ── Lower face ──
  { id: "r_marionette",   labelAr: "خطوط الدمية — يمين",          shape: "ellipse", cx: 318, cy: 760, rx: 24, ry: 38 },
  { id: "l_marionette",   labelAr: "خطوط الدمية — يسار",          shape: "ellipse", cx: 482, cy: 760, rx: 24, ry: 38 },
  { id: "chin",           labelAr: "الذقن",                       shape: "ellipse", cx: 400, cy: 820, rx: 62, ry: 40 },
  { id: "r_jaw",          labelAr: "الفك / الماستر — يمين",       shape: "ellipse", cx: 228, cy: 730, rx: 48, ry: 58 },
  { id: "l_jaw",          labelAr: "الفك / الماستر — يسار",       shape: "ellipse", cx: 572, cy: 730, rx: 48, ry: 58 },
  // ── Neck ──
  { id: "neck",           labelAr: "الرقبة / الأشرطة الرقبية",   shape: "rect",    x: 318, y: 890, w: 164, h: 65, rx: 22 },
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
function labelY(z: Zone) { return z.shape === "ellipse" ? z.cy - z.ry - 14 : z.y - 14; }

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

      {/* Image + SVG overlay */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        paddingBottom: "133.5%", // 800×1068 ratio
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "#fff",
      }}>
        <Image
          src="/face-map.jpg"
          alt="خريطة الوجه للتجميل"
          fill
          style={{ objectFit: "cover", objectPosition: "center top" }}
          priority
        />
        <svg
          viewBox="0 0 800 1068"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            cursor: "pointer",
          }}
        >
          {ZONES.map((zone) => {
            const ann    = annotations.find((a) => a.regionId === zone.id) ?? null;
            const isSel  = selected === zone.id;
            const marker = ann ? FACE_MARKERS.find((m) => m.key === ann.label) : null;
            return (
              <g key={zone.id} onClick={() => handleSelect(zone.id)} style={{ cursor: "pointer" }}>
                <ZoneEl
                  z={zone}
                  fill={ann ? ann.color + "55" : "transparent"}
                  stroke={ann ? ann.color : "transparent"}
                  sw={ann ? 2 : 0}
                />
                {isSel && (
                  <ZoneEl z={zone} fill="#1e3a8a22" stroke="#1e3a8a" sw={3} dash="8 5" />
                )}
                {isSel && (
                  <>
                    <rect
                      x={labelX(zone) - 110} y={labelY(zone) - 26}
                      width={220} height={28} rx={7}
                      fill="#1e3a8a" opacity={0.93}
                    />
                    <text
                      x={labelX(zone)} y={labelY(zone) - 7}
                      textAnchor="middle" fontSize={15} fontWeight={900} fill="white"
                    >
                      {zone.labelAr}
                    </text>
                  </>
                )}
                {ann && !isSel && (
                  <>
                    <circle cx={labelX(zone)} cy={labelY(zone) + 10} r={12} fill={ann.color} opacity={0.9} />
                    <text
                      x={labelX(zone)} y={labelY(zone) + 15}
                      textAnchor="middle" fontSize={11} fontWeight={900} fill="white"
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
              placeholder="الكمية (20 units، 0.5ml)"
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
