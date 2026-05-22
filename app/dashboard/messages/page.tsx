import { auth } from "@/lib/auth";
import { isSecretaryRole } from "@/lib/clinic-roles";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  return <MessagesClient canDeleteMessages={!isSecretaryRole(session.user.role)} />;
}
