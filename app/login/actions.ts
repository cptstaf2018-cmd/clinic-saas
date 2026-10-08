"use server";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const identifier = ((formData.get("identifier") ?? formData.get("email")) as string)?.trim();
  const password   = formData.get("password") as string;

  let redirectTo = "/dashboard";

  if (identifier?.includes("@")) {
    // Check if this is a superadmin email — everything else goes to /dashboard
    const adminUser = await db.user.findUnique({
      where: { email: identifier },
      select: { role: true },
    });
    if (adminUser?.role === "superadmin") redirectTo = "/admin";
  }

  try {
    await signIn("credentials", { identifier, password, redirectTo });
  } catch (error: any) {
    if (error?.message?.includes("NEXT_REDIRECT")) throw error;
    return "الإيميل أو كلمة المرور غير صحيحة";
  }
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}
