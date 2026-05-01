import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import PatientSearchClient from "./PatientSearchClient";

export default async function PatientsPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId as string;

  const patients = await db.patient.findMany({
    where: { clinicId },
    include: {
      appointments: {
        select: { id: true, date: true, status: true },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = patients.map((p: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed = p.appointments.filter(
      (a: any) => a.status === "completed"
    );
    const lastVisit =
      completed.length > 0 ? completed[0].date.toISOString() : null;
    return {
      id: p.id,
      name: p.name,
      phone: p.whatsappPhone,
      totalVisits: completed.length,
      lastVisit,
    };
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">المرضى</h1>
        <p className="text-sm text-gray-500 mt-1">
          إجمالي:{" "}
          <span className="font-semibold text-blue-700">{patients.length}</span>
        </p>
      </div>
      <PatientSearchClient patients={serialized} />
    </div>
  );
}
