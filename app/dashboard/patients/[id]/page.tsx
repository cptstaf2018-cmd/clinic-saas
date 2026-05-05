import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import MedicalRecordsClient from "./MedicalRecordsClient";

const STATUS_LABEL: Record<string, string> = {
  pending:   "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "منتهي",
  cancelled: "ملغي",
};
const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const patient = await db.patient.findFirst({
    where: { id, clinicId },
    include: {
      appointments: { orderBy: { date: "desc" }, take: 20 },
      medicalRecords: { orderBy: { date: "desc" } },
    },
  });

  if (!patient) notFound();

  const completedCount = patient.appointments.filter(
    (a) => a.status === "completed"
  ).length;
  const lastCompleted = patient.appointments.find(
    (a) => a.status === "completed"
  );

  const serializedRecords = patient.medicalRecords.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    complaint: r.complaint,
    diagnosis: r.diagnosis,
    prescription: r.prescription,
    notes: r.notes,
  }));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* Back */}
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        قائمة المرضى
      </Link>

      {/* Patient Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-700 font-bold text-xl">
              {patient.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5 dir-ltr">{patient.whatsappPhone}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-700">{patient.appointments.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">إجمالي المواعيد</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">زيارة مكتملة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{patient.medicalRecords.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">سجل طبي</p>
          </div>
        </div>
        {lastCompleted && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            آخر زيارة:{" "}
            {new Date(lastCompleted.date).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Medical Records */}
      <MedicalRecordsClient
        patientId={patient.id}
        initialRecords={serializedRecords}
      />

      {/* Appointments History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">سجل المواعيد</h2>
        {patient.appointments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">لا توجد مواعيد</p>
        ) : (
          <div className="space-y-2">
            {patient.appointments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(a.date).toLocaleDateString("ar-EG", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(a.date).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {a.queueNumber ? ` · رقم ${a.queueNumber}` : ""}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_COLOR[a.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
