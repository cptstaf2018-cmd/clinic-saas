import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PaymentsClient from "./PaymentsClient";
import { cleanPaymentReference, extractPlanFromReference, planFromAmount } from "@/lib/plans";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") redirect("/login");

  const payments = await db.payment.findMany({
    include: { clinic: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activationCodes = await db.invitationCode.findMany({
    where: { note: { contains: "PAYMENT:" } },
    select: { code: true, note: true },
  });

  const activationByPayment = new Map<string, string>();
  for (const activation of activationCodes) {
    const paymentId = activation.note?.match(/PAYMENT:([^|\s]+)/)?.[1];
    if (paymentId) activationByPayment.set(paymentId, activation.code);
  }

  const serialized = payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    method: p.method,
    status: p.status,
    reference: cleanPaymentReference(p.reference),
    activationCode: activationByPayment.get(p.id) ?? null,
    requestedPlan: extractPlanFromReference(p.reference) ?? planFromAmount(p.amount),
    createdAt: p.createdAt.toISOString(),
    clinic: { name: p.clinic.name },
  }));

  return <PaymentsClient initialPayments={serialized} />;
}
