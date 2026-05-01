interface ClinicWhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
}

export async function sendWhatsApp(
  to: string,
  message: string,
  clinicConfig?: ClinicWhatsAppConfig
): Promise<void> {
  // Normalize phone number — remove leading zeros, add country code
  const phone = to.startsWith("0") ? "964" + to.slice(1) : to;

  if (clinicConfig?.phoneNumberId && clinicConfig?.accessToken) {
    // Meta Cloud API (per-clinic WhatsApp Business)
    await fetch(
      `https://graph.facebook.com/v18.0/${clinicConfig.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clinicConfig.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message },
        }),
      }
    );
    return;
  }

  // Fallback: global env vars
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  if (apiUrl && apiToken) {
    await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ to: phone, message }),
    });
    return;
  }

  // Dev mode — just log
  console.log(`[WhatsApp DEV] To: ${phone}\n${message}`);
}
