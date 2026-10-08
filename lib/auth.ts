import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string | null;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  // Menggunakan adapter dari @auth/prisma-adapter
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    // Karena menggunakan database adapter, defaultnya adalah database session.
    // Jika ingin menggunakan JWT secara eksplisit, bisa diatur menjadi "jwt".
    // Biasanya untuk Google OAuth + Prisma, menggunakan database adalah hal wajar.
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id || (token.id as string) || token.sub;
      if (userId) {
        token.id = userId;
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        token.role = dbUser?.role || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = (token.role as string | null) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
