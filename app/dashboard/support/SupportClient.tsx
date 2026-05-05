"use client";

import { useEffect, useState, useCallback } from "react";

type HealthData = {
  db: boolean;
  subscription: { status: string; plan: string; daysLeft: number };
  queue: { total: number; waiting: number; current: number; done: number };
  issues: { stuckSessions: number; pendingOldAppointments: number };
};

const PLAN_LABELS: Record<string, string> = {
  trial: "تجريبي",
  basic: "أساسية",
  standard: "متوسطة",
  premium: "مميزة",
};
const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  trial: "تجريبي",
  inactive: "منتهي",
};

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
        ok ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
}

export default function SupportClient() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/support/health");
    if (res.ok) setHealth(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  async function runFix(action: string) {
    setFixing(action);
    const res = await fetch("/api/support/fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setToast({ msg: data.message ?? data.error ?? "تم", ok: res.ok });
    setFixing(null);
    fetchHealth();
    setTimeout(() => setToast(null), 4000);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-white rounded-2xl border border-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!health) {
    return (
      <div className="text-center py-12 text-gray-400">
        تعذر تحميل حالة النظام
        <br />
        <button
          onClick={fetchHealth}
          className="mt-3 text-blue-600 text-sm underline"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const subOk = ["active", "trial"].includes(health.subscription.status);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">حالة النظام</h2>
          <button
            onClick={fetchHealth}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            تحديث
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">قاعدة البيانات</span>
            <div className="flex items-center gap-2">
              <StatusDot ok={health.db} />
              <span className={`text-xs font-semibold ${health.db ? "text-green-600" : "text-red-600"}`}>
                {health.db ? "تعمل بشكل طبيعي" : "خطأ في الاتصال"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">الاشتراك</span>
            <div className="flex items-center gap-2">
              <StatusDot ok={subOk} />
              <span className={`text-xs font-semibold ${subOk ? "text-green-600" : "text-red-600"}`}>
                {STATUS_LABELS[health.subscription.status] ?? health.subscription.status}{" "}
                · {PLAN_LABELS[health.subscription.plan] ?? health.subscription.plan}
                {subOk && ` · ${health.subscription.daysLeft} يوم متبقي`}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-gray-600">طابور اليوم</span>
            <span className="text-xs font-semibold text-gray-700">
              {health.queue.total} موعد ·{" "}
              <span className="text-orange-500">{health.queue.waiting} انتظار</span>{" "}
              · <span className="text-green-600">{health.queue.done} منتهي</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Fixes */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">إصلاح سريع</h2>
        <div className="space-y-3">
          <FixCard
            title="مسح محادثات الواتساب المعلقة"
            description={
              health.issues.stuckSessions > 0
                ? `يوجد ${health.issues.stuckSessions} محادثة معلقة منذ أكثر من 24 ساعة — قد تمنع بعض المرضى من الحجز`
                : "لا توجد محادثات معلقة — كل شيء يعمل"
            }
            hasIssue={health.issues.stuckSessions > 0}
            action="clear-sessions"
            actionLabel="مسح المحادثات"
            fixing={fixing}
            onFix={runFix}
          />
          <FixCard
            title="إكمال المواعيد القديمة المعلقة"
            description={
              health.issues.pendingOldAppointments > 0
                ? `يوجد ${health.issues.pendingOldAppointments} موعد قديم لم يُغلق — قد يؤثر على الإحصاءات`
                : "جميع المواعيد القديمة مغلقة بشكل صحيح"
            }
            hasIssue={health.issues.pendingOldAppointments > 0}
            action="fix-pending"
            actionLabel="إكمال المواعيد"
            fixing={fixing}
            onFix={runFix}
          />
          <FixCard
            title="إعادة تعيين الطابور الحالي"
            description="إذا علق النظام ولم يتحرك الطابور، اضغط هنا لإعادة تعيينه"
            hasIssue={false}
            isWarning
            action="reset-queue"
            actionLabel="إعادة تعيين"
            fixing={fixing}
            onFix={runFix}
          />
        </div>
      </div>

      {/* Help note */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>ملاحظة:</strong> إذا استمرت المشكلة بعد الإصلاح، تواصل مع
          الدعم وأخبرهم بالمشكلة تحديداً — لا حاجة لإعادة تشغيل أي شيء.
        </p>
      </div>
    </div>
  );
}

function FixCard({
  title,
  description,
  hasIssue,
  isWarning,
  action,
  actionLabel,
  fixing,
  onFix,
}: {
  title: string;
  description: string;
  hasIssue: boolean;
  isWarning?: boolean;
  action: string;
  actionLabel: string;
  fixing: string | null;
  onFix: (action: string) => void;
}) {
  const containerCls = hasIssue
    ? "border-orange-200 bg-orange-50/40"
    : isWarning
    ? "border-gray-200 bg-gray-50"
    : "border-green-100 bg-green-50/30";

  const dotCls = hasIssue ? "bg-orange-400" : isWarning ? "bg-gray-400" : "bg-green-500";
  const btnCls = hasIssue ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-600 hover:bg-gray-700";

  return (
    <div className={`border rounded-xl p-4 ${containerCls}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
        {(hasIssue || isWarning) && (
          <button
            onClick={() => onFix(action)}
            disabled={fixing === action}
            className={`shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${btnCls}`}
          >
            {fixing === action ? "جاري..." : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
