"use client";

import { useState } from "react";

type MedicalRecord = {
  id: string;
  date: string;
  contentJson: unknown;
  specialtyCode: string | null;
};

type DataPoint = { date: string; value: number };

const VACCINES = [
  { id: "bcg",       labelAr: "BCG — السل",              age: "عند الولادة" },
  { id: "hepb1",     labelAr: "التهاب الكبد B (الأولى)", age: "عند الولادة" },
  { id: "hepb2",     labelAr: "التهاب الكبد B (الثانية)",age: "شهرين" },
  { id: "dtap1",     labelAr: "DTP (الأولى)",             age: "شهرين" },
  { id: "ipv1",      labelAr: "شلل الأطفال (أولى)",       age: "شهرين" },
  { id: "hib1",      labelAr: "Hib (الأولى)",             age: "شهرين" },
  { id: "pcv1",      labelAr: "المكورات الرئوية (أولى)",  age: "شهرين" },
  { id: "dtap2",     labelAr: "DTP (الثانية)",            age: "أربعة أشهر" },
  { id: "ipv2",      labelAr: "شلل الأطفال (ثانية)",      age: "أربعة أشهر" },
  { id: "hib2",      labelAr: "Hib (الثانية)",            age: "أربعة أشهر" },
  { id: "dtap3",     labelAr: "DTP (الثالثة)",            age: "ستة أشهر" },
  { id: "ipv3",      labelAr: "شلل الأطفال (ثالثة)",      age: "ستة أشهر" },
  { id: "mmr1",      labelAr: "MMR — حصبة نكاف حصبة ألمانية", age: "12 شهراً" },
  { id: "var1",      labelAr: "جدري الماء",               age: "12 شهراً" },
  { id: "mmr2",      labelAr: "MMR (الثانية)",            age: "18 شهراً" },
  { id: "dtap4",     labelAr: "DTP (رابعة)",              age: "18 شهراً" },
  { id: "flu",       labelAr: "الإنفلونزا السنوية",        age: "سنوي" },
];

function extractNumber(content: unknown, key: string): number | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const val = (content as Record<string, unknown>)[key];
  if (val === undefined || val === null || val === "") return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function MiniLineChart({ data, color, unit, label }: { data: DataPoint[]; color: string; unit: string; label: string }) {
  if (data.length === 0) {
    return (
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>لا توجد بيانات {label} بعد</p>
        <p style={{ fontSize: 11, color: "#cbd5e1" }}>سيظهر المنحنى هنا بمجرد تسجيل القيمة في السجل الطبي</p>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const W = 360, H = 120, PAD = 30;
  const chartW = W - PAD * 2;
  const chartH = H - PAD;

  const pts = data.map((d, i) => ({
    x: PAD + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD / 2 + ((maxV - d.value) / range) * chartH,
    v: d.value,
    date: new Date(d.date).toLocaleDateString("ar-IQ", { month: "short", year: "2-digit" }),
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const latest = pts[pts.length - 1];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#475569" }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 900, color }}>
          {latest.v} <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{unit}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", overflow: "visible" }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={color} />
            {i === pts.length - 1 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill={color} fontWeight="800">{p.v}</text>
            )}
          </g>
        ))}
        <text x={pts[0].x} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">{pts[0].date}</text>
        {pts.length > 1 && (
          <text x={latest.x} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">{latest.date}</text>
        )}
      </svg>
    </div>
  );
}

function formatDose(weightKg: number | null, medication: string, doseMgPerKg: number, maxMg: number): string {
  if (!weightKg) return "—";
  const dose = Math.min(weightKg * doseMgPerKg, maxMg);
  return `${dose.toFixed(0)} mg`;
}

