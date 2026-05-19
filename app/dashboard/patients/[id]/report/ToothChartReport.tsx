const TREATMENTS = [
  { key: "filling",    label: "حشو",       color: "#f59e0b" },
  { key: "extraction", label: "خلع",        color: "#ef4444" },
  { key: "rootCanal",  label: "علاج عصب",  color: "#8b5cf6" },
  { key: "crown",      label: "تلبيس",      color: "#3b82f6" },
  { key: "cleaning",   label: "تنظيف جير", color: "#10b981" },
  { key: "implant",    label: "زراعة",      color: "#f97316" },
  { key: "other",      label: "أخرى",       color: "#6b7280" },
];

const TOOTH_COORDS: { num: number; x: number; y: number; w: number; h: number }[] = [
  { num: 18, x: 30,  y: 140, w: 50, h: 120 },
  { num: 17, x: 90,  y: 140, w: 50, h: 120 },
  { num: 16, x: 158, y: 140, w: 50, h: 120 },
  { num: 15, x: 212, y: 140, w: 44, h: 120 },
  { num: 14, x: 260, y: 140, w: 39, h: 120 },
  { num: 13, x: 303, y: 140, w: 38, h: 120 },
  { num: 12, x: 345, y: 140, w: 30, h: 120 },
  { num: 11, x: 379, y: 140, w: 44, h: 120 },
  { num: 21, x: 441, y: 140, w: 44, h: 120 },
  { num: 22, x: 489, y: 140, w: 36, h: 120 },
  { num: 23, x: 530, y: 140, w: 34, h: 120 },
  { num: 24, x: 569, y: 140, w: 44, h: 120 },
  { num: 25, x: 615, y: 140, w: 44, h: 120 },
  { num: 26, x: 669, y: 140, w: 50, h: 120 },
  { num: 27, x: 723, y: 140, w: 50, h: 120 },
  { num: 28, x: 777, y: 140, w: 50, h: 120 },
  { num: 48, x: 30,  y: 278, w: 50, h: 120 },
  { num: 47, x: 90,  y: 278, w: 50, h: 120 },
  { num: 46, x: 158, y: 278, w: 50, h: 120 },
  { num: 45, x: 212, y: 278, w: 44, h: 120 },
  { num: 44, x: 260, y: 278, w: 39, h: 120 },
  { num: 43, x: 303, y: 278, w: 38, h: 120 },
  { num: 42, x: 345, y: 278, w: 30, h: 120 },
  { num: 41, x: 379, y: 278, w: 44, h: 120 },
  { num: 31, x: 441, y: 278, w: 44, h: 120 },
  { num: 32, x: 489, y: 278, w: 30, h: 120 },
  { num: 33, x: 524, y: 278, w: 44, h: 120 },
  { num: 34, x: 573, y: 278, w: 34, h: 120 },
  { num: 35, x: 613, y: 278, w: 44, h: 120 },
  { num: 36, x: 667, y: 278, w: 50, h: 120 },
  { num: 37, x: 727, y: 278, w: 50, h: 120 },
  { num: 38, x: 781, y: 278, w: 50, h: 120 },
];

type Treatment = { id: string; toothNumber: number; treatment: string; notes: string | null };

export default function ToothChartReport({ treatments }: { treatments: Treatment[] }) {
  function getTreatment(tooth: number) {
    return treatments.find((t) => t.toothNumber === tooth);
  }
  function getInfo(key: string) {
    return TREATMENTS.find((t) => t.key === key);
  }

  if (treatments.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: 13, fontWeight: 700 }}>
        لا توجد علاجات مسجلة في خريطة الأسنان
      </div>
    );
  }

  return (
    <div dir="rtl">
      {/* خريطة الأسنان الثابتة */}
      <div style={{ position: "relative", width: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div style={{ position: "relative", width: "100%", paddingBottom: "47.8%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dental-chart.jpg"
            alt="خريطة الأسنان"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
          <svg
            viewBox="0 0 900 430"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            {TOOTH_COORDS.map(({ num, x, y, w, h }) => {
              const t = getTreatment(num);
              const info = t ? getInfo(t.treatment) : null;
              if (!info) return null;
              return (
                <g key={num}>
                  <rect x={x} y={y} width={w} height={h} rx={8} fill={info.color} opacity={0.55} />
                  <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize={10} fontWeight="900" fill={info.color}>
                    {num}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* مفتاح الألوان */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {TREATMENTS.map((t) => (
          <span key={t.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#475569" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: t.color, display: "inline-block" }} />
            {t.label}
          </span>
        ))}
      </div>

      {/* جدول العلاجات */}
      <table style={{ width: "100%", marginTop: 14, borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={{ padding: "7px 10px", textAlign: "right", fontWeight: 900, color: "#64748b", borderBottom: "1.5px solid #e2e8f0" }}>رقم السن</th>
            <th style={{ padding: "7px 10px", textAlign: "right", fontWeight: 900, color: "#64748b", borderBottom: "1.5px solid #e2e8f0" }}>نوع العلاج</th>
            <th style={{ padding: "7px 10px", textAlign: "right", fontWeight: 900, color: "#64748b", borderBottom: "1.5px solid #e2e8f0" }}>ملاحظة</th>
          </tr>
        </thead>
        <tbody>
          {treatments.map((t) => {
            const info = getInfo(t.treatment);
            return (
              <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "6px 10px", fontWeight: 800, color: "#1e3a8a" }}>{t.toothNumber}</td>
                <td style={{ padding: "6px 10px", fontWeight: 700, color: info?.color ?? "#6b7280" }}>{info?.label ?? t.treatment}</td>
                <td style={{ padding: "6px 10px", fontWeight: 600, color: "#64748b" }}>{t.notes ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
