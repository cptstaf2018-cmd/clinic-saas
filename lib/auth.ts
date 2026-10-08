import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyImpersonateToken } from "@/lib/impersonate";
import { findOrCreateGoogleUser } from "@/lib/google-account";
import { clientIp, isLoginBlocked, recordLoginFailure } from "@/lib/login-throttle";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
      : []),
    Credentials({
      credentials: {
        identifier:        { label: "Phone or Email",    type: "text"     },
        password:          { label: "Password",          type: "password" },
        impersonateToken:  { label: "Impersonate Token", type: "text"     },
      },
      async authorize(credentials, request) {
        try {
          // Impersonation path — super admin entering a clinic
          const impersonateToken = credentials?.impersonateToken as string | undefined;
          if (impersonateToken) {
            const payload = verifyImpersonateToken(impersonateToken);
            if (!payload) return null;
            const user = await db.user.findUnique({ where: { id: payload.userId } });
            if (!user) return null;
            return {
              id: user.id,
              email: user.email ?? "",
              name: user.role,
              role: user.role,
              clinicId: user.clinicId ?? undefined,
            } as any;
          }

          const identifier = (credentials?.identifier as string ?? "").trim();
          const password   = credentials?.password as string;
          if (!identifier || !password) return null;

          // Too many recent failures for this e-mail or from this address: refuse without checking the password
          const ip = clientIp(request.headers);
          if (await isLoginBlocked(identifier, ip)) return null;

          // Email login — try superadmin first, then clinic backupEmail
          let user = await db.user.findUnique({ where: { email: identifier } });

          if (!user) {
            // Clinic user logging in with their backupEmail
            const clinic = await db.clinic.findFirst({
              where: { backupEmail: identifier },
              include: { users: { take: 1 } },
            });
            if (clinic?.users.length) user = clinic.users[0];
          }

          const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
          if (!user || !valid) {
            await recordLoginFailure(identifier, ip);
            return null;
          }

          return {
            id: user.id,
            email: user.email ?? identifier,
            name: user.role,
            role: user.role,
            clinicId: user.clinicId ?? undefined,
          } as any;
        } catch (e) {
          console.error("Auth error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      if (!profile?.email || profile.email_verified !== true) return false;
      try {
        return (await findOrCreateGoogleUser(profile.email, profile.name)) !== null;
      } catch (e) {
        console.error("Google sign-in error:", e);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const dbUser = await findOrCreateGoogleUser(profile.email, profile.name);
        if (dbUser) {
          token.sub      = dbUser.id;
          token.role     = dbUser.role;
          token.clinicId = dbUser.clinicId;
        }
        return token;
      }
      if (user) {
        token.role    = (user as any).role;
        token.clinicId = (user as any).clinicId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      (session.user as any).role     = token.role as string;
      (session.user as any).clinicId = token.clinicId as string | null;
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
});
