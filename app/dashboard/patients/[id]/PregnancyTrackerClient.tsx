"use client";

import { useState, useMemo } from "react";

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

function calcPregnancy(lmpStr: string) {
  const lmp = new Date(lmpStr);
  const now = new Date();
  const diffMs = now.getTime() - lmp.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
  const daysToEdd = Math.ceil((edd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const trimester = weeks < 14 ? 1 : weeks < 28 ? 2 : 3;
  return { weeks, days, edd, daysToEdd, trimester, totalDays };
}

const TRIMESTER_INFO: Record<number, { nameAr: string; color: string; bg: string; border: string; icon: string }> = {
  1: { nameAr: "الثلث الأول",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: "🌱" },
  2: { nameAr: "الثلث الثاني", color: "#0284c7", bg: "#eff6ff", border: "#bfdbfe", icon: "🌸" },
  3: { nameAr: "الثلث الثالث", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", icon: "👶" },
};

const FOLLOWUP_SCHEDULE = [
  { week: 8,  labelAr: "أول زيارة — تأكيد الحمل وتاريخ اللقب" },
  { week: 12, labelAr: "مسح الأمراض الكروموسومية (NT scan)" },
  { week: 16, labelAr: "متابعة + تحليل الدم الشامل" },
  { week: 20, labelAr: "السونار التشريحي (anatomy scan)" },
  { week: 24, labelAr: "اختبار السكر (OGTT)" },
  { week: 28, labelAr: "جرعة الغلوبولين + فحص RH" },
  { week: 32, labelAr: "سونار متابعة نمو الجنين" },
  { week: 36, labelAr: "فحص وضع الجنين + مسحة GBS" },
  { week: 38, labelAr: "فحص عنق الرحم + جاهزية الولادة" },
  { week: 40, labelAr: "تقييم الولادة — طبيعي أو قيصري" },
];

export default function PregnancyTrackerClient({ records }: { records: MedicalRecord[] }) {
  const obRecords = records.filter(
    (r) => r.specialtyCode === "gynecology" || !r.specialtyCode
  );

  const latestLmpFromRecord = useMemo(() => {
    for (const r of obRecords) {
      const lmp = getStr(r.contentJson, "lmp");
      if (lmp) return lmp;
    }
    return null;
  }, [obRecords]);

  const [lmpInput, setLmpInput] = useState(latestLmpFromRecord ?? "");

  const pregnancy = useMemo(() => {
    if (!lmpInput) return null;
    try { return calcPregnancy(lmpInput); } catch { return null; }
  }, [lmpInput]);

  const trimInfo = pregnancy ? TRIMESTER_INFO[pregnancy.trimester] : null;

  const ultraRecords = obRecords
    .map((r) => ({ date: r.date, notes: getStr(r.contentJson, "ultrasound") }))
    .filter((x) => x.notes);

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* LMP Input */}
      <div style={{
        background: "white", borderRadius: 14, border: "1.5px solid #e2e8f0",
        padding: "14px 16px",
      }}>
        <p style={{ fontSize: 13, fontWeight: 900, color: "#7c3aed", marginBottom: 10 }}>
          🗓️ حاسبة الحمل — آخر دورة شهرية
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>
              تاريخ آخر دورة (LMP)
            </label>
            <input
              type="date"
              value={lmpInput}
              onChange={(e) => setLmpInput(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px",
                border: "1.5px solid #ddd6fe", borderRadius: 10,
                fontSize: 14, boxSizing: "border-box", direction: "ltr",
              }}
            />
          </div>
          {latestLmpFromRecord && latestLmpFromRecord !== lmpInput && (
            <button
              onClick={() => setLmpInput(latestLmpFromRecord)}
              style={{
                padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 800,
                background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe",
                cursor: "pointer", marginTop: 20,
              }}
            >
              استخدم من السجل
            </button>
          )}
        </div>
      </div>

      {/* Pregnancy result */}
      {pregnancy && trimInfo ? (
        <>
          {/* Status card */}
          <div style={{
            background: trimInfo.bg, borderRadius: 14, border: `1.5px solid ${trimInfo.border}`,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: trimInfo.color, opacity: 0.8 }}>
                  {trimInfo.icon} {trimInfo.nameAr}
                </p>
                <p style={{ fontSize: 28, fontWeight: 900, color: trimInfo.color, lineHeight: 1.1, margin: "4px 0" }}>
                  {pregnancy.weeks} أسبوع {pregnancy.days > 0 ? `و ${pregnancy.days} أيام` : ""}
                </p>
                <p style={{ fontSize: 12, color: trimInfo.color, opacity: 0.7, fontWeight: 700 }}>
                  {pregnancy.daysToEdd > 0 ? `باقي ${pregnancy.daysToEdd} يوم للولادة` : "تجاوزت موعد الولادة المتوقع"}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: trimInfo.color, opacity: 0.7 }}>موعد الولادة المتوقع (EDD)</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: trimInfo.color }}>
                  {pregnancy.edd.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: trimInfo.color, opacity: 0.7, marginBottom: 4 }}>
                <span>أسبوع 1</span>
                <span>أسبوع 14</span>
                <span>أسبوع 28</span>
                <span>أسبوع 40</span>
              </div>
              <div style={{ position: "relative", height: 14, background: "white", borderRadius: 10, border: `1px solid ${trimInfo.border}` }}>
                <div style={{
                  position: "absolute", right: 0, top: 0,
                  width: `${Math.min((pregnancy.weeks / 40) * 100, 100)}%`,
                  height: "100%", background: trimInfo.color,
                  borderRadius: 10, transition: "width 0.3s",
                }} />
                {/* trimester markers */}
                <div style={{ position: "absolute", left: "65%", top: 0, bottom: 0, width: 1.5, background: `${trimInfo.color}60` }} />
                <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: 1.5, background: `${trimInfo.color}60` }} />
              </div>
            </div>
          </div>

          {/* Follow-up schedule */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
            <p style={{ fontSize: 13, fontWeight: 900, color: "#1e293b", marginBottom: 12 }}>📋 جدول المتابعة الموصى به</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {FOLLOWUP_SCHEDULE.map((f) => {
                const passed = pregnancy.weeks >= f.week;
                const current = Math.abs(pregnancy.weeks - f.week) <= 2;
                return (
                  <div key={f.week} style={{
                    display: "flex", gap: 10, alignItems: "center",
                    padding: "7px 12px", borderRadius: 10,
                    background: current ? "#fefce8" : passed ? "#f0fdf4" : "#f8fafc",
                    border: `1px solid ${current ? "#fef08a" : passed ? "#bbf7d0" : "#e2e8f0"}`,
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: current ? "#fbbf24" : passed ? "#16a34a" : "#e2e8f0",
                      color: "white", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 10, fontWeight: 900,
                    }}>
                      {f.week}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 800, color: passed ? "#15803d" : "#374151", margin: 0 }}>
                        {f.labelAr}
                      </p>
                      <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>أسبوع {f.week}</p>
                    </div>
                    {current && <span style={{ marginRight: "auto", fontSize: 11, fontWeight: 900, color: "#b45309" }}>← الآن</span>}
                    {passed && !current && <span style={{ marginRight: "auto", fontSize: 11, color: "#16a34a" }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ultrasound history */}
          {ultraRecords.length > 0 && (
            <div style={{ background: "#f0f9ff", borderRadius: 14, border: "1px solid #bae6fd", padding: "14px 16px" }}>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#0c4a6e", marginBottom: 10 }}>🔬 سجل الموجات فوق الصوتية</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ultraRecords.map((u, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 10, padding: "8px 12px", border: "1px solid #bae6fd" }}>
                    <p style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 700 }}>
                      {new Date(u.date).toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p style={{ fontSize: 12, color: "#0c4a6e", marginTop: 2 }}>{u.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        !lmpInput && (
          <div style={{
            background: "#f5f3ff", borderRadius: 14, border: "1px dashed #ddd6fe",
            padding: 24, textAlign: "center",
          }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>🤰</p>
            <p style={{ fontSize: 14, fontWeight: 900, color: "#7c3aed" }}>أدخل تاريخ آخر دورة شهرية</p>
            <p style={{ fontSize: 12, color: "#a78bfa", marginTop: 4 }}>
              سيتم حساب عمر الحمل وتاريخ الولادة المتوقع تلقائياً
            </p>
          </div>
        )
      )}
    </div>
  );
}
