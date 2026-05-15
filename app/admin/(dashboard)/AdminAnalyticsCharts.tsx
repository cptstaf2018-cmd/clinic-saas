"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid,
} from "recharts";

const PLAN_COLORS: Record<string, string> = {
  تجريبي: "#94a3b8",
  أساسية: "#3b82f6",
  متوسطة: "#8b5cf6",
  مميزة: "#f59e0b",
};

type AnalyticsData = {
  revenueTrend: { day: string; revenue: number }[];
  appointmentsTrend: { day: string; appointments: number }[];
  plansDistribution: { name: string; value: number; plan: string }[];
  totals: { revenue: number; clinics: number; activeClinics: number; patients: number };
};

export default function AdminAnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  const fmtIQD = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}م` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}ك` : String(v);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-gray-100" />)}
    </div>
  );
  if (!data) return null;

  const hasRevenue = data.revenueTrend.some(r => r.revenue > 0);
  const hasAppts = data.appointmentsTrend.some(a => a.appointments > 0);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-semibold">الفترة:</span>
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition
              ${days === d ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {d} يوم
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm md:col-span-2">
          <div className="text-xs font-bold text-gray-500 mb-3">الإيرادات (د.ع)</div>
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data.revenueTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={Math.floor(data.revenueTrend.length / 5)} />
                <YAxis tickFormatter={fmtIQD} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} د.ع`, "الإيرادات"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400">لا توجد مدفوعات في هذه الفترة</div>
          )}
        </div>

        {/* Plans Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-xs font-bold text-gray-500 mb-3">توزيع الباقات</div>
          {data.plansDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={data.plansDistribution} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                    {data.plansDistribution.map((e, i) => (
                      <Cell key={i} fill={PLAN_COLORS[e.name] ?? "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, _, props: any) => [v, props.payload.name]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {data.plansDistribution.map((e, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[e.name] ?? "#6366f1" }} />
                    {e.name} ({e.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400">لا توجد اشتراكات</div>
          )}
        </div>

        {/* Appointments Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm md:col-span-3">
          <div className="text-xs font-bold text-gray-500 mb-3">الحجوزات اليومية</div>
          {hasAppts ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.appointmentsTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={Math.floor(data.appointmentsTrend.length / 6)} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={28} />
                <Tooltip formatter={(v) => [v, "حجز"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="appointments" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-28 flex items-center justify-center text-sm text-gray-400">لا توجد حجوزات في هذه الفترة</div>
          )}
        </div>
      </div>
    </div>
  );
}
