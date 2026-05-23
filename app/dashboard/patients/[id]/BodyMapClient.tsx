"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";

const DERMATOLOGY_MARKERS = [
  { key: "rash",      labelAr: "طفح جلدي",   color: "#f59e0b" },
  { key: "acne",      labelAr: "حبوب أكني",   color: "#ef4444" },
  { key: "eczema",    labelAr: "إكزيما",       color: "#8b5cf6" },
  { key: "psoriasis", labelAr: "صدفية",        color: "#3b82f6" },
  { key: "wound",     labelAr: "جرح / كدمة",  color: "#dc2626" },
  { key: "burn",      labelAr: "حرق",          color: "#f97316" },
  { key: "pigment",   labelAr: "تصبغ",         color: "#92400e" },
  { key: "allergy",   labelAr: "حساسية",       color: "#10b981" },
  { key: "other",     labelAr: "أخرى",         color: "#6b7280" },
];

const AESTHETIC_MARKERS = [
  { key: "botox",       labelAr: "بوتوكس",        color: "#2563eb" },
  { key: "filler",      labelAr: "فيلر",          color: "#7c3aed" },
  { key: "laser",       labelAr: "ليزر",          color: "#dc2626" },
  { key: "prp",         labelAr: "PRP",           color: "#059669" },
  { key: "peel",        labelAr: "تقشير",         color: "#ea580c" },
  { key: "mesotherapy", labelAr: "ميزوثيرابي",    color: "#0891b2" },
  { key: "scar",        labelAr: "ندبة",          color: "#475569" },
  { key: "other",       labelAr: "أخرى",          color: "#6b7280" },
];

// General medicine: body complaint locator (CHOIR/Stanford standard)
const GENERAL_MEDICINE_MARKERS = [
  { key: "pain",        labelAr: "ألم",            color: "#ef4444" },
  { key: "swelling",    labelAr: "تورم",           color: "#3b82f6" },
  { key: "numbness",    labelAr: "خدر / تنميل",    color: "#8b5cf6" },
  { key: "tension",     labelAr: "توتر عضلي",      color: "#f97316" },
  { key: "heat",        labelAr: "حرارة موضعية",   color: "#f59e0b" },
  { key: "weakness",    labelAr: "ضعف / إرهاق",    color: "#64748b" },
  { key: "other",       labelAr: "أخرى",           color: "#6b7280" },
];

// Surgery: surgical site marking (WHO surgical safety standard)
const SURGERY_MARKERS = [
  { key: "op_site",     labelAr: "موقع العملية",   color: "#2563eb" },
  { key: "wound",       labelAr: "جرح",            color: "#ef4444" },
  { key: "scar",        labelAr: "ندبة",           color: "#475569" },
  { key: "hernia",      labelAr: "فتق",            color: "#f97316" },
  { key: "tumor",       labelAr: "ورم",            color: "#7c3aed" },
  { key: "drain",       labelAr: "موضع الصرف",     color: "#0891b2" },
  { key: "pain",        labelAr: "ألم",            color: "#dc2626" },
  { key: "other",       labelAr: "أخرى",           color: "#6b7280" },
];

// Image: 960×1118 — front body on LEFT (X 0-480), back body on RIGHT (X 480-960)
// Patient anatomy convention: front view → patient right = screen left; back view → patient right = screen right
type Region = {
  id: string;
  labelAr: string;
} & (
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number }
);

