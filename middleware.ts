import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};