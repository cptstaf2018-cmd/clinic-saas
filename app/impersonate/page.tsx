import { signIn } from "@/lib/auth";
import { verifyImpersonateToken } from "@/lib/impersonate";
import { redirect } from "next/navigation";

export default async function ImpersonatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) redirect("/login");

  const payload = verifyImpersonateToken(token);
  if (!payload) redirect("/login");

  await signIn("credentials", {
    impersonateToken: token,
    redirectTo: "/dashboard",
  });
}
