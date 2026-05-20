"use client";

import { useMemo } from "react";

type MedicalRecord = {
  id: string;
  date: string;
  contentJson: unknown;
  specialtyCode: string | null;
};

type LabVisit = {
  date: string;
  vitals: string | null;
  chronic: string | null;
  labSummary: string | null;
  assessment: string | null;
  treatmentPlan: string | null;
};

function getStr(content: unknown, key: string): string | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const val = (content as Record<string, unknown>)[key];
  return typeof val === "string" && val.trim() ? val.trim() : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
}

const COMMON_LAB_PATTERNS = [
  { key: "glucose",    patterns: ["glucose", "سكر", "FBS", "FBG", "random glucose"], unit: "mg/dL", low: 70, high: 99, highWarn: 126, label: "سكر الدم" },
  { key: "hba1c",      patterns: ["HbA1c", "A1c", "الهيموغلوبين السكري"],          unit: "%",     low: 0,  high: 5.7, highWarn: 6.5, label: "HbA1c" },
  { key: "creatinine", patterns: ["creatinine", "كرياتينين"],                        unit: "mg/dL", low: 0.6, high: 1.2, highWarn: 2.0, label: "الكرياتينين" },
  { key: "urea",       patterns: ["urea", "يوريا", "BUN"],                          unit: "mg/dL", low: 7,  high: 20, highWarn: 40,  label: "اليوريا" },
  { key: "hgb",        patterns: ["hemoglobin", "هيموغلوبين", "Hgb", "Hb"],         unit: "g/dL",  low: 12, high: 17, highWarn: 99,  label: "الهيموغلوبين" },
  { key: "wbc",        patterns: ["WBC", "كريات بيض"],                              unit: "×10³",  low: 4,  high: 11, highWarn: 99,  label: "كريات الدم البيضاء" },
  { key: "cholesterol",patterns: ["cholesterol", "كوليسترول", "LDL", "HDL"],        unit: "mg/dL", low: 0,  high: 200, highWarn: 240, label: "الكوليسترول" },
  { key: "alt",        patterns: ["ALT", "SGPT", "alanine"],                         unit: "U/L",   low: 0,  high: 56, highWarn: 100, label: "ALT (كبد)" },
  { key: "tsh",        patterns: ["TSH", "thyroid", "غدة درقية"],                   unit: "mIU/L", low: 0.4, high: 4, highWarn: 10,  label: "TSH (درقية)" },
];

function extractLabValue(text: string, patterns: string[]): { raw: string; value: number | null } | null {
  const lower = text.toLowerCase();
  for (const p of patterns) {
    const idx = lower.indexOf(p.toLowerCase());
    if (idx === -1) continue;
    const around = text.slice(idx, idx + 60);
    const numMatch = around.match(/[:\s=]+(\d+\.?\d*)/);
    if (numMatch) {
      return { raw: around.trim().slice(0, 50), value: parseFloat(numMatch[1]) };
    }
    return { raw: around.trim().slice(0, 50), value: null };
  }
  return null;
}

function StatusDot({ value, low, high, highWarn }: { value: number; low: number; high: number; highWarn: number }) {
  let color = "#16a34a"; // normal
  if (value < low || value > highWarn) color = "#ef4444";
  else if (value > high) color = "#f59e0b";
  return <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />;
}

function ChronicTag({ label }: { label: string }) {
  const COLORS: Record<string, { bg: string; color: string }> = {
    default: { bg: "#f1f5f9", color: "#475569" },
    diabetes:{ bg: "#fef9c3", color: "#854d0e" },
    hyper:   { bg: "#fee2e2", color: "#991b1b" },
    kidney:  { bg: "#ede9fe", color: "#5b21b6" },
  };
  const lower = label.toLowerCase();
  const style = lower.includes("سكر") || lower.includes("diabetes")
    ? COLORS.diabetes
    : lower.includes("ضغط") || lower.includes("hyper")
    ? COLORS.hyper
    : lower.includes("كلى") || lower.includes("kidney")
    ? COLORS.kidney
    : COLORS.default;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800,
      background: style.bg, color: style.color,
    }}>
      {label}
    </span>
  );
}

