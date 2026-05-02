import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Phone or Email", type: "text" },
        password:   { label: "Password",       type: "password" },
      },
      async authorize(credentials) {
        try {
          const identifier = (credentials?.identifier as string ?? "").trim();
          const password   = credentials?.password as string;
          if (!identifier || !password) return null;

          let user = null;

          // Phone login — find clinic by whatsapp number, get its user
          const isPhone = /^07\d{7,}$/.test(identifier) || /^\+964/.test(identifier);
          if (isPhone) {
            const clinic = await db.clinic.findUnique({
              where: { whatsappNumber: identifier },
              include: { users: { take: 1 } },
            });
            if (!clinic || clinic.users.length === 0) return null;
            user = clinic.users[0];
          } else {
            // Email login — superadmin
            user = await db.user.findUnique({ where: { email: identifier } });
          }

          if (!user) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

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
    jwt({ token, user }) {
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
  pages: { signIn: "/login" },
});
