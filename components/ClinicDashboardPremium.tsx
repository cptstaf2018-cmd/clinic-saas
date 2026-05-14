"use client";

import { StatCard, ActionButton, SectionHeader } from "@/components/shared-ui";
import { LABELS } from "@/lib/design-system";
import Link from "next/link";
import React from "react";

interface DashboardStats {
  appointmentsToday: number;
  waitingCount: number;
  completedCount: number;
  specialty: string;
}

const SPECIALTY_CONFIG: Record<
  string,
  {
    headline: string;
    description: string;
    focusMetrics: { label: string; value: number; hint: string }[];
    actions: { label: string; href: string; variant: "primary" | "secondary" | "success" }[];
  }
> = {
  dentistry: {
    headline: LABELS.clinicDentistry,
    description: "متابعة الحجوزات، خطط العلاج، والأشعة من لوحة هادئة ومباشرة.",
    focusMetrics: [
      { label: LABELS.appointmentsToday, value: 0, hint: "كل مواعيد الأسنان" },
      { label: LABELS.waitingList, value: 0, hint: "جاهزون للدخول" },
      { label: LABELS.completedVisits, value: 0, hint: "تم إغلاقها اليوم" },
    ],
    actions: [
      { label: LABELS.openPatientFiles, href: "/dashboard/patients", variant: "primary" },
      { label: `${LABELS.treatmentReport} أسنان`, href: "/dashboard/reports", variant: "secondary" },
      { label: LABELS.waitingScreen, href: "#display", variant: "success" },
    ],
  },
  pediatrics: {
    headline: LABELS.clinicPediatrics,
    description: "متابعة مراجعات الأطفال، النمو، الحرارة، والتطعيمات من مكان واحد.",
    focusMetrics: [
      { label: "حجوزات الأطفال", value: 0, hint: "كل مواعيد اليوم" },
      { label: "ينتظرون الدور", value: 0, hint: "داخل الانتظار" },
      { label: "زيارات مكتملة", value: 0, hint: "أغلقت اليوم" },
    ],
    actions: [
      { label: "ملفات الأطفال", href: "/dashboard/patients", variant: "primary" },
      { label: "تقارير نمو وتطعيم", href: "/dashboard/reports", variant: "secondary" },
      { label: LABELS.waitingScreen, href: "#display", variant: "success" },
    ],
  },
  dermatology: {
    headline: LABELS.clinicDermatology,
    description: "تنظيم الجلسات، صور المتابعة، وتقارير تطور الحالة.",
    focusMetrics: [
      { label: "مواعيد اليوم", value: 0, hint: "جلسات ومراجعات" },
      { label: "بانتظار الدخول", value: 0, hint: "في العيادة" },
      { label: "جلسات منتهية", value: 0, hint: "تمت اليوم" },
    ],
    actions: [
      { label: "ملفات الحالات", href: "/dashboard/patients", variant: "primary" },
      { label: "تقارير قبل/بعد", href: "/dashboard/reports", variant: "secondary" },
      { label: LABELS.waitingScreen, href: "#display", variant: "success" },
    ],
  },
  cardiology: {
    headline: LABELS.clinicCardiology,
    description: "مراقبة مواعيد القلب، الضغط، ECG، والتقارير الطبية الحساسة.",
    focusMetrics: [
      { label: "مواعيد القلب", value: 0, hint: "مراجعات اليوم" },
      { label: "في الانتظار", value: 0, hint: "بانتظار الفحص" },
      { label: "فحوص منتهية", value: 0, hint: "أغلقت اليوم" },
    ],
    actions: [
      { label: "ملفات المرضى", href: "/dashboard/patients", variant: "primary" },
      { label: "تقارير ECG وضغط", href: "/dashboard/reports", variant: "secondary" },
      { label: LABELS.waitingScreen, href: "#display", variant: "success" },
    ],
  },
  gynecology: {
    headline: LABELS.clinicGynecology,
    description: "تنظيم مراجعات الحمل، السونار، والمتابعة النسائية اليومية.",
    focusMetrics: [
      { label: "مواعيد اليوم", value: 0, hint: "متابعات وفحوص" },
      { label: "في الانتظار", value: 0, hint: "بانتظار الدخول" },
      { label: "زيارات مكتملة", value: 0, hint: "أغلقت اليوم" },
    ],
    actions: [
      { label: "ملفات المراجعات", href: "/dashboard/patients", variant: "primary" },
      { label: "تقارير المتابعة", href: "/dashboard/reports", variant: "secondary" },
      { label: LABELS.waitingScreen, href: "#display", variant: "success" },
    ],
  },
};

export default function ClinicDashboardPremium({
  specialty = "dentistry",
  stats = { appointmentsToday: 0, waitingCount: 0, completedCount: 0, specialty: "dentistry" },
  clinicId = "",
}: {
  specialty?: string;
  stats?: DashboardStats;
  clinicId?: string;
}) {
  const config = SPECIALTY_CONFIG[specialty] || SPECIALTY_CONFIG.dentistry;
  // استبدال #display بالرابط الحقيقي لشاشة الانتظار
  const resolvedActions = config.actions.map((action) => ({
    ...action,
    href: action.href === "#display" ? `/display/${clinicId}` : action.href,
  }));

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header with Stats */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.07)]">
        <SectionHeader
          title={config.headline}
          subtitle={config.description}
        />

        {/* Stats Cards Grid */}
        <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
          {config.focusMetrics.map((metric) => (
            <div key={metric.label} className="bg-white px-5 py-4 transition hover:bg-slate-50">
              <p className="text-xs font-black text-slate-400">{metric.label}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-3xl font-black text-blue-600">{metric.value}</p>
                <p className="pb-1 text-[11px] font-bold text-slate-400">{metric.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-950">إجراءات سريعة</h2>
        </div>
        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {resolvedActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                target={action.href.startsWith("/display/") ? "_blank" : undefined}
                className={`rounded-lg px-4 py-3 text-center text-sm font-black transition ${
                  action.variant === "primary"
                    ? "bg-slate-950 text-white hover:bg-slate-800"
                    : action.variant === "success"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
                      : "bg-white text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50"
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Follow-ups Section */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-950">المتابعات المهمة</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">الحالات التي تحتاج انتباهك اليوم</p>
        </div>
        <div className="p-5">
          <div className="space-y-2 rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100">
            <p className="text-sm font-bold text-amber-700">لا توجد متابعات عاجلة حالياً</p>
            <p className="text-xs font-semibold text-amber-600">جميع الحالات تحت السيطرة</p>
          </div>
        </div>
      </section>
    </div>
  );
}
