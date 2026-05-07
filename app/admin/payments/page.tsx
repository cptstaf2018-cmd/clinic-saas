import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PaymentsClient from "./PaymentsClient";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") redirect("/login");

  const payments = await db.payment.findMany({
    include: { clinic: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    method: p.method,
    status: p.status,
    reference: p.reference,
    createdAt: p.createdAt.toISOString(),
    clinic: { name: p.clinic.name },
  }));

  return <PaymentsClient initialPayments={serialized} />;
}
