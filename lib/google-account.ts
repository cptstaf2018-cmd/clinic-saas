import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { dateAfterDays, TRIAL_PERIOD_DAYS } from "@/lib/subscription-durations";

export type GoogleAccountUser = { id: string; role: string; clinicId: string | null };

/**
 * Resolve the clinic user for a verified Google email, creating a new
 * clinic (with the 14-day trial) on first sign-in. Superadmins never sign
 * in through Google.
 */
export async function findOrCreateGoogleUser(
  rawEmail: string,
  displayName?: string | null
): Promise<GoogleAccountUser | null> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return null;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.role === "superadmin") return null;
    return { id: existingUser.id, role: existingUser.role, clinicId: existingUser.clinicId };
  }

  const existingClinic = await db.clinic.findFirst({
    where: { backupEmail: email },
    include: { users: { take: 1 } },
  });
  if (existingClinic?.users[0]) {
    const u = existingClinic.users[0];
    if (u.role === "superadmin") return null;
    return { id: u.id, role: u.role, clinicId: u.clinicId };
  }
  if (existingClinic) return null;

  const firstName = (displayName ?? "").trim().split(/\s+/)[0];
  const clinicName = firstName ? `منشأة ${firstName}` : "منشأتي";
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

  const clinic = await db.clinic.create({
    data: {
      name: clinicName,
      backupEmail: email,
      specialtyOnboardingRequired: true,
      users: { create: { passwordHash, role: "doctor" } },
      subscription: {
        create: { plan: "trial", status: "trial", expiresAt: dateAfterDays(TRIAL_PERIOD_DAYS) },
      },
    },
    include: { users: { take: 1 } },
  });
  const u = clinic.users[0];
  return { id: u.id, role: u.role, clinicId: u.clinicId };
}
