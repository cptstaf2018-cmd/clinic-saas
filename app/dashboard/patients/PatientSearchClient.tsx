"use client";

import { useState } from "react";
import Link from "next/link";

type Patient = {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PatientSearchClient({
  patients,
}: {
  patients: Patient[];
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? patients.filter(
        (p) =>
          p.name.includes(query) || p.phone.includes(query)
      )
    : patients;

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-right"
          dir="rtl"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {query ? "لا توجد نتائج مطابقة" : "لا يوجد مرضى بعد"}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm" dir="rtl">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                  الاسم
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">
                  الهاتف
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">
                  آخر زيارة
                </th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                  الزيارات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/patients/${p.id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-gray-400 sm:hidden">{p.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                    {p.phone}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {formatDate(p.lastVisit)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {p.totalVisits}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
