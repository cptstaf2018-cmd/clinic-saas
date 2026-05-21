"use client";

import { useState } from "react";

type PatientInfo = {
  bloodType: string | null;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  surgicalHistory: string | null;
  smokingStatus: string | null;
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SMOKING_OPTIONS = [
  { value: "never",   label: "لا يدخن" },
  { value: "former",  label: "مدخن سابق" },
  { value: "current", label: "مدخن حالي" },
];

function TagInput({
  label, values, onChange, placeholder,
}: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-slate-400 hover:text-red-500 font-black leading-none">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <button onClick={add}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700">+</button>
      </div>
    </div>
  );
}

export default function PatientInfoCard({
  patientId,
  specialtyCode,
  initialInfo,
}: {
  patientId: string;
  specialtyCode?: string;
  initialInfo: PatientInfo;
}) {
  const [info, setInfo] = useState<PatientInfo>(initialInfo);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PatientInfo>(initialInfo);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      setInfo(draft);
      setEditing(false);
    }
    setSaving(false);
  }

  function startEdit() {
    setDraft({ ...info });
    setEditing(true);
  }

  const isPediatric = specialtyCode === "pediatrics";
  const hasData = info.bloodType || info.allergies.length > 0 || info.chronicConditions.length > 0
    || info.currentMedications.length > 0 || info.surgicalHistory || (!isPediatric && info.smokingStatus);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-black text-slate-950">🩺 الملف الطبي الدائم</h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5">معلومات ثابتة — فصيلة الدم، الحساسية، الأمراض المزمنة</p>
        </div>
        {!editing && (
          <button onClick={startEdit}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 transition">
            {hasData ? "تعديل" : "إضافة بيانات"}
          </button>
        )}
      </div>

      <div className="p-5">
        {!editing ? (
          !hasData ? (
            <div className="py-6 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-black text-slate-400">لم تُضف بيانات الملف الطبي الدائم بعد</p>
              <button onClick={startEdit}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700">
                إضافة الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {info.bloodType && (
                <InfoItem icon="🩸" label="فصيلة الدم" value={info.bloodType} color="text-red-600 bg-red-50" />
              )}
              {!isPediatric && info.smokingStatus && (
                <InfoItem icon="🚬" label="التدخين"
                  value={SMOKING_OPTIONS.find((s) => s.value === info.smokingStatus)?.label ?? info.smokingStatus}
                  color="text-amber-600 bg-amber-50" />
              )}
              {info.allergies.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">⚠️ الحساسية</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.allergies.map((a) => (
                      <span key={a} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.chronicConditions.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">🏥 الأمراض المزمنة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.chronicConditions.map((c) => (
                      <span key={c} className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-black text-purple-700 ring-1 ring-purple-200">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.currentMedications.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">💊 الأدوية الدائمة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.currentMedications.map((m) => (
                      <span key={m} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.surgicalHistory && (
                <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">🔪 العمليات الجراحية</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{info.surgicalHistory}</p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">🩸 فصيلة الدم</p>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_TYPES.map((bt) => (
                    <button key={bt} onClick={() => setDraft({ ...draft, bloodType: draft.bloodType === bt ? null : bt })}
                      className={`rounded-full px-3 py-1 text-xs font-black transition ${draft.bloodType === bt ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {bt}
                    </button>
                  ))}
                </div>
              </div>
              {!isPediatric && (
                <div>
                  <p className="mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">🚬 التدخين</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SMOKING_OPTIONS.map((s) => (
                      <button key={s.value} onClick={() => setDraft({ ...draft, smokingStatus: draft.smokingStatus === s.value ? null : s.value })}
                        className={`rounded-full px-3 py-1 text-xs font-black transition ${draft.smokingStatus === s.value ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <TagInput label="⚠️ الحساسية (أدوية / طعام / بيئة)"
              values={draft.allergies} onChange={(v) => setDraft({ ...draft, allergies: v })}
              placeholder="مثال: Penicillin، مكسرات..." />

            <TagInput label="🏥 الأمراض المزمنة"
              values={draft.chronicConditions} onChange={(v) => setDraft({ ...draft, chronicConditions: v })}
              placeholder="مثال: سكري، ضغط، ربو..." />

            <TagInput label="💊 الأدوية الدائمة"
              values={draft.currentMedications} onChange={(v) => setDraft({ ...draft, currentMedications: v })}
              placeholder="مثال: Metformin 500mg..." />

            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">🔪 العمليات الجراحية السابقة</p>
              <textarea value={draft.surgicalHistory ?? ""}
                onChange={(e) => setDraft({ ...draft, surgicalHistory: e.target.value })}
                placeholder="مثال: استئصال زائدة 2020، ركبة يسرى 2022..."
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? "جاري الحفظ..." : "حفظ الملف الطبي"}
              </button>
              <button onClick={() => setEditing(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-200 transition">
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function InfoItem({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-3 ${color.split(" ")[1]}`}>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">{icon} {label}</p>
      <p className={`text-sm font-black ${color.split(" ")[0]}`}>{value}</p>
    </div>
  );
}
