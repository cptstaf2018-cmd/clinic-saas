import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import TestsClient from "./TestsClient";
import { testImageUrl } from "@/lib/lab/image-url";

export default async function LabTestsPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { facilityType: true } });
  if (clinic?.facilityType !== "lab") redirect("/dashboard");

  const tests = await db.labTest.findMany({ where: { clinicId, active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] });
  return <TestsClient initialTests={tests.map(({ id, name, nameEn, category, unit, price, refLowM, refHighM, refLowF, refHighF, critLow, critHigh, imagePath, updatedAt }) => ({ id, name, nameEn, category, unit, price, refLowM, refHighM, refLowF, refHighF, critLow, critHigh, imageUrl: testImageUrl(id, imagePath, updatedAt) }))} />;
}
