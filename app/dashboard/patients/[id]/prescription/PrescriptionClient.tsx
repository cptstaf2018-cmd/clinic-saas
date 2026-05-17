"use client";

import { useRef, useState } from "react";

type Props = {
  patientId: string;
  patientName: string;
  clinicName: string;
  specialty: string;
  phone: string;
  address: string | null;
  logoUrl: string | null;
};

export default function PrescriptionClient({ patientId, patientName, clinicName, specialty, phone, address, logoUrl }: Props) {
  const rxRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });

  async function saveToPatientFile() {
    const rx = rxRef.current?.value?.trim();
    if (!rx) return;
    setSaving(true);
    try {
      await fetch(`/api/patients/${patientId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "prescription",
          title: `وصفة طبية — ${dateStr}`,
          notes: rx,
          date: new Date().toISOString(),
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handlePrint() {
    await saveToPatientFile();
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0" dir="rtl">

      {/* أزرار التحكم */}
      <div className="mx-auto mb-4 flex max-w-2xl items-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          {saving ? "جاري الحفظ..." : "طباعة وحفظ"}
        </button>
        {saved && (
          <span className="text-sm font-black text-emerald-600">✓ محفوظة في ملف المريض</span>
        )}
        <button
          onClick={() => window.close()}
          className="mr-auto rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          إغلاق
        </button>
      </div>

      {/* ورقة الوصفة */}
      <div className="mx-auto max-w-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] print:max-w-none print:shadow-none" style={{ minHeight: "29.7cm" }}>

        {/* ═══ رأس الوصفة ═══ */}
        <div className="border-b-2 border-slate-800 px-8 py-5">
          <div className="flex items-center justify-between gap-4">

            {/* يمين — معلومات العيادة */}
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="شعار" className="h-16 w-16 rounded-full object-cover border-2 border-slate-300 shrink-0" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-700 flex items-center justify-center text-white text-2xl font-black border-2 border-blue-800 shrink-0">
                  {clinicName.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="text-lg font-black text-slate-900">{clinicName}</p>
                <p className="text-sm font-bold text-blue-700">اختصاص {specialty}</p>
                {address && <p className="text-xs font-bold text-slate-500 mt-0.5">{address}</p>}
                <p className="text-xs font-bold text-slate-500" dir="ltr">{phone}</p>
              </div>
            </div>

            {/* وسط — شعار وزارة الصحة */}
            <div className="flex flex-col items-center text-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/moh-iraq.webp" alt="وزارة الصحة العراقية" className="h-20 w-20 object-contain" />
              <p className="text-[10px] font-black text-slate-700 mt-1">جمهورية العراق</p>
              <p className="text-[10px] font-black text-red-700">وزارة الصحة</p>
            </div>

            {/* يسار — التاريخ والوقت */}
            <div className="text-left space-y-1 shrink-0">
              <div className="rounded-lg bg-slate-100 px-3 py-1.5">
                <p className="text-[10px] text-slate-500">التاريخ</p>
                <p className="text-sm font-black text-slate-900">{dateStr}</p>
              </div>
              <div className="rounded-lg bg-slate-100 px-3 py-1.5">
                <p className="text-[10px] text-slate-500">الوقت</p>
                <p className="text-sm font-black text-slate-900">{timeStr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ بيانات المريض ═══ */}
        <div className="px-8 py-5 border-b border-slate-300">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <label className="text-xs font-black text-slate-500 block mb-2">الاسم</label>
              <div className="border-b-2 border-slate-400 pb-1">
                <input
                  ref={nameRef}
                  type="text"
                  defaultValue={patientName}
                  className="w-full text-base font-black text-slate-900 outline-none bg-transparent"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 block mb-2">العمر</label>
              <div className="border-b-2 border-slate-400 pb-1">
                <input
                  ref={ageRef}
                  type="text"
                  className="w-full text-base font-black text-slate-900 outline-none bg-transparent text-center"
                  placeholder="سنة"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ منطقة Rx ═══ */}
        <div className="px-8 py-6" style={{ minHeight: "16cm" }}>
          <div className="flex items-start gap-4">
            <span className="text-5xl font-black text-slate-800 leading-none shrink-0" style={{ fontFamily: "serif" }}>℞</span>
            <div className="flex-1">
              <textarea
                ref={rxRef}
                className="w-full text-base font-bold text-slate-900 outline-none bg-transparent resize-none leading-10"
                placeholder="اكتب الأدوية والجرعات هنا..."
                rows={14}
                style={{
                  backgroundImage: "repeating-linear-gradient(transparent, transparent calc(2.5rem - 1px), #cbd5e1 calc(2.5rem - 1px), #cbd5e1 2.5rem)",
                  backgroundSize: "100% 2.5rem",
                  lineHeight: "2.5rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* ═══ التوقيع والختم ═══ */}
        <div className="border-t-2 border-slate-800 px-8 py-6">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-black text-slate-500 mb-10">توقيع الطبيب</p>
              <div className="border-b-2 border-slate-800" />
              <p className="mt-2 text-xs font-bold text-slate-500">الاسم والتوقيع</p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-500 mb-10">الختم الطبي</p>
              <div className="border-b-2 border-slate-800" />
              <p className="mt-2 text-xs font-bold text-slate-500">{dateStr} — {timeStr}</p>
            </div>
          </div>

          <div className="mt-6 text-center border-t border-slate-200 pt-3">
            <p className="text-[10px] font-bold text-slate-400">{clinicName} · {specialty} · {phone}</p>
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
          input, textarea { border: none !important; background: transparent !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
        }
      `}</style>
    </div>
  );
}
