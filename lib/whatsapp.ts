import { logSystemEvent } from "@/lib/system-events";

// WasenderAPI — https://wasenderapi.com
// Auth: Bearer API key | Endpoint: POST /api/send-message
// Phone format: E.164 e.g. +9647701234567

function toE164Iraq(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("964")) return `+${digits}`;
  if (digits.startsWith("0")) return `+964${digits.slice(1)}`;
  return `+964${digits}`;
}

export async function sendWhatsApp(
  to: string,
  message: string,
  apiKey?: string,
  context?: { clinicId?: string; source?: string; appointmentId?: string }
): Promise<void> {
  const key = apiKey || process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_API_TOKEN;
  const phone = toE164Iraq(to);

  if (!key) {
    console.log(`[WhatsApp DEV] To: ${phone}\n${message}`);
    return;
  }

  const res = await fetch("https://www.wasenderapi.com/api/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ to: phone, text: message }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[WhatsApp] Send failed: ${res.status} ${err}`);
    await logSystemEvent({
      clinicId: context?.clinicId,
      type: "whatsapp_send_failed",
      severity: "error",
      source: context?.source ?? "whatsapp",
      title: "فشل إرسال رسالة واتساب",
      message: `WasenderAPI returned ${res.status}`,
      metadata: { phone, status: res.status, response: err, appointmentId: context?.appointmentId },
    });
    throw new Error(`WhatsApp send failed: ${res.status}`);
  }
}
