"use client";

import { useCallback, useEffect, useState } from "react";

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

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />;
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchHealth();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchHealth]);

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
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-[26px] bg-white shadow-sm ring-1 ring-slate-200" />
        ))}
      </div>
    );
  }

  if (!health) {
    return (
      <div className="rounded-[30px] border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
        <p className="text-lg font-black text-slate-400">تعذر تحميل حالة النظام</p>
        <button onClick={fetchHealth} className="mt-4 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const subOk = ["active", "trial"].includes(health.subscription.status);
  const hasIssues = health.issues.stuckSessions > 0 || health.issues.pendingOldAppointments > 0;

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl md:bottom-8 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <HealthCard title="قاعدة البيانات" value={health.db ? "تعمل" : "خطأ"} ok={health.db} detail={health.db ? "الاتصال مستقر" : "يوجد خلل في الاتصال"} />
        <HealthCard
          title="الاشتراك"
          value={STATUS_LABELS[health.subscription.status] ?? health.subscription.status}
          ok={subOk}
          detail={`${PLAN_LABELS[health.subscription.plan] ?? health.subscription.plan} · ${arabicNumber(health.subscription.daysLeft)} يوم متبقي`}
        />
        <HealthCard
          title="طابور اليوم"
          value={`${arabicNumber(health.queue.total)} موعد`}
          ok={!hasIssues}
          detail={`${arabicNumber(health.queue.waiting)} انتظار · ${arabicNumber(health.queue.done)} منتهي`}
        />
      </section>

      <section className="rounded-[30px] bg-white p-4 md:p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950">الإصلاح السريع</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">أدوات تشغيل آمنة للمشاكل اليومية المتكررة.</p>
          </div>
          <button onClick={fetchHealth} className="rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-200">
            تحديث
          </button>
        </div>

        <div className="grid gap-3">
          <FixCard
            title="مسح محادثات واتساب المعلقة"
            description={
              health.issues.stuckSessions > 0
                ? `يوجد ${arabicNumber(health.issues.stuckSessions)} محادثة معلقة منذ أكثر من 24 ساعة وقد تؤثر على الحجز.`
                : "لا توجد محادثات معلقة حالياً."
            }
            hasIssue={health.issues.stuckSessions > 0}
            action="clear-sessions"
            actionLabel="مسح"
            fixing={fixing}
            onFix={runFix}
          />
          <FixCard
            title="إغلاق المواعيد القديمة المعلقة"
            description={
              health.issues.pendingOldAppointments > 0
                ? `يوجد ${arabicNumber(health.issues.pendingOldAppointments)} موعد قديم يحتاج إغلاقاً لتحسين الإحصاءات.`
                : "كل المواعيد القديمة مرتبة."
            }
            hasIssue={health.issues.pendingOldAppointments > 0}
            action="fix-pending"
            actionLabel="إصلاح"
            fixing={fixing}
            onFix={runFix}
          />
          <FixCard
            title="إعادة تعيين الطابور الحالي"
            description="استخدمها فقط إذا توقف الطابور عن التقدم داخل العيادة."
            hasIssue={false}
            isWarning
            action="reset-queue"
            actionLabel="إعادة تعيين"
            fixing={fixing}
            onFix={runFix}
          />
        </div>
      </section>

      <section className="rounded-[26px] bg-blue-50 p-4 ring-1 ring-blue-100">
        <p className="text-sm font-bold leading-7 text-blue-800">
          عند استمرار المشكلة، تواصل مع الدعم من الزر العلوي وأرسل وصفاً قصيراً لما يحدث داخل اللوحة.
        </p>
      </section>
    </div>
  );
}

function HealthCard({ title, value, detail, ok }: { title: string; value: string; detail: string; ok: boolean }) {
  return (
    <div className="rounded-[26px] bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-500">{title}</p>
        <StatusDot ok={ok} />
      </div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-bold text-slate-400">{detail}</p>
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
  const tone = hasIssue
    ? "bg-amber-50 ring-amber-100"
    : isWarning
    ? "bg-slate-50 ring-slate-100"
    : "bg-emerald-50/60 ring-emerald-100";
  const dot = hasIssue ? "bg-amber-500" : isWarning ? "bg-slate-400" : "bg-emerald-500";
  const button = hasIssue ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className={`rounded-[24px] p-4 ring-1 ${tone}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">{title}</p>
            <p className="mt-1 text-xs font-semibold leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {(hasIssue || isWarning) && (
          <button
            onClick={() => onFix(action)}
            disabled={fixing === action}
            className={`rounded-2xl px-5 py-2.5 text-xs font-black text-white transition disabled:opacity-50 ${button}`}
          >
            {fixing === action ? "جاري..." : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
