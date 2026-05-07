import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import CodesClient from "./CodesClient";

export default async function InvitationCodesPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") redirect("/login");

  const codes = await db.invitationCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = codes.map((c) => ({
    id: c.id,
    code: c.code,
    note: c.note,
    used: c.used,
    usedAt: c.usedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CodesClient initialCodes={serialized} />;
}
