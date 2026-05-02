"use server";

import { signIn } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const identifier = (formData.get("identifier") ?? formData.get("email")) as string;
  const password   = formData.get("password") as string;

  // Detect if email (superadmin) or phone (clinic)
  const isEmail = identifier?.includes("@");
  const redirectTo = isEmail ? "/admin" : "/dashboard";

  try {
    await signIn("credentials", { identifier, password, redirectTo });
  } catch (error: any) {
    if (error?.message?.includes("NEXT_REDIRECT")) throw error;
    return isEmail
      ? "الإيميل أو كلمة المرور غير صحيحة"
      : "رقم الواتساب أو كلمة المرور غير صحيحة";
  }
}