export default function GrowthChartClient({ records }: { records: MedicalRecord[] }) {
  const pedRecords = records.filter(
    (r) => r.specialtyCode === "pediatrics" || !r.specialtyCode
  );

  const weightData: DataPoint[] = pedRecords
    .map((r) => {
      const v = extractNumber(r.contentJson, "weight");
      return v ? { date: r.date, value: v } : null;
    })
    .filter((d): d is DataPoint => d !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const heightData: DataPoint[] = pedRecords
    .map((r) => {
      const v = extractNumber(r.contentJson, "height");
      return v ? { date: r.date, value: v } : null;
    })
    .filter((d): d is DataPoint => d !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const latestWeight = weightData[weightData.length - 1]?.value ?? null;

  const DOSE_DRUGS = [
    { name: "باراسيتامول",  mgPerKg: 15, maxMg: 1000, note: "كل 6 ساعات" },
    { name: "إيبوبروفين",   mgPerKg: 10, maxMg: 600,  note: "كل 8 ساعات" },
    { name: "أموكسيسيلين",  mgPerKg: 40, maxMg: 1500, note: "÷ 3 جرعات يومياً" },
    { name: "أزيثروميسين",  mgPerKg: 10, maxMg: 500,  note: "مرة واحدة يومياً" },
    { name: "سيتيريزين",    mgPerKg: 0.25,maxMg: 10,  note: "جرعة واحدة مساءً" },
  ];

  const [vaccinesDone, setVaccinesDone] = useState<Set<string>>(new Set());

  function toggleVaccine(id: string) {
    setVaccinesDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const doneCount = vaccinesDone.size;
  const totalCount = VACCINES.length;

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Growth Charts */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div style={{ background: "#f0fdf4", borderRadius: 14, border: "1px solid #bbf7d0", padding: 14 }}>
          <MiniLineChart data={weightData} color="#16a34a" unit="كغم" label="الوزن" />
        </div>
        <div style={{ background: "#eff6ff", borderRadius: 14, border: "1px solid #bfdbfe", padding: 14 }}>
          <MiniLineChart data={heightData} color="#2563eb" unit="سم" label="الطول" />
        </div>
      </div>

      {/* Drug doses */}
      <div style={{ background: "#fefce8", borderRadius: 14, border: "1px solid #fef08a", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#713f12" }}>💊 حساب الجرعات حسب الوزن</p>
          <span style={{ fontSize: 12, color: "#a16207", fontWeight: 700 }}>
            {latestWeight ? `${latestWeight} كغم` : "أدخل الوزن في السجل الطبي"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {DOSE_DRUGS.map((d) => (
            <div key={d.name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "white", borderRadius: 10, padding: "8px 12px",
              border: "1px solid #fef08a",
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1c1917" }}>{d.name}</span>
                <span style={{ fontSize: 11, color: "#78716c", marginRight: 6 }}>{d.note}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#b45309" }}>
                {formatDose(latestWeight, d.name, d.mgPerKg, d.maxMg)}
              </span>
            </div>
          ))}
        </div>
        {!latestWeight && (
          <p style={{ fontSize: 11, color: "#a16207", marginTop: 8, fontWeight: 600 }}>
            * سيتم حساب الجرعات تلقائياً بمجرد تسجيل وزن المريض في السجل الطبي
          </p>
        )}
      </div>

      {/* Vaccination Schedule */}
      <div style={{ background: "#f0f9ff", borderRadius: 14, border: "1px solid #bae6fd", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: "#0c4a6e" }}>💉 جدول التطعيمات</p>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#0284c7", background: "#e0f2fe", borderRadius: 20, padding: "3px 10px" }}>
            {doneCount} / {totalCount} مكتمل
          </span>
        </div>
        <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {VACCINES.map((v) => {
            const done = vaccinesDone.has(v.id);
            return (
              <div
                key={v.id}
                onClick={() => toggleVaccine(v.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 10, cursor: "pointer",
                  background: done ? "#dcfce7" : "white",
                  border: `1px solid ${done ? "#86efac" : "#e0f2fe"}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: done ? "#16a34a" : "#e0f2fe",
                  border: `1.5px solid ${done ? "#16a34a" : "#7dd3fc"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 12, flexShrink: 0,
                }}>
                  {done ? "✓" : ""}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: done ? "#15803d" : "#0c4a6e", margin: 0 }}>{v.labelAr}</p>
                  <p style={{ fontSize: 10, color: "#60a5fa", margin: 0 }}>{v.age}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 10, color: "#7dd3fc", marginTop: 10, fontWeight: 600 }}>
          * حالة التطعيمات المحددة هنا تُحفظ محلياً فقط. للحفظ الدائم، سجّلها في ملاحظات السجل الطبي.
        </p>
      </div>
    </div>
  );
}
