import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminClinicsClientPremium from "./AdminClinicsClientPremium";

export default async function AdminClinicsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") redirect("/login");
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "";

  const clinics = await db.clinic.findMany({
    include: {
      subscription: true,
      _count: { select: { patients: true, appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = clinics.map((c) => ({
    id: c.id,
    name: c.name,
    whatsappNumber: c.whatsappNumber,
    patientCount: c._count.patients,
    appointmentCount: c._count.appointments,
    subscription: c.subscription
      ? {
          plan: c.subscription.plan,
          status: c.subscription.status,
          expiresAt: c.subscription.expiresAt.toISOString(),
        }
      : null,
  }));

  return <AdminClinicsClientPremium initialClinics={serialized} publicBaseUrl={publicBaseUrl} />;
}
