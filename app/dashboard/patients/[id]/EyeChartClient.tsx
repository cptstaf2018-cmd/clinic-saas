"use client";

import { useMemo } from "react";

type MedicalRecord = {
  id: string;
  date: string;
  contentJson: unknown;
  specialtyCode: string | null;
};

function getStr(content: unknown, key: string): string | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const val = (content as Record<string, unknown>)[key];
  return typeof val === "string" && val.trim() ? val.trim() : null;
}

type VisitData = {
  date: string;
  visual_acuity: string | null;
  eye_pressure: string | null;
  glasses_prescription: string | null;
  slit_lamp_exam: string | null;
  fundus_exam: string | null;
};

const SNELLEN_LEVELS = [
  { fraction: "6/6",  percent: "100%", label: "طبيعي تام", color: "#16a34a" },
  { fraction: "6/9",  percent: "67%",  label: "طبيعي",     color: "#65a30d" },
  { fraction: "6/12", percent: "50%",  label: "خفيف",       color: "#ca8a04" },
  { fraction: "6/18", percent: "33%",  label: "متوسط",      color: "#ea580c" },
  { fraction: "6/24", percent: "25%",  label: "شديد",       color: "#dc2626" },
  { fraction: "6/36", percent: "17%",  label: "شديد جداً",  color: "#9f1239" },
  { fraction: "6/60", percent: "10%",  label: "ضعف بصر",    color: "#7f1d1d" },
];

function parseIOP(raw: string | null): { od: string | null; os: string | null } {
  if (!raw) return { od: null, os: null };
  const match = raw.match(/(\d+\.?\d*)/g);
  if (!match) return { od: raw, os: null };
  if (match.length >= 2) return { od: match[0], os: match[1] };
  return { od: match[0], os: null };
}

function IOPBadge({ value }: { value: string | null }) {
  if (!value) return <span style={{ color: "#94a3b8", fontSize: 13 }}>—</span>;
  const n = parseFloat(value);
  const color = n > 21 ? "#ef4444" : n >= 16 ? "#f59e0b" : "#16a34a";
  return (
    <span style={{ fontSize: 15, fontWeight: 900, color }}>
      {value} <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>mmHg</span>
    </span>
  );
}

export default function EyeChartClient({ records }: { records: MedicalRecord[] }) {
  const eyeRecords: VisitData[] = useMemo(() => {
    return records
      .filter((r) => r.specialtyCode === "ophthalmology" || !r.specialtyCode)
      .map((r) => ({
        date: r.date,
        visual_acuity: getStr(r.contentJson, "visual_acuity"),
        eye_pressure: getStr(r.contentJson, "eye_pressure"),
        glasses_prescription: getStr(r.contentJson, "glasses_prescription"),
        slit_lamp_exam: getStr(r.contentJson, "slit_lamp_exam"),
        fundus_exam: getStr(r.contentJson, "fundus_exam"),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const latest = eyeRecords[0] ?? null;
  const iop = parseIOP(latest?.eye_pressure ?? null);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Visual Acuity + IOP - Latest */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>

        {/* Visual Acuity */}
        <div style={{ background: "#f0f9ff", borderRadius: 14, border: "1px solid #bae6fd", padding: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#0c4a6e", marginBottom: 10 }}>👁️ حدة البصر (Snellen)</p>
          {latest?.visual_acuity ? (
            <div>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#0284c7", marginBottom: 6 }}>{latest.visual_acuity}</p>
              <p style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700 }}>آخر قياس: {formatDate(latest.date)}</p>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#94a3b8" }}>لا توجد قياسات بعد</p>
          )}
          {/* Snellen scale */}
          <div style={{ marginTop: 10 }}>
            {SNELLEN_LEVELS.map((l) => {
              const isMatch = latest?.visual_acuity?.includes(l.fraction);
              return (
                <div key={l.fraction} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "3px 6px",
                  borderRadius: 6, marginBottom: 2,
                  background: isMatch ? l.color + "22" : "transparent",
                  border: isMatch ? `1px solid ${l.color}66` : "1px solid transparent",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: l.color, width: 34 }}>{l.fraction}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#e2e8f0" }}>
                    <div style={{
                      width: l.percent, height: "100%", background: l.color,
                      borderRadius: 3,
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#6b7280", width: 55, textAlign: "right" }}>{l.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* IOP */}
        <div style={{ background: "#fdf4ff", borderRadius: 14, border: "1px solid #e9d5ff", padding: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#6b21a8", marginBottom: 10 }}>💧 ضغط العين (IOP)</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={{ textAlign: "center", background: "white", borderRadius: 10, padding: "10px 6px", border: "1px solid #e9d5ff" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>العين اليمنى (OD)</p>
              <IOPBadge value={iop.od} />
            </div>
            <div style={{ textAlign: "center", background: "white", borderRadius: 10, padding: "10px 6px", border: "1px solid #e9d5ff" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>العين اليسرى (OS)</p>
              <IOPBadge value={iop.os ?? iop.od} />
            </div>
          </div>
          <div style={{ background: "white", borderRadius: 10, padding: "8px 10px", border: "1px solid #e9d5ff" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", marginBottom: 4 }}>مرجع القيم:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { range: "10–15 mmHg", label: "طبيعي منخفض", color: "#16a34a" },
                { range: "16–21 mmHg", label: "طبيعي",        color: "#65a30d" },
                { range: "> 21 mmHg",  label: "مرتفع — تقييم جلوكوما", color: "#ef4444" },
              ].map((r) => (
                <div key={r.range} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#374151" }}><strong>{r.range}</strong> — {r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Glasses Prescription */}
      {latest?.glasses_prescription && (
        <div style={{ background: "#fff7ed", borderRadius: 14, border: "1px solid #fed7aa", padding: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#9a3412", marginBottom: 10 }}>
            👓 وصفة النظارات — {formatDate(latest.date)}
          </p>
          <pre style={{
            fontSize: 13, fontFamily: "monospace", color: "#7c2d12",
            background: "white", borderRadius: 10, padding: "10px 14px",
            border: "1px solid #fed7aa", whiteSpace: "pre-wrap", lineHeight: 1.7,
          }}>
            {latest.glasses_prescription}
          </pre>
        </div>
      )}

      {/* Visit history */}
      {eyeRecords.length > 1 && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <p style={{ fontSize: 12, fontWeight: 900, color: "#1e293b" }}>📊 سجل الزيارات البصرية</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["التاريخ", "حدة البصر", "ضغط العين", "فحص المصباح"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", fontWeight: 800, color: "#64748b", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eyeRecords.map((v, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, color: "#475569" }}>{formatDate(v.date)}</td>
                    <td style={{ padding: "8px 12px", color: "#0284c7", fontWeight: 700 }}>{v.visual_acuity ?? "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#7c3aed", fontWeight: 700 }}>{v.eye_pressure ?? "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#374151", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.slit_lamp_exam ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {eyeRecords.length === 0 && (
        <div style={{ background: "#f8fafc", borderRadius: 14, border: "1px dashed #e2e8f0", padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>👁️</p>
          <p style={{ fontSize: 14, fontWeight: 900, color: "#475569" }}>لا توجد بيانات فحص عيون بعد</p>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>أضف زيارة طبية مع قياسات العين لتظهر هنا</p>
        </div>
      )}
    </div>
  );
}
