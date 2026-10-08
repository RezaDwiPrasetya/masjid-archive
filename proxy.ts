import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token.role as string | undefined)?.trim().toUpperCase();

  // Rute /unggah khusus staf DKM (ADMIN atau BENDAHARA)
  if (request.nextUrl.pathname.startsWith("/unggah")) {
    if (role !== "ADMIN" && role !== "BENDAHARA") {
      const forbiddenUrl = new URL("/dashboard?error=forbidden", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // Rute /pengguna khusus Administrator sistem (ADMIN)
  if (request.nextUrl.pathname.startsWith("/pengguna")) {
    if (role !== "ADMIN") {
      const forbiddenUrl = new URL("/dashboard?error=forbidden", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/unggah", "/unggah/:path*", "/pengguna", "/pengguna/:path*"],
};
