"use server";

import { signIn } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  // Accept both "identifier" (new) and "email" (legacy) field names
  const identifier = (formData.get("identifier") ?? formData.get("email")) as string;
  const password   = formData.get("password") as string;

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error: any) {
    if (error?.message?.includes("NEXT_REDIRECT")) throw error;
    return "رقم الواتساب أو كلمة المرور غير صحيحة";
  }
}
