import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TodayAppointmentsClient from "./TodayAppointmentsClient";

function toArabicDate(date: Date): string {
  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId as string;
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await db.appointment.findMany({
    where: {
      clinicId,
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: { patient: true },
    orderBy: [{ queueNumber: "asc" }, { date: "asc" }],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = appointments.map((a: any) => ({
    id: a.id,
    patientId: a.patientId,
    patientName: a.patient.name,
    patientPhone: a.patient.whatsappPhone,
    date: a.date.toISOString(),
    status: a.status,
    queueNumber: a.queueNumber,
    queueStatus: a.queueStatus,
  }));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">مواعيد اليوم</h1>
        <p className="text-sm text-gray-500 mt-1">{toArabicDate(today)}</p>
        <p className="text-sm text-gray-600 mt-1">
          إجمالي المواعيد:{" "}
          <span className="font-semibold text-blue-700">
            {appointments.length}
          </span>
        </p>
      </div>
      <TodayAppointmentsClient appointments={serialized} />
    </div>
  );
}
