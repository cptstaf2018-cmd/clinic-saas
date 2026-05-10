export type PaymentMethodId = "superkey" | "zaincash" | "crypto";

const METHOD_LABELS: Record<PaymentMethodId, string> = {
  superkey: "SuperKey",
  zaincash: "Zain Cash",
  crypto: "Binance / Crypto",
};

export function normalizePaymentReference(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function validatePaymentReference(method: PaymentMethodId, value: string) {
  const reference = normalizePaymentReference(value);

  if (!reference) {
    return { ok: false, reference, error: "رقم العملية مطلوب" };
  }

  if (method === "crypto") {
    const valid = /^[a-fA-F0-9]{32,120}$/.test(reference);
    return {
      ok: valid,
      reference,
      error: valid ? "" : "Hash / TXID غير صحيح. انسخه كما يظهر في منصة التحويل.",
    };
  }

  const validFormat = /^[A-Za-z0-9][A-Za-z0-9._-]{5,39}$/.test(reference);
  const hasDigit = /\d/.test(reference);

  return {
    ok: validFormat && hasDigit,
    reference,
    error:
      validFormat && hasDigit
        ? ""
        : `رقم عملية ${METHOD_LABELS[method]} غير صحيح. يجب أن يكون 6 إلى 40 رمزاً من أرقام أو حروف إنجليزية.`,
  };
}
