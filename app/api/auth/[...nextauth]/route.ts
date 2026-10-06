import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const nextAuthHandler = NextAuth(authOptions);

async function handler(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await context.params;
  return nextAuthHandler(req, { params });
}

export { handler as GET, handler as POST };
