import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getClinicSpecialtyConfig } from "@/lib/clinic-settings";
import PrescriptionClient from "./PrescriptionClient";

export default async function PrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const [clinic, patient, specialtyConfig] = await Promise.all([
    db.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, logoUrl: true, whatsappNumber: true, address: true },
    }),
    db.patient.findFirst({
      where: { id, clinicId },
      select: { id: true, name: true },
    }),
    getClinicSpecialtyConfig(clinicId),
  ]);

  if (!clinic || !patient) notFound();

  return (
    <PrescriptionClient
      patientId={patient.id}
      patientName={patient.name}
      clinicName={clinic.name}
      specialty={specialtyConfig.nameAr}
      phone={clinic.whatsappNumber}
      address={clinic.address ?? null}
      logoUrl={clinic.logoUrl ?? null}
    />
  );
}
