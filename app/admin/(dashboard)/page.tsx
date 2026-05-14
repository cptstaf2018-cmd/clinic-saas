import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminClinicsClient from "./AdminClinicsClient";

export default async function AdminClinicsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") redirect("/login");
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "";

  const PAGE_SIZE = 50;

  const [clinics, total] = await Promise.all([
    db.clinic.findMany({
      include: { subscription: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    db.clinic.count(),
  ]);

  const serialized = clinics.map((c) => ({
    id: c.id,
    name: c.name,
    whatsappNumber: c.whatsappNumber,
    subscription: c.subscription
      ? {
          plan: c.subscription.plan,
          status: c.subscription.status,
          expiresAt: c.subscription.expiresAt.toISOString(),
        }
      : null,
  }));

  return (
    <AdminClinicsClient
      initialClinics={serialized}
      totalClinics={total}
      publicBaseUrl={publicBaseUrl}
    />
  );
}
