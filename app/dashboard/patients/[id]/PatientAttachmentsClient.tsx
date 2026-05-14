"use client";

import { useState, useRef } from "react";

type Attachment = {
  id: string;
  type: string;
  title: string;
  notes: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  date: string;
};

const TABS = [
  { id: "lab",          label: "🧪 التحاليل",  empty: "لا توجد تحاليل مضافة" },
  { id: "xray",         label: "🩻 الأشعة",    empty: "لا توجد أشعة مضافة" },
  { id: "prescription", label: "💊 الوصفات",   empty: "لا توجد وصفات مضافة" },
  { id: "other",        label: "📎 أخرى",      empty: "لا توجد مستندات أخرى" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-IQ", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function PatientAttachmentsClient({ patientId }: { patientId: string }) {
  const [activeTab, setActiveTab] = useState("lab");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadTab(tabId: string) {
    if (loaded[tabId]) return;
    const res = await fetch(`/api/patients/${patientId}/attachments?type=${tabId}`);
    if (res.ok) {
      const data = await res.json();
      setAttachments((prev) => [...prev.filter((a) => a.type !== tabId), ...data]);
      setLoaded((prev) => ({ ...prev, [tabId]: true }));
    }
  }

  async function switchTab(tabId: string) {
    setActiveTab(tabId);
    setShowForm(false);
    await loadTab(tabId);
  }

  // load first tab on mount
  useState(() => { loadTab("lab"); });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      setPendingFile({ url: data.url, name: data.fileName, type: data.fileType });
    } else {
      const d = await res.json();
      setError(d.error ?? "فشل رفع الملف");
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!title.trim()) { setError("العنوان مطلوب"); return; }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/patients/${patientId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeTab,
        title: title.trim(),
        notes: notes.trim() || null,
        date,
        fileUrl: pendingFile?.url ?? null,
        fileName: pendingFile?.name ?? null,
        fileType: pendingFile?.type ?? null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setAttachments((prev) => [created, ...prev]);
      setTitle(""); setNotes(""); setPendingFile(null);
      setDate(new Date().toISOString().slice(0, 10));
      setShowForm(false);
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/patients/${patientId}/attachments/${id}`, { method: "DELETE" });
    if (res.ok) setAttachments((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  }

  const tabAttachments = attachments.filter((a) => a.type === activeTab);
  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">مميزة VIP</span>
            <h2 className="text-2xl font-black text-slate-950">الملف الطبي الكامل</h2>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-400">تحاليل، أشعة، وصفات، ومستندات المريض</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-700"
          >
            + إضافة
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
              activeTab === tab.id
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-4 space-y-3 rounded-[24px] bg-violet-50/50 p-4 ring-1 ring-violet-100">
          <p className="text-sm font-black text-violet-700">إضافة {currentTab.label}</p>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p>}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="العنوان — مثال: تحليل دم كامل"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="الملاحظات والنتائج (اختياري)"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold text-slate-500">التاريخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                dir="ltr"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">
              رفع ملف <span className="font-normal text-slate-400">(PDF أو صورة — اختياري)</span>
            </label>
            {pendingFile ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
                <span className="text-xs font-bold text-emerald-700">✓ {pendingFile.name}</span>
                <button onClick={() => { setPendingFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-xs font-black text-red-500 hover:text-red-700">حذف</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-400 transition hover:border-violet-300 hover:text-violet-600 disabled:opacity-50"
              >
                {uploading ? "جاري الرفع..." : "📎 اضغط لرفع ملف"}
              </button>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-black text-white hover:bg-violet-700 disabled:opacity-50">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button onClick={() => { setShowForm(false); setError(""); setPendingFile(null); }} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-200">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {!loaded[activeTab] ? (
        <div className="py-8 text-center text-sm font-bold text-slate-300">جاري التحميل...</div>
      ) : tabAttachments.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <p className="text-lg font-black text-slate-400">{currentTab.empty}</p>
          <p className="mt-1 text-xs font-bold text-slate-300">اضغط "+ إضافة" لإضافة أول سجل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabAttachments.map((a) => (
            <div key={a.id} className="rounded-[22px] bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{a.title}</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-400">{formatDate(a.date)}</p>
                  {a.notes && <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{a.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-red-600 ring-1 ring-red-100 hover:bg-red-50 disabled:opacity-40"
                >
                  حذف
                </button>
              </div>

              {/* File preview */}
              {a.fileUrl && (
                <div className="mt-3">
                  {a.fileType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.fileUrl}
                      alt={a.title}
                      onClick={() => setLightbox({ url: a.fileUrl!, title: a.title })}
                      className="max-h-64 w-full rounded-xl object-contain bg-slate-100 cursor-zoom-in transition hover:opacity-90"
                      title="اضغط لعرض بحجم كامل"
                    />
                  ) : (
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-black text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100"
                    >
                      📄 فتح الملف — {a.fileName}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-full max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-white">{lightbox.title}</p>
              <button
                onClick={() => setLightbox(null)}
                className="rounded-xl bg-white/20 px-3 py-1.5 text-sm font-black text-white hover:bg-white/30"
              >
                ✕ إغلاق
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.title}
              className="max-h-[80vh] w-full rounded-2xl object-contain bg-slate-900"
            />
            <a
              href={lightbox.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-sm font-black text-white hover:bg-white/20"
            >
              🔗 فتح في تبويب جديد
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
