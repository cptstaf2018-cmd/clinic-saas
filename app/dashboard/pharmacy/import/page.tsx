import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ImportClient from "./ImportClient";

export default async function PharmacyImportPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { facilityType: true } });
  if (clinic?.facilityType !== "pharmacy") redirect("/dashboard");

  return <ImportClient receiptEnabled={Boolean(process.env.ANTHROPIC_API_KEY)} />;
}
