import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SpecialtyOnboardingClient from "./SpecialtyOnboardingClient";

export default async function SpecialtyOnboardingPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");
  if (session.user.role === "superadmin") redirect("/admin");

  const clinic = await db.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { specialty: true, specialtyOnboardingRequired: true },
  });

  if (!clinic?.specialtyOnboardingRequired || clinic.specialty) {
    redirect("/dashboard");
  }

  return <SpecialtyOnboardingClient />;
}
