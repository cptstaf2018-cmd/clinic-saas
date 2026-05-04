import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "secret";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createImpersonateToken(userId: string, clinicId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = JSON.stringify({ userId, clinicId, exp });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function verifyImpersonateToken(token: string): { userId: string; clinicId: string } | null {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;
    if (sign(encoded) !== sig) return null;
    const { userId, clinicId, exp } = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (Date.now() > exp) return null;
    return { userId, clinicId };
  } catch {
    return null;
  }
}
