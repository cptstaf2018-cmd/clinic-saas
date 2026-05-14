import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PatientListPremium from "@/components/PatientListPremium";
import ClearClinicDataButton from "../ClearClinicDataButton";

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");
  const clinicId = session.user.clinicId as string;
  const { q } = await searchParams;
  const initialQuery = q ?? "";

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

  const now = new Date();
  const serialized = patients.map((patient) => {
    const completed = patient.appointments.filter((appointment) => appointment.status === "completed");
    const upcoming = patient.appointments.filter(
      (appointment) => new Date(appointment.date) > now && appointment.status !== "cancelled"
    );

    return {
      id: patient.id,
      name: patient.name,
      phone: patient.whatsappPhone,
      totalVisits: completed.length,
      lastVisit: completed.length > 0 ? completed[0].date.toISOString() : null,
      hasUpcoming: upcoming.length > 0,
    };
  });

  const withUpcoming = serialized.filter((patient) => patient.hasUpcoming).length;
  const newThisMonth = patients.filter((patient) => {
    const created = new Date(patient.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-7">
        <PatientListPremium patients={serialized} initialQuery={initialQuery} />
        
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-end">
            <ClearClinicDataButton />
          </div>
        </section>
      </div>
    </div>
  );
}