export default function LabTrackerClient({ records }: { records: MedicalRecord[] }) {
  const labVisits: LabVisit[] = useMemo(() => {
    return records
      .filter((r) => r.specialtyCode === "internal_medicine" || !r.specialtyCode)
      .map((r) => ({
        date: r.date,
        vitals:       getStr(r.contentJson, "vitals"),
        chronic:      getStr(r.contentJson, "chronic_conditions"),
        labSummary:   getStr(r.contentJson, "lab_summary"),
        assessment:   getStr(r.contentJson, "assessment"),
        treatmentPlan:getStr(r.contentJson, "treatment_plan"),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const allLabText = labVisits.map((v) => v.labSummary ?? "").join("\n");

  const extractedLabs = useMemo(() => {
    if (!allLabText.trim()) return [];
    return COMMON_LAB_PATTERNS
      .map((lab) => {
        const found = extractLabValue(allLabText, lab.patterns);
        return found ? { ...lab, found } : null;
      })
      .filter(Boolean) as (typeof COMMON_LAB_PATTERNS[0] & { found: { raw: string; value: number | null } })[];
  }, [allLabText]);

  const latestChronic = labVisits.find((v) => v.chronic)?.chronic ?? null;
  const chronicList = latestChronic
    ? latestChronic.split(/[،,\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Chronic diseases */}
      {chronicList.length > 0 && (
        <div style={{ background: "#fefce8", borderRadius: 14, border: "1px solid #fef08a", padding: "12px 14px" }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#713f12", marginBottom: 8 }}>🩺 الأمراض المزمنة المسجلة</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chronicList.map((c, i) => <ChronicTag key={i} label={c} />)}
          </div>
        </div>
      )}

      {/* Lab value cards */}
      {extractedLabs.length > 0 && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "#1e293b", marginBottom: 10 }}>🧪 قراءة التحاليل المكتشفة</p>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {extractedLabs.map((lab) => {
              const val = lab.found.value;
              let statusColor = "#16a34a";
              let statusLabel = "طبيعي";
              if (val !== null) {
                if (val < lab.low || val > lab.highWarn) { statusColor = "#ef4444"; statusLabel = "خارج النطاق"; }
                else if (val > lab.high) { statusColor = "#f59e0b"; statusLabel = "تحت المراقبة"; }
              }
              return (
                <div key={lab.key} style={{
                  background: statusColor + "10", borderRadius: 12,
                  border: `1px solid ${statusColor}33`, padding: "10px 12px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#475569" }}>{lab.label}</span>
                    {val !== null && <StatusDot value={val} low={lab.low} high={lab.high} highWarn={lab.highWarn} />}
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: statusColor, margin: "4px 0" }}>
                    {val !== null ? val : "—"}
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginRight: 4 }}>{lab.unit}</span>
                  </p>
                  <p style={{ fontSize: 10, color: statusColor, fontWeight: 700 }}>{statusLabel}</p>
                  <p style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>
                    طبيعي: {lab.low}–{lab.high} {lab.unit}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visit history */}
      {labVisits.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {labVisits.map((v, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
              }}>
                <p style={{ fontSize: 12, fontWeight: 900, color: "#1e293b" }}>{formatDate(v.date)}</p>
                {i === 0 && (
                  <span style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 20, fontWeight: 800 }}>
                    آخر زيارة
                  </span>
                )}
              </div>
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {v.vitals && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>
                      العلامات الحيوية
                    </p>
                    <p style={{ fontSize: 12, color: "#374151" }}>{v.vitals}</p>
                  </div>
                )}
                {v.labSummary && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>
                      ملخص التحاليل
                    </p>
                    <p style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-line" }}>{v.labSummary}</p>
                  </div>
                )}
                {v.assessment && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>
                      التقييم
                    </p>
                    <p style={{ fontSize: 12, color: "#374151" }}>{v.assessment}</p>
                  </div>
                )}
                {v.treatmentPlan && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>
                      خطة العلاج
                    </p>
                    <p style={{ fontSize: 12, color: "#374151" }}>{v.treatmentPlan}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "#f8fafc", borderRadius: 14, border: "1px dashed #e2e8f0", padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>🏥</p>
          <p style={{ fontSize: 14, fontWeight: 900, color: "#475569" }}>لا توجد سجلات باطنية بعد</p>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>أضف زيارة طبية للبدء بمتابعة التحاليل والأمراض المزمنة</p>
        </div>
      )}
    </div>
  );
}
