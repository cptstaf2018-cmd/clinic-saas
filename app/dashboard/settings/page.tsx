"use client";

import { useEffect, useRef, useState } from "react";

interface Settings {
  id: string;
  name: string;
  whatsappNumber: string;
  logoUrl: string;
  address: string | null;
  locationUrl: string | null;
  botEnabled: boolean;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappWelcomeMessage: string;
  botOutOfScopeMessage: string | null;
  botMedicalDisclaimer: string | null;
  botHandoffMessage: string | null;
  botShowWorkingHours: boolean;
  botShowLocation: boolean;
  clinicId: string;
}

type Tab = "profile" | "whatsapp" | "reminders" | "security";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile",   label: "ملف العيادة",     icon: "ع" },
  { id: "whatsapp",  label: "واتساب بزنس",     icon: "و" },
  { id: "reminders", label: "التذكيرات",        icon: "ت" },
  { id: "security",  label: "الأمان",           icon: "أ" },
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-[30px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70 md:p-6">
      <div className="mb-5">
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
        {description && <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-black text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  // Logo
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  // Clear all data
  const [showClearAll, setShowClearAll] = useState(false);
  const [clearConfirm, setClearConfirm] = useState("");
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState("");
  const [origin, setOrigin] = useState("");
  const displayUrl = settings && origin ? `${origin}/display/${settings.id}` : "";

  useEffect(() => {
    fetch("/api/clinic/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        setLogoPreview(d.logoUrl || "");
        setOrigin(window.location.origin);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveSettings(patch: Partial<Settings>) {
    setSaving(true); setError(""); setSaved("");
    const res = await fetch("/api/clinic/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setSettings((prev) => prev ? { ...prev, ...patch } : prev);
      setSaved("تم الحفظ بنجاح");
      setTimeout(() => setSaved(""), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setSaving(false);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);
    const form = new FormData();
    form.append("logo", file);
    const res = await fetch("/api/clinic/logo", { method: "POST", body: form });
    if (res.ok) {
      const { url } = await res.json();
      setSettings((prev) => prev ? { ...prev, logoUrl: url } : prev);
      setLogoPreview(url);
      setSaved("تم رفع الشعار بنجاح");
      setTimeout(() => setSaved(""), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? "فشل رفع الشعار");
    }
    setUploadingLogo(false);
  }

  async function clearAllData() {
    setClearing(true);
    const res = await fetch("/api/clinic/clear-data", { method: "DELETE" });
    if (res.ok) {
      const d = await res.json();
      setClearResult(`تم المسح: ${d.deleted.patients} مريض، ${d.deleted.appointments} موعد`);
      setShowClearAll(false);
      setClearConfirm("");
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setClearing(false);
  }

  async function changePassword() {
    setPwError(""); setPwSaved(false);
    if (newPw !== confirmPw) { setPwError("كلمتا المرور غير متطابقتين"); return; }
    if (newPw.length < 6) { setPwError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    const res = await fetch("/api/clinic/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    if (res.ok) {
      setPwSaved(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      const d = await res.json();
      setPwError(d.error ?? "حدث خطأ");
    }
  }

  if (loading) return <div className="p-8 text-center text-sm font-bold text-slate-400">جاري التحميل...</div>;
  if (!settings) return <div className="p-8 text-center text-sm font-bold text-red-500">خطأ في تحميل الإعدادات</div>;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-7">
      <section className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
        <p className="text-sm font-black text-sky-700">إدارة النظام</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">الإعدادات</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          تحكم بملف العيادة، واتساب، التذكيرات، والأمان من واجهة واحدة مرتبة.
        </p>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-[26px] bg-white p-2 shadow-[0_14px_38px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSaved(""); setError(""); }}
            className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black whitespace-nowrap transition-all ${
              tab === t.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs ${tab === t.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Status messages */}
      {saved && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{saved}</div>}
      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{error}</div>}

      {/* ── PROFILE TAB ── */}
      {tab === "profile" && (
        <>
          <Section title="شعار العيادة" description="يظهر في واجهة النظام ورسائل الواتساب">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-black text-slate-400">ع</span>
                )}
              </div>
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {uploadingLogo ? "جاري الرفع..." : "رفع شعار"}
                </button>
                <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, SVG — حد أقصى 512KB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>
          </Section>

          <Section title="معلومات العيادة">
            <Field label="اسم العيادة">
              <input
                className={inputCls}
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </Field>
            <Field label="رقم واتساب العيادة">
              <div className="flex items-center gap-2">
                <input
                  className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}
                  value={settings.whatsappNumber}
                  readOnly
                  dir="ltr"
                />
                <span className="text-xs text-gray-400 whitespace-nowrap">للتغيير تواصل مع الدعم</span>
              </div>
            </Field>
            <button
              onClick={() => saveSettings({ name: settings.name })}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? "جاري الحفظ..." : "حفظ المعلومات"}
            </button>
          </Section>

          <Section title="موقع العيادة" description="يستخدمه البوت فقط عند تفعيل خيار عرض الموقع للمرضى">
            <Field label="عنوان العيادة">
              <input
                className={inputCls}
                value={settings.address ?? ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="مثال: بغداد، الكرادة، قرب..."
              />
            </Field>
            <Field label="رابط خرائط Google">
              <input
                className={inputCls}
                value={settings.locationUrl ?? ""}
                onChange={(e) => setSettings({ ...settings, locationUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                dir="ltr"
              />
            </Field>
            <button
              onClick={() => saveSettings({ address: settings.address, locationUrl: settings.locationUrl })}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? "جاري الحفظ..." : "حفظ موقع العيادة"}
            </button>
          </Section>

          <Section title="شاشة الانتظار" description="افتح هذا الرابط على تلفزيون غرفة الانتظار">
            <div className="bg-gray-900 rounded-xl p-3">
              <code className="text-xs text-blue-400 break-all font-mono block mb-2">
                {displayUrl}
              </code>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.open(displayUrl, "_blank", "noopener,noreferrer")}
                  className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  فتح الشاشة
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(displayUrl)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  نسخ الرابط
                </button>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* ── WHATSAPP TAB ── */}
      {tab === "whatsapp" && (
        <>
          <Section title="حالة البوت">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">الرد التلقائي على المرضى</p>
                <p className={`text-xs mt-0.5 ${settings.botEnabled ? "text-green-600" : "text-red-500"}`}>
                  {settings.botEnabled ? "البوت مفعّل" : "البوت معطّل"}
                </p>
              </div>
              <button
                onClick={() => saveSettings({ botEnabled: !settings.botEnabled })}
                disabled={saving}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  settings.botEnabled
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {settings.botEnabled ? "تعطيل" : "تفعيل"}
              </button>
            </div>
          </Section>

          <Section title="رسالة الترحيب" description="تُرسل لكل مريض جديد يتواصل مع البوت">
            <Field label="نص الرسالة">
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={settings.whatsappWelcomeMessage ?? ""}
                onChange={(e) => setSettings({ ...settings, whatsappWelcomeMessage: e.target.value })}
                placeholder="مرحباً بك في عيادتنا. اختر الخدمة المطلوبة من القائمة."
              />
            </Field>
            <button
              onClick={() => saveSettings({ whatsappWelcomeMessage: settings.whatsappWelcomeMessage })}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? "جاري الحفظ..." : "حفظ رسالة الترحيب"}
            </button>
          </Section>

          <Section title="حدود البوت وردوده" description="اضبط ما يقوله البوت عند طلب الموقع، الدوام، الأسئلة الطبية، أو المواضيع غير المتعلقة بالعيادة">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span>
                  <span className="block text-sm font-black text-slate-800">إظهار أوقات الدوام</span>
                  <span className="block text-xs font-semibold text-slate-400">يضيف خيار الدوام في قائمة البوت</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.botShowWorkingHours}
                  onChange={(e) => setSettings({ ...settings, botShowWorkingHours: e.target.checked })}
                  className="h-5 w-5 accent-blue-600"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span>
                  <span className="block text-sm font-black text-slate-800">إظهار موقع العيادة</span>
                  <span className="block text-xs font-semibold text-slate-400">لا يظهر للمرضى إلا إذا أضفت العنوان أو الرابط</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.botShowLocation}
                  onChange={(e) => setSettings({ ...settings, botShowLocation: e.target.checked })}
                  className="h-5 w-5 accent-blue-600"
                />
              </label>
            </div>
            <Field label="رد المواضيع خارج نطاق العيادة">
              <textarea
                className={`${inputCls} min-h-24 resize-none leading-7`}
                value={settings.botOutOfScopeMessage ?? ""}
                onChange={(e) => setSettings({ ...settings, botOutOfScopeMessage: e.target.value })}
                placeholder="أنا مساعد العيادة، أستطيع مساعدتك في الحجز، المواعيد، الدوام، والتواصل مع الموظف فقط."
              />
            </Field>
            <Field label="رد الأسئلة الطبية">
              <textarea
                className={`${inputCls} min-h-24 resize-none leading-7`}
                value={settings.botMedicalDisclaimer ?? ""}
                onChange={(e) => setSettings({ ...settings, botMedicalDisclaimer: e.target.value })}
                placeholder="لا أستطيع تقديم تشخيص أو وصف علاج عبر الرسائل. للحالات الطبية احجز موعداً أو تواصل مع موظف العيادة."
              />
            </Field>
            <Field label="رسالة التحويل إلى الموظف">
              <textarea
                className={`${inputCls} min-h-24 resize-none leading-7`}
                value={settings.botHandoffMessage ?? ""}
                onChange={(e) => setSettings({ ...settings, botHandoffMessage: e.target.value })}
                placeholder="تم تحويل طلبك إلى موظف العيادة. سنرد عليك قريباً عبر واتساب."
              />
            </Field>
            <button
              onClick={() => saveSettings({
                botOutOfScopeMessage: settings.botOutOfScopeMessage,
                botMedicalDisclaimer: settings.botMedicalDisclaimer,
                botHandoffMessage: settings.botHandoffMessage,
                botShowWorkingHours: settings.botShowWorkingHours,
                botShowLocation: settings.botShowLocation,
              })}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? "جاري الحفظ..." : "حفظ حدود البوت"}
            </button>
          </Section>

          <Section title="إعدادات WasenderAPI" description="اربط رقم الواتساب الخاص بعيادتك عبر WasenderAPI">
            <div className="space-y-2 mb-4">
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">رابط الـ Webhook — أدخله في لوحة WasenderAPI:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-green-400 flex-1 break-all font-mono">
                    {`https://clinicplt.vercel.app/api/whatsapp/${settings.id}`}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`https://clinicplt.vercel.app/api/whatsapp/${settings.id}`)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-lg shrink-0 transition-colors"
                  >
                    نسخ
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-700">
              للحصول على API Key: سجّل في{" "}
              <a href="https://wasenderapi.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                wasenderapi.com
              </a>{" "}
              ثم أنشئ Session واربط رقمك بالـ QR Code وانسخ الـ API Key
            </div>
            <Field label="WasenderAPI Key">
              <input
                className={inputCls}
                type="password"
                value={settings.whatsappAccessToken}
                onChange={(e) => setSettings({ ...settings, whatsappAccessToken: e.target.value })}
                placeholder="أدخل API Key من WasenderAPI..."
                dir="ltr"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-400 mt-1">يُحفظ بأمان ولا يُعرض مجدداً</p>
            </Field>
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs mb-3 ${
              settings.whatsappAccessToken && settings.whatsappAccessToken !== "••••••••"
                ? "bg-green-50 border border-green-200 text-green-700"
                : settings.whatsappAccessToken === "••••••••"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-gray-50 border border-gray-200 text-gray-500"
            }`}>
              <span className={`h-2.5 w-2.5 rounded-full ${settings.whatsappAccessToken ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span>{settings.whatsappAccessToken ? "API Key محفوظ — البوت جاهز للإرسال" : "لم يتم إدخال API Key بعد"}</span>
            </div>
            <button
              onClick={() => saveSettings({ whatsappAccessToken: settings.whatsappAccessToken })}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? "جاري الحفظ..." : "حفظ API Key"}
            </button>
          </Section>
        </>
      )}

      {/* ── REMINDERS TAB ── */}
      {tab === "reminders" && (
        <>
          <Section title="التذكيرات التلقائية" description="تعمل تلقائياً للباقة المتوسطة والمميزة">
            <div className="space-y-3">
              {[
                { label: "تذكير قبل 24 ساعة", desc: "يُرسل تلقائياً في اليوم السابق للموعد", active: true },
                { label: "تذكير قبل ساعة",    desc: "يُرسل تلقائياً قبل ساعة من الموعد",    active: true },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.desc}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">نشط</span>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ── SECURITY TAB ── */}
      {tab === "security" && (
        <>
        <Section title="تغيير كلمة المرور">
          <Field label="كلمة المرور الحالية">
            <input className={inputCls} type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </Field>
          <Field label="كلمة المرور الجديدة">
            <input className={inputCls} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="6 أحرف على الأقل" />
          </Field>
          <Field label="تأكيد كلمة المرور الجديدة">
            <input className={inputCls} type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </Field>
          {pwError && <p className="text-red-500 text-sm mb-3">{pwError}</p>}
          {pwSaved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-3">تم تغيير كلمة المرور بنجاح</div>}
          <button
            onClick={changePassword}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            تغيير كلمة المرور
          </button>
        </Section>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <h3 className="font-bold text-red-700 text-base mb-1">المنطقة الخطرة</h3>
          <p className="text-xs text-red-500 mb-4">الإجراءات التالية لا يمكن التراجع عنها</p>

          {clearResult && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
              {clearResult}
            </div>
          )}

          <div className="flex items-center justify-between bg-white rounded-xl border border-red-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">مسح جميع البيانات</p>
              <p className="text-xs text-gray-400 mt-0.5">حذف كل المرضى والمواعيد — الحساب والإعدادات تبقى</p>
            </div>
            <button
              onClick={() => { setShowClearAll(true); setClearConfirm(""); }}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0 mr-3"
            >
              مسح الكل
            </button>
          </div>
        </div>

        {/* Clear All Modal */}
        {showClearAll && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" dir="rtl">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} className="w-7 h-7">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h2 className="text-lg font-extrabold text-gray-900">مسح جميع البيانات؟</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  سيتم حذف <strong className="text-red-600">كل المرضى والمواعيد</strong> نهائياً.<br/>
                  الحساب والإعدادات وأوقات العمل تبقى.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  اكتب <span className="text-red-600 font-bold">مسح الكل</span> للتأكيد
                </label>
                <input
                  value={clearConfirm}
                  onChange={(e) => setClearConfirm(e.target.value)}
                  placeholder="مسح الكل"
                  className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={clearAllData}
                  disabled={clearConfirm !== "مسح الكل" || clearing}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {clearing ? "جاري المسح..." : "نعم، امسح الكل"}
                </button>
                <button
                  onClick={() => setShowClearAll(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      )}
      </div>
    </div>
  );
}
