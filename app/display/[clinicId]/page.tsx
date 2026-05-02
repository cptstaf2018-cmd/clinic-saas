"use client";

import { useEffect, useState } from "react";

interface DisplayData {
  current: { name: string; queueNumber: number | null } | null;
  waiting: { name: string; queueNumber: number | null }[];
}

export default function DisplayPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [data, setData] = useState<DisplayData>({ current: null, waiting: [] });
  const [tick, setTick] = useState(0);

  useEffect(() => { params.then((p) => setClinicId(p.clinicId)); }, [params]);

  useEffect(() => {
    if (!clinicId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/display/${clinicId}`);
        if (res.ok) setData(await res.json());
      } catch {}
    };
    fetchData();
    const interval = setInterval(() => { fetchData(); setTick((t) => t + 1); }, 5000);
    return () => clearInterval(interval);
  }, [clinicId]);

  // Blinking colon for clock effect
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      dir="rtl"
      className="min-h-screen pattern-medical flex flex-col"
      style={{ fontFamily: "var(--font-cairo), Cairo, sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-10 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
            <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
              <rect x="15" y="4" width="10" height="32" rx="2" fill="white"/>
              <rect x="4" y="15" width="32" height="10" rx="2" fill="white"/>
            </svg>
          </div>
          <span className="text-white/90 font-bold text-xl tracking-wide">نظام الانتظار</span>
        </div>
        <div className="text-blue-200/80 text-2xl font-bold tabular-nums tracking-widest">
          {time}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-10 py-10">

        {/* Current patient */}
        <div className="w-full max-w-3xl">
          <p className="text-blue-300/70 text-sm font-semibold uppercase tracking-widest text-center mb-4">
            يُرجى الدخول الآن
          </p>
          <div
            className="relative bg-gradient-to-br from-[#1A3A6B] to-[#0C2D5A] rounded-3xl p-10 text-center border border-blue-400/20 shadow-2xl overflow-hidden"
            style={data.current ? { animation: "pulse-ring 2s infinite" } : {}}
          >
            {/* Decorative circles */}
            <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-blue-400/8 pointer-events-none" />
            <div className="absolute bottom-[-30px] left-[-30px] w-[150px] h-[150px] rounded-full bg-blue-500/6 pointer-events-none" />

            {data.current ? (
              <>
                <div className="relative z-10">
                  {data.current.queueNumber !== null && (
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#2563EB] rounded-2xl text-white font-extrabold text-xl mb-4 shadow-lg shadow-blue-500/40">
                      {data.current.queueNumber}
                    </div>
                  )}
                  <p className="text-white text-6xl md:text-7xl font-extrabold tracking-wide leading-tight">
                    {data.current.name}
                  </p>
                </div>
              </>
            ) : (
              <p className="relative z-10 text-blue-300/60 text-3xl font-semibold">
                لا يوجد مريض حالياً
              </p>
            )}
          </div>
        </div>

        {/* Waiting list */}
        {data.waiting.length > 0 && (
          <div className="w-full max-w-3xl">
            <p className="text-blue-300/70 text-sm font-semibold uppercase tracking-widest text-center mb-4">
              التالي في الانتظار
            </p>
            <div className="grid gap-3">
              {data.waiting.slice(0, 4).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/6 border border-white/10 rounded-2xl px-8 py-4 backdrop-blur-sm"
                  style={{ opacity: 1 - i * 0.15 }}
                >
                  <span className="text-white text-3xl font-bold">{p.name}</span>
                  {p.queueNumber !== null && (
                    <span className="text-3xl font-extrabold text-blue-300/70 tabular-nums">
                      #{p.queueNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-blue-400/30 text-xs tracking-widest">
        كلينيك — نظام إدارة العيادة
      </div>
    </div>
  );
}
