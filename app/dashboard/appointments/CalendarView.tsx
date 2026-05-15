"use client";

type Appt = {
  id: string;
  date: string;
  status: string;
  patient: { name: string };
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200 line-through opacity-60",
};

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function CalendarView({ appointments }: { appointments: Appt[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // First day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group appointments by day
  const byDay: Record<number, Appt[]> = {};
  for (const appt of appointments) {
    const d = new Date(appt.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(appt);
    }
  }

  const monthLabel = now.toLocaleDateString("ar-IQ", { month: "long", year: "numeric" });

  // Build cells: empty slots + day cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4" dir="rtl">
      {/* Header */}
      <div className="mb-4 text-center">
        <p className="text-base font-black text-slate-800">{monthLabel}</p>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-bold text-slate-400">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const appts = byDay[day] ?? [];
          const isToday = day === now.getDate();
          return (
            <div
              key={i}
              className={`min-h-[72px] rounded-lg border p-1 text-right transition
                ${isToday ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}
            >
              <span className={`block text-xs font-black mb-1
                ${isToday ? "text-blue-700" : "text-slate-600"}`}>
                {day}
              </span>
              {appts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className={`mb-0.5 truncate rounded border px-1 py-0.5 text-[10px] font-bold ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                  title={`${a.patient.name} — ${new Date(a.date).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}`}
                >
                  {a.patient.name.split(" ")[0]}
                </div>
              ))}
              {appts.length > 3 && (
                <div className="text-[9px] font-bold text-slate-400 text-center">+{appts.length - 3}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        {[
          { status: "pending", label: "معلق" },
          { status: "confirmed", label: "مؤكد" },
          { status: "completed", label: "مكتمل" },
          { status: "cancelled", label: "ملغي" },
        ].map(({ status, label }) => (
          <span key={status} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[status]}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
