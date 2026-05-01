import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const planLabels: Record<string, string> = {
  trial: "تجريبي",
  basic: "أساسي",
  standard: "قياسي",
  premium: "مميز",
};

const statusConfig: Record<
  string,
  { label: string; cls: string; bg: string }
> = {
  trial: {
    label: "تجريبي",
    cls: "text-yellow-800",
    bg: "bg-yellow-50 border-yellow-200",
  },
  active: {
    label: "نشط",
    cls: "text-green-800",
    bg: "bg-green-50 border-green-200",
  },
  inactive: {
    label: "منتهي",
    cls: "text-red-800",
    bg: "bg-red-50 border-red-200",
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId;

  const subscription = await db.subscription.findUnique({
    where: { clinicId },
  });

  if (!subscription) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto" dir="rtl">
        <h1 className="text-xl font-bold text-gray-900 mb-6">الاشتراك</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
          <p className="text-gray-500 text-sm">لا يوجد اشتراك مسجل لهذه العيادة</p>
        </div>
      </div>
    );
  }

  const sc = statusConfig[subscription.status] ?? statusConfig.inactive;
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (subscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">الاشتراك</h1>
        <p className="text-sm text-gray-500 mt-1">تفاصيل اشتراك العيادة</p>
      </div>

      <div
        className={`rounded-xl border p-5 shadow-sm mb-4 ${sc.bg}`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className={`font-bold text-base ${sc.cls}`}>
            {sc.label}
          </span>
          <span className="text-sm text-gray-600 font-medium">
            {planLabels[subscription.plan] ?? subscription.plan}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">تاريخ البدء</span>
            <span className="text-gray-800 font-medium">
              {formatDate(subscription.startDate)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">تاريخ الانتهاء</span>
            <span className="text-gray-800 font-medium">
              {formatDate(subscription.expiresAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الأيام المتبقية</span>
            <span
              className={`font-bold ${
                daysLeft <= 7
                  ? "text-red-600"
                  : daysLeft <= 30
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {daysLeft} يوم
            </span>
          </div>
        </div>
      </div>

      {(subscription.status === "inactive" ||
        subscription.status === "trial") && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-700 mb-3 font-medium">
            للترقية أو تجديد الاشتراك، تواصل مع الدعم
          </p>
          <p className="text-xs text-gray-500">
            سيتم تفعيل الاشتراك بعد مراجعة الدفع من قبل الإدارة
          </p>
        </div>
      )}
    </div>
  );
}
