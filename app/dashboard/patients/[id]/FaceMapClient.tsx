"use client";

import { useState } from "react";
import Image from "next/image";
import {
  AESTHETIC_FACE_MARKERS,
  AESTHETIC_FACE_ZONES,
  type AestheticFaceZone,
} from "@/lib/aesthetic-face-map";

type Annotation = { id: string; regionId: string; label: string; color: string; notes: string | null };

function ZoneEl({ z, fill, stroke, sw, dash }: {
  z: AestheticFaceZone; fill: string; stroke: string; sw: number; dash?: string;
}) {
  const p = { fill, stroke, strokeWidth: sw, strokeDasharray: dash };
  if (z.shape === "ellipse") return <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...p} />;
  return <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={z.rx ?? 0} {...p} />;
}

function labelX(z: AestheticFaceZone) { return z.shape === "ellipse" ? z.cx : z.x + z.w / 2; }
function labelY(z: AestheticFaceZone) { return z.shape === "ellipse" ? z.cy : z.y + z.h / 2; }

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

  const selZone = AESTHETIC_FACE_ZONES.find((z) => z.id === selected);
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
    const marker = AESTHETIC_FACE_MARKERS.find((m) => m.key === markerKey)!;
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
        انقر على منطقة الوجه لتأشير الإجراء — اليمين واليسار حسب جهة المريض
      </p>

      {/* Image + SVG overlay */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 680,
        margin: "0 auto",
        paddingBottom: "133.33%",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "#fff",
      }}>
        <Image
          src="/face-map.jpg"
          alt="خريطة الوجه للتجميل"
          fill
          style={{ objectFit: "contain", objectPosition: "center center" }}
          priority
        />
        <svg
          viewBox="0 0 600 800"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            cursor: "pointer",
          }}
        >
          {AESTHETIC_FACE_ZONES.map((zone) => {
            const ann    = annotations.find((a) => a.regionId === zone.id) ?? null;
            const isSel  = selected === zone.id;
            const marker = ann ? AESTHETIC_FACE_MARKERS.find((m) => m.key === ann.label) : null;
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
                      x={labelX(zone) - 100} y={labelY(zone) - 14}
                      width={200} height={28} rx={7}
                      fill="#1e3a8a" opacity={0.93}
                    />
                    <text
                      x={labelX(zone)} y={labelY(zone) + 5}
                      textAnchor="middle" fontSize={14} fontWeight={900} fill="white"
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
        {AESTHETIC_FACE_MARKERS.map((m) => (
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
            {AESTHETIC_FACE_MARKERS.map((m) => (
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
              const marker = AESTHETIC_FACE_MARKERS.find((m) => m.key === a.label);
              const zone   = AESTHETIC_FACE_ZONES.find((z) => z.id === a.regionId);
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