const REGIONS: Region[] = [
  // ── FRONT BODY (left half, center X≈250) ──────────────────────────────────
  { id: "head_f",        labelAr: "الرأس (أمامي)",          shape: "ellipse", cx: 250, cy: 76,  rx: 58,  ry: 64  },
  { id: "neck_f",        labelAr: "الرقبة (أمامية)",        shape: "rect",    x: 226,  y: 138,  w: 48,   h: 42,  rx: 12 },
  { id: "r_shoulder_f",  labelAr: "الكتف الأيمن",           shape: "ellipse", cx: 114, cy: 192, rx: 52,  ry: 34  },
  { id: "l_shoulder_f",  labelAr: "الكتف الأيسر",           shape: "ellipse", cx: 386, cy: 192, rx: 52,  ry: 34  },
  { id: "chest_f",       labelAr: "الصدر",                  shape: "rect",    x: 142,  y: 174,  w: 216,  h: 172, rx: 20 },
  { id: "abdomen_f",     labelAr: "البطن",                  shape: "rect",    x: 150,  y: 348,  w: 200,  h: 144, rx: 18 },
  { id: "r_arm_f",       labelAr: "العضد الأيمن",           shape: "rect",    x: 52,   y: 184,  w: 54,   h: 182, rx: 22 },
  { id: "l_arm_f",       labelAr: "العضد الأيسر",           shape: "rect",    x: 394,  y: 184,  w: 54,   h: 182, rx: 22 },
  { id: "r_forearm_f",   labelAr: "الساعد الأيمن",          shape: "rect",    x: 38,   y: 368,  w: 48,   h: 158, rx: 18 },
  { id: "l_forearm_f",   labelAr: "الساعد الأيسر",          shape: "rect",    x: 414,  y: 368,  w: 48,   h: 158, rx: 18 },
  { id: "r_hand_f",      labelAr: "اليد اليمنى",            shape: "ellipse", cx: 58,  cy: 546, rx: 40,  ry: 50  },
  { id: "l_hand_f",      labelAr: "اليد اليسرى",            shape: "ellipse", cx: 434, cy: 546, rx: 40,  ry: 50  },
  { id: "pelvis_f",      labelAr: "منطقة الحوض",            shape: "ellipse", cx: 250, cy: 502, rx: 88,  ry: 42  },
  { id: "r_thigh_f",     labelAr: "الفخذ الأيمن",           shape: "rect",    x: 170,  y: 538,  w: 62,   h: 164, rx: 24 },
  { id: "l_thigh_f",     labelAr: "الفخذ الأيسر",           shape: "rect",    x: 268,  y: 538,  w: 62,   h: 164, rx: 24 },
  { id: "r_knee_f",      labelAr: "الركبة اليمنى",          shape: "ellipse", cx: 201, cy: 710, rx: 48,  ry: 36  },
  { id: "l_knee_f",      labelAr: "الركبة اليسرى",          shape: "ellipse", cx: 299, cy: 710, rx: 48,  ry: 36  },
  { id: "r_shin_f",      labelAr: "الساق اليمنى",           shape: "rect",    x: 176,  y: 745,  w: 48,   h: 240, rx: 18 },
  { id: "l_shin_f",      labelAr: "الساق اليسرى",           shape: "rect",    x: 274,  y: 745,  w: 48,   h: 240, rx: 18 },
  { id: "r_foot_f",      labelAr: "القدم اليمنى",           shape: "ellipse", cx: 200, cy: 1054, rx: 52, ry: 30  },
  { id: "l_foot_f",      labelAr: "القدم اليسرى",           shape: "ellipse", cx: 298, cy: 1054, rx: 52, ry: 30  },

  // ── BACK BODY (right half, center X≈730) ──────────────────────────────────
  { id: "head_b",        labelAr: "الرأس (خلفي)",           shape: "ellipse", cx: 730, cy: 76,  rx: 58,  ry: 64  },
  { id: "neck_b",        labelAr: "الرقبة (خلفية)",         shape: "rect",    x: 706,  y: 138,  w: 48,   h: 42,  rx: 12 },
  { id: "r_shoulder_b",  labelAr: "الكتف الأيمن (خلفي)",   shape: "ellipse", cx: 866, cy: 192, rx: 52,  ry: 34  },
  { id: "l_shoulder_b",  labelAr: "الكتف الأيسر (خلفي)",   shape: "ellipse", cx: 594, cy: 192, rx: 52,  ry: 34  },
  { id: "upper_back",    labelAr: "أعلى الظهر",             shape: "rect",    x: 622,  y: 174,  w: 216,  h: 172, rx: 20 },
  { id: "lower_back",    labelAr: "أسفل الظهر",             shape: "rect",    x: 630,  y: 348,  w: 200,  h: 144, rx: 18 },
  { id: "r_arm_b",       labelAr: "العضد الأيمن (خلفي)",   shape: "rect",    x: 874,  y: 184,  w: 54,   h: 182, rx: 22 },
  { id: "l_arm_b",       labelAr: "العضد الأيسر (خلفي)",   shape: "rect",    x: 532,  y: 184,  w: 54,   h: 182, rx: 22 },
  { id: "r_forearm_b",   labelAr: "الساعد الأيمن (خلفي)",  shape: "rect",    x: 890,  y: 368,  w: 48,   h: 158, rx: 18 },
  { id: "l_forearm_b",   labelAr: "الساعد الأيسر (خلفي)",  shape: "rect",    x: 522,  y: 368,  w: 48,   h: 158, rx: 18 },
  { id: "r_hand_b",      labelAr: "اليد اليمنى (خلفية)",   shape: "ellipse", cx: 910, cy: 546, rx: 40,  ry: 50  },
  { id: "l_hand_b",      labelAr: "اليد اليسرى (خلفية)",   shape: "ellipse", cx: 548, cy: 546, rx: 40,  ry: 50  },
  { id: "r_buttock",     labelAr: "الأرداف الأيمن",         shape: "ellipse", cx: 798, cy: 506, rx: 72,  ry: 54  },
  { id: "l_buttock",     labelAr: "الأرداف الأيسر",         shape: "ellipse", cx: 662, cy: 506, rx: 72,  ry: 54  },
  { id: "r_thigh_b",     labelAr: "الفخذ الأيمن (خلفي)",   shape: "rect",    x: 752,  y: 538,  w: 62,   h: 164, rx: 24 },
  { id: "l_thigh_b",     labelAr: "الفخذ الأيسر (خلفي)",   shape: "rect",    x: 650,  y: 538,  w: 62,   h: 164, rx: 24 },
  { id: "r_calf",        labelAr: "بطة الساق اليمنى",       shape: "rect",    x: 754,  y: 745,  w: 48,   h: 240, rx: 18 },
  { id: "l_calf",        labelAr: "بطة الساق اليسرى",       shape: "rect",    x: 652,  y: 745,  w: 48,   h: 240, rx: 18 },
  { id: "r_heel",        labelAr: "الكعب الأيمن",           shape: "ellipse", cx: 778, cy: 1054, rx: 52, ry: 30  },
  { id: "l_heel",        labelAr: "الكعب الأيسر",           shape: "ellipse", cx: 676, cy: 1054, rx: 52, ry: 30  },
];

