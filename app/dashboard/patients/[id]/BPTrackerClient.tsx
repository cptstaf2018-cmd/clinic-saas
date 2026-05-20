"use client";

import { useMemo } from "react";

type MedicalRecord = {
  id: string;
  date: string;
  contentJson: unknown;
  specialtyCode: string | null;
};

type BPReading = { date: string; sys: number; dia: number; pulse: number | null };

function getStr(content: unknown, key: string): string | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const val = (content as Record<string, unknown>)[key];
  return typeof val === "string" && val.trim() ? val.trim() : null;
}

function getNum(content: unknown, key: string): number | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const val = (content as Record<string, unknown>)[key];
  if (val === undefined || val === null || val === "") return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function parseBP(raw: string | null): { sys: number; dia: number } | null {
  if (!raw) return null;
  const match = raw.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  const sys = parseInt(match[1]);
  const dia = parseInt(match[2]);
  if (isNaN(sys) || isNaN(dia)) return null;
  return { sys, dia };
}

function getBPCategory(sys: number, dia: number): { label: string; color: string; bg: string } {
  if (sys < 120 && dia < 80)      return { label: "طبيعي",             color: "#16a34a", bg: "#f0fdf4" };
  if (sys < 130 && dia < 80)      return { label: "مرتفع قليلاً",       color: "#65a30d", bg: "#f7fee7" };
  if (sys < 140 || dia < 90)      return { label: "ارتفاع مرحلة 1",     color: "#d97706", bg: "#fffbeb" };
  if (sys < 180 || dia < 120)     return { label: "ارتفاع مرحلة 2",     color: "#ea580c", bg: "#fff7ed" };
  return                                  { label: "أزمة ارتفاعية!",    color: "#dc2626", bg: "#fef2f2" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-IQ", { month: "short", day: "numeric", year: "2-digit" });
}

function BPTrendChart({ readings }: { readings: BPReading[] }) {
  if (readings.length < 2) return null;

  const W = 380, H = 130, PL = 28, PR = 12, PT = 12, PB = 22;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const allVals = readings.flatMap((r) => [r.sys, r.dia]);
  const minV = Math.min(...allVals) - 10;
  const maxV = Math.max(...allVals) + 10;
  const range = maxV - minV;

  function ptX(i: number) { return PL + (i / (readings.length - 1)) * chartW; }
  function ptY(v: number) { return PT + ((maxV - v) / range) * chartH; }

  const sysPath = readings.map((r, i) => `${i === 0 ? "M" : "L"}${ptX(i).toFixed(1)},${ptY(r.sys).toFixed(1)}`).join(" ");
  const diaPath = readings.map((r, i) => `${i === 0 ? "M" : "L"}${ptX(i).toFixed(1)},${ptY(r.dia).toFixed(1)}`).join(" ");

  const yLabels = [60, 80, 100, 120, 140, 160, 180].filter((v) => v >= minV && v <= maxV);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", overflow: "visible" }}>
      {/* grid */}
      {yLabels.map((v) => (
        <g key={v}>
          <line x1={PL} y1={ptY(v)} x2={W - PR} y2={ptY(v)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={PL - 4} y={ptY(v) + 3} fontSize="8" fill="#94a3b8" textAnchor="end">{v}</text>
        </g>
      ))}
      {/* normal range shading */}
      <rect x={PL} y={ptY(80)} width={chartW} height={ptY(120) - ptY(80)} fill="#dcfce766" />
      {/* lines */}
      <path d={sysPath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={diaPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* dots + x labels */}
      {readings.map((r, i) => (
        <g key={i}>
          <circle cx={ptX(i)} cy={ptY(r.sys)} r={3.5} fill="#ef4444" />
          <circle cx={ptX(i)} cy={ptY(r.dia)} r={3.5} fill="#3b82f6" />
          {(i === 0 || i === readings.length - 1) && (
            <text x={ptX(i)} y={H - 4} fontSize="8" fill="#94a3b8" textAnchor="middle">{formatDate(r.date)}</text>
          )}
        </g>
      ))}
      {/* legend */}
      <circle cx={PL + 8} cy={PT - 2} r={3} fill="#ef4444" />
      <text x={PL + 14} y={PT + 2} fontSize="9" fill="#64748b">انقباضي</text>
      <circle cx={PL + 60} cy={PT - 2} r={3} fill="#3b82f6" />
      <text x={PL + 66} y={PT + 2} fontSize="9" fill="#64748b">انبساطي</text>
    </svg>
  );
}

export default function BPTrackerClient({ records }: { records: MedicalRecord[] }) {
  const readings: BPReading[] = useMemo(() => {
    return records
      .filter((r) => r.specialtyCode === "cardiology" || !r.specialtyCode)
      .map((r) => {
        const bpRaw = getStr(r.contentJson, "blood_pressure");
        const bp = parseBP(bpRaw);
        if (!bp) return null;
        const pulse = getNum(r.contentJson, "pulse");
        return { date: r.date, sys: bp.sys, dia: bp.dia, pulse };
      })
      .filter((x): x is BPReading => x !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  const latest = readings[readings.length - 1] ?? null;
  const category = latest ? getBPCategory(latest.sys, latest.dia) : null;

  const avgSys = readings.length ? Math.round(readings.reduce((s, r) => s + r.sys, 0) / readings.length) : null;
  const avgDia = readings.length ? Math.round(readings.reduce((s, r) => s + r.dia, 0) / readings.length) : null;

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Latest reading */}
      {latest && category ? (
        <div style={{ background: category.bg, borderRadius: 14, border: `1.5px solid ${category.color}44`, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: category.color, marginBottom: 4 }}>❤️ آخر قياس ضغط الدم</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: category.color, lineHeight: 1, margin: 0 }}>
                {latest.sys}<span style={{ fontSize: 20, fontWeight: 700 }}>/{latest.dia}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginRight: 6 }}>mmHg</span>
              </p>
              {latest.pulse && (
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  💓 النبض: <strong>{latest.pulse} نبضة/دقيقة</strong>
                </p>
              )}
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{formatDate(latest.date)}</p>
            </div>
            <div style={{
              background: category.color, color: "white", borderRadius: 12,
              padding: "10px 16px", alignSelf: "center", textAlign: "center",
            }}>
              <p style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>{category.label}</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: "#f8fafc", borderRadius: 14, border: "1px dashed #e2e8f0", padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>🫀</p>
          <p style={{ fontSize: 14, fontWeight: 900, color: "#475569" }}>لا توجد قياسات ضغط دم بعد</p>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            أضف حقل "ضغط الدم" بصيغة 120/80 في السجل الطبي
          </p>
        </div>
      )}

      {/* Stats */}
      {readings.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "متوسط الانقباضي",   value: avgSys ? `${avgSys}` : "—", color: "#ef4444" },
            { label: "متوسط الانبساطي",   value: avgDia ? `${avgDia}` : "—", color: "#3b82f6" },
            { label: "عدد القياسات",       value: readings.length.toString(), color: "#8b5cf6" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "white", borderRadius: 12, border: "1px solid #e2e8f0",
              padding: "10px 12px", textAlign: "center",
            }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trend chart */}
      {readings.length >= 2 && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#1e293b", marginBottom: 8 }}>📈 منحنى ضغط الدم</p>
          <BPTrendChart readings={readings} />
        </div>
      )}

      {/* BP reference table */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#1e293b" }}>📋 سجل القياسات</p>
        </div>
        {readings.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["التاريخ", "الانقباضي", "الانبساطي", "النبض", "التصنيف"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", fontWeight: 800, color: "#64748b", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...readings].reverse().map((r, i) => {
                  const cat = getBPCategory(r.sys, r.dia);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px", color: "#475569", fontWeight: 700 }}>{formatDate(r.date)}</td>
                      <td style={{ padding: "8px 12px", color: "#ef4444", fontWeight: 900 }}>{r.sys}</td>
                      <td style={{ padding: "8px 12px", color: "#3b82f6", fontWeight: 900 }}>{r.dia}</td>
                      <td style={{ padding: "8px 12px", color: "#7c3aed", fontWeight: 700 }}>{r.pulse ?? "—"}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{
                          background: cat.color + "22", color: cat.color,
                          padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                          border: `1px solid ${cat.color}44`,
                        }}>
                          {cat.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>لا توجد قياسات</p>
          </div>
        )}
      </div>
    </div>
  );
}
