"use client";

import { useEffect, useState } from "react";

interface DisplayData {
  current: { name: string; queueNumber: number | null } | null;
  waiting: { name: string; queueNumber: number | null }[];
}

export default function DisplayPage({
  params,
}: {
  params: Promise<{ clinicId: string }>;
}) {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [data, setData] = useState<DisplayData>({ current: null, waiting: [] });

  useEffect(() => {
    params.then((p) => setClinicId(p.clinicId));
  }, [params]);

  useEffect(() => {
    if (!clinicId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/display/${clinicId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silent fail — display stays as-is
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [clinicId]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8 gap-12"
    >
      {/* Current patient */}
      <div className="w-full max-w-3xl bg-green-900 rounded-3xl p-10 text-center shadow-2xl">
        <p className="text-3xl font-bold text-green-300 mb-4">يُرجى الدخول</p>
        {data.current ? (
          <p className="text-7xl font-extrabold tracking-wide">
            {data.current.name}
          </p>
        ) : (
          <p className="text-4xl text-gray-400">لا يوجد مريض حالياً</p>
        )}
      </div>

      {/* Next patients */}
      {data.waiting.length > 0 && (
        <div className="w-full max-w-3xl bg-gray-800 rounded-3xl p-8 shadow-xl">
          <p className="text-2xl font-bold text-yellow-400 mb-6 text-center">
            التالي
          </p>
          <ul className="flex flex-col gap-4">
            {data.waiting.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between bg-gray-700 rounded-2xl px-8 py-4"
              >
                <span className="text-3xl font-bold">{p.name}</span>
                {p.queueNumber != null && (
                  <span className="text-2xl text-gray-400">
                    رقم {p.queueNumber}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