type Annotation = { id: string; regionId: string; label: string; color: string; notes: string | null };
type PointSelection = { id: string; x: number; y: number; saved: boolean };

function makePointId(x: number, y: number) {
  return `point:body:${x.toFixed(1)}:${y.toFixed(1)}:${Date.now()}`;
}

function parsePointId(id: string): PointSelection | null {
  const [prefix, map, x, y] = id.split(":");
  if (prefix !== "point" || map !== "body") return null;
  const px = Number(x);
  const py = Number(y);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  return { id, x: px, y: py, saved: true };
}

function RegionEl({ r, fill, stroke, sw, dash }: {
  r: Region; fill: string; stroke: string; sw: number; dash?: string;
}) {
  const p = { fill, stroke, strokeWidth: sw, strokeDasharray: dash };
  if (r.shape === "ellipse") return <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} {...p} />;
  return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx ?? 0} {...p} />;
}

export default function BodyMapClient({
  patientId,
  specialtyCode,
  initialAnnotations,
}: {
  patientId: string;
  specialtyCode: string;
  initialAnnotations: Annotation[];
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [selected, setSelected]       = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PointSelection | null>(null);
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const selRegion = REGIONS.find((r) => r.id === selected);
  const activeId  = selectedPoint?.id ?? selected;
  const selAnn    = annotations.find((a) => a.regionId === activeId) ?? null;
  const pointAnnotations = annotations
    .map((annotation) => ({ annotation, point: parsePointId(annotation.regionId) }))
    .filter((item): item is { annotation: Annotation; point: PointSelection } => !!item.point);
  const markerTypes =
    specialtyCode === "aesthetic"      ? AESTHETIC_MARKERS :
    specialtyCode === "general_medicine" ? GENERAL_MEDICINE_MARKERS :
    specialtyCode === "surgery"        ? SURGERY_MARKERS :
    DERMATOLOGY_MARKERS;

  const introText =
    specialtyCode === "aesthetic"
      ? "حدد منطقة الإجراء التجميلي أو الجلسة — الأمامي على اليسار، الخلفي على اليمين"
      : specialtyCode === "general_medicine"
      ? "انقر على منطقة الشكوى أو الإصابة — الأمامي على اليسار، الخلفي على اليمين"
      : specialtyCode === "surgery"
      ? "انقر على موقع العملية أو الجرح — الأمامي على اليسار، الخلفي على اليمين"
      : "انقر على أي منطقة من الجسم لتأشير الإصابة الجلدية — الأمامي على اليسار، الخلفي على اليمين";

  function labelX(r: Region) { return r.shape === "ellipse" ? r.cx : r.x + r.w / 2; }
  function labelY(r: Region) { return r.shape === "ellipse" ? r.cy - r.ry - 14 : r.y - 14; }

  function handleSelect(id: string) {
    const same = selected === id;
    setSelected(same ? null : id);
    setSelectedPoint(null);
    setNotes(same ? "" : (annotations.find((a) => a.regionId === id)?.notes ?? ""));
  }

  function handlePointSelect(point: PointSelection) {
    setSelected(null);
    setSelectedPoint(point);
    setNotes(point.saved ? (annotations.find((a) => a.regionId === point.id)?.notes ?? "") : "");
  }

  function handleMapClick(event: MouseEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 960;
    const y = ((event.clientY - rect.top) / rect.height) * 1118;
    handlePointSelect({ id: makePointId(x, y), x, y, saved: false });
  }

  async function saveAnnotation(key: string) {
    const regionId = selectedPoint?.id ?? selected;
    if (!regionId) return;
    const lesion = markerTypes.find((l) => l.key === key)!;
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialtyCode, regionId, label: key, color: lesion.color, notes: notes || null }),
    });
    if (res.ok) {
      const { annotation } = await res.json();
      setAnnotations((prev) => [...prev.filter((a) => a.regionId !== regionId), annotation]);
    }
    setSaving(false);
    setSelected(null);
    setSelectedPoint(null);
    setNotes("");
  }

  async function clearAnnotation() {
    const regionId = selectedPoint?.id ?? selected;
    if (!regionId) return;
    setSaving(true);
    await fetch(`/api/patients/${patientId}/annotations`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialtyCode, regionId }),
    });
    setAnnotations((prev) => prev.filter((a) => a.regionId !== regionId));
    setSaving(false);
    setSelected(null);
    setSelectedPoint(null);
    setNotes("");
  }

  return (
    <div dir="rtl">
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 700 }}>
        {introText}. يمكنك الضغط على المكان نفسه بدقة لو كان موقع العملية أو العلاج لا يقع داخل منطقة جاهزة.
      </p>

      {/* Image + SVG overlay */}
      <div style={{
        position: "relative", width: "100%", paddingBottom: "116.5%",
        borderRadius: 14, overflow: "hidden",
        border: "1px solid #e2e8f0", background: "white",
      }}>
        <Image
          src="/body-map.png"
          alt="خريطة الجسم البشري — أمامي وخلفي"
          fill
          style={{ objectFit: "contain" }}
          priority
        />

        <svg
          viewBox="0 0 960 1118"
          onClick={handleMapClick}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
        >
          {/* Divider label */}
          <text x={480} y={30} textAnchor="middle" fontSize={22} fontWeight={900} fill="#94a3b8" opacity={0.7}>
            أمامي ◀──────────────────────────────── خلفي
          </text>

          {REGIONS.map((region) => {
            const ann  = annotations.find((a) => a.regionId === region.id) ?? null;
            const isSel = selected === region.id;
            return (
              <g key={region.id} onClick={(event) => { event.stopPropagation(); handleSelect(region.id); }} style={{ cursor: "pointer" }}>
                <RegionEl r={region} fill={ann ? ann.color + "44" : "transparent"} stroke="transparent" sw={0} />
                {isSel && (
                  <RegionEl r={region} fill={ann ? ann.color + "44" : "#1e3a8a18"} stroke="#1e3a8a" sw={3} dash="8 4" />
                )}
                {isSel && (
                  <>
                    <rect
                      x={labelX(region) - 90} y={labelY(region) - 26}
                      width={180} height={30} rx={7}
                      fill="#1e3a8a" opacity={0.92}
                    />
                    <text x={labelX(region)} y={labelY(region) - 7}
                      textAnchor="middle" fontSize={18} fontWeight={900} fill="white">
                      {region.labelAr}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {pointAnnotations.map(({ annotation, point }) => {
            const isSel = selectedPoint?.id === point.id;
            return (
              <g
                key={point.id}
                onClick={(event) => { event.stopPropagation(); handlePointSelect(point); }}
                style={{ cursor: "pointer" }}
              >
                <circle cx={point.x} cy={point.y} r={isSel ? 24 : 18} fill={annotation.color} fillOpacity={0.32} stroke={annotation.color} strokeWidth={isSel ? 6 : 4} />
                <circle cx={point.x} cy={point.y} r={5} fill={annotation.color} />
              </g>
            );
          })}

          {selectedPoint && !selectedPoint.saved && (
            <g>
              <circle cx={selectedPoint.x} cy={selectedPoint.y} r={24} fill="#1e3a8a" fillOpacity={0.18} stroke="#1e3a8a" strokeWidth={5} strokeDasharray="8 4" />
              <circle cx={selectedPoint.x} cy={selectedPoint.y} r={5} fill="#1e3a8a" />
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {markerTypes.map((t) => (
          <span key={t.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#475569" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: t.color, display: "inline-block" }} />
            {t.labelAr}
          </span>
        ))}
      </div>

      {/* Edit panel */}
      {(selectedPoint || (selected && selRegion)) && (
        <div style={{ marginTop: 14, background: "white", borderRadius: 14, border: "1.5px solid #dbeafe", padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#1e3a8a", marginBottom: 10 }}>
            {selectedPoint ? "نقطة محددة على الخريطة" : `${selRegion?.labelAr} — اختر نوع العلامة:`}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {markerTypes.map((t) => (
              <button key={t.key} onClick={() => saveAnnotation(t.key)} disabled={saving}
                style={{
                  padding: "6px 14px", borderRadius: 20, background: t.color,
                  color: "white", fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1,
                }}>
                {t.labelAr}
              </button>
            ))}
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظة عن الإصابة (اختياري)"
            style={{ width: "100%", padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, marginBottom: 8, boxSizing: "border-box" }}
          />
          {selAnn && (
            <button onClick={clearAnnotation} disabled={saving}
              style={{ padding: "5px 14px", borderRadius: 20, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", cursor: "pointer" }}>
              مسح الإصابة
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {annotations.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 8 }}>ملخص الإصابات:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {annotations.map((a) => {
              const lesion = markerTypes.find((l) => l.key === a.label);
              const region = REGIONS.find((r) => r.id === a.regionId);
              const point = parsePointId(a.regionId);
              return (
                <span key={a.id} style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: (lesion?.color ?? "#6b7280") + "20",
                  color: lesion?.color ?? "#6b7280",
                  fontSize: 11, fontWeight: 800,
                  border: `1px solid ${(lesion?.color ?? "#6b7280")}40`,
                }}>
                  {region?.labelAr ?? (point ? "نقطة محددة" : a.regionId)} — {lesion?.labelAr ?? a.label}
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
