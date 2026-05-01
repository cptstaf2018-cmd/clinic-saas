import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    clinicId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      clinicId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    clinicId: string | null;
  }
}
