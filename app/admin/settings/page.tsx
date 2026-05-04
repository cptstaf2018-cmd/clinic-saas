"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoMsg, setLogoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.logoUrl) {
          setLogoUrl(d.logoUrl);
          setLogoPreview(d.logoUrl);
        }
      });
  }, []);

  async function handleLogoSave(e: React.FormEvent) {
    e.preventDefault();
    setLogoLoading(true);
    setLogoMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "logo", logoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");
      setLogoPreview(logoUrl);
      setLogoMsg({ ok: true, text: "تم حفظ الشعار بنجاح" });
    } catch (err: any) {
      setLogoMsg({ ok: false, text: err.message });
    } finally {
      setLogoLoading(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassMsg({ ok: false, text: "كلمة المرور الجديدة غير متطابقة" });
      return;
    }
    setPassLoading(true);
    setPassMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password", currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التغيير");
      setPassMsg({ ok: true, text: "تم تغيير كلمة المرور بنجاح" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassMsg({ ok: false, text: err.message });
    } finally {
      setPassLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-[#0C1F3F]">الإعدادات</h1>

      {/* Logo */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <h2 className="text-lg font-bold text-[#0C1F3F] flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
          </span>
          شعار المنصة
        </h2>

        {logoPreview && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt="الشعار الحالي"
              className="h-14 w-14 object-contain rounded-lg border border-gray-200 bg-white"
              onError={() => setLogoPreview("")}
            />
            <p className="text-sm text-gray-500">الشعار الحالي</p>
          </div>
        )}

        <form onSubmit={handleLogoSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              رابط الشعار (URL)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              dir="ltr"
            />
            <p className="text-xs text-gray-400 mt-1">
              أدخل رابطاً مباشراً لصورة الشعار (PNG, JPG, SVG)
            </p>
          </div>

          {logoMsg && (
            <p className={`text-sm font-medium ${logoMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {logoMsg.ok ? "✓ " : "✗ "}{logoMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={logoLoading}
            className="bg-[#0C1F3F] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a3060] transition disabled:opacity-50"
          >
            {logoLoading ? "جاري الحفظ..." : "حفظ الشعار"}
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <h2 className="text-lg font-bold text-[#0C1F3F] flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          تغيير كلمة المرور
        </h2>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              كلمة المرور الحالية
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              dir="ltr"
            />
          </div>

          {passMsg && (
            <p className={`text-sm font-medium ${passMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {passMsg.ok ? "✓ " : "✗ "}{passMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={passLoading}
            className="bg-[#0C1F3F] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a3060] transition disabled:opacity-50"
          >
            {passLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
          </button>
        </form>
      </section>
    </div>
  );
}
