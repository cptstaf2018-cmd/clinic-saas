import { redirect } from "next/navigation";

// مساعد العيادة — في انتظار البناء، يُعاد التوجيه للإعدادات مؤقتاً
export default function AssistantPage() {
  redirect("/dashboard/settings");
}
