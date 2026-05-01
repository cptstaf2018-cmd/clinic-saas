"use client";

import { useEffect, useState } from "react";

export default function BotSettingsPage() {
  const [botEnabled, setBotEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const res = await fetch("/api/clinic/bot-settings");
      if (res.ok) {
        const data = await res.json();
        setBotEnabled(data.botEnabled);
      }
      setLoading(false);
    }
    loadStatus();
  }, []);

  async function toggleBot() {
    setSaving(true);
    try {
      const res = await fetch("/api/clinic/bot-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botEnabled: !botEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setBotEnabled(data.botEnabled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إعدادات بوت WhatsApp</h1>
        <p className="text-gray-600 text-sm mb-6">
          فعّل أو عطّل البوت للرد التلقائي على المرضى
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            📱 <strong>رقم WhatsApp:</strong> سيتم ربط هذا الرقم مع البوت<br/>
            💬 <strong>الرد التلقائي:</strong> حجز مواعيد، تذكيرات، معلومات العيادة<br/>
            🔒 <strong>الخصوصية:</strong> يتم حفظ جميع المحادثات بشكل آمن
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="font-semibold text-gray-900">
              حالة البوت
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {botEnabled ? (
                <span className="text-green-600 font-medium">✅ البوت مفعّل</span>
              ) : (
                <span className="text-red-600 font-medium">❌ البوت معطّل</span>
              )}
            </p>
          </div>
          <button
            onClick={toggleBot}
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              botEnabled
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            } disabled:opacity-50`}
          >
            {saving ? "جاري التحديث..." : botEnabled ? "تعطيل البوت" : "تفعيل البوت"}
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-900">
            <strong>⚠️ ملاحظة مهمة:</strong><br/>
            عند تعطيل البوت، المرضى لن يتمكنوا من حجز مواعيد عبر WhatsApp.<br/>
            تأكد من توفير طريقة بديلة للحجز أو أخبر المرضى مسبقاً.
          </p>
        </div>
      </div>
    </div>
  );
}
