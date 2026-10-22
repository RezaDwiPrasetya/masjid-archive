import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/**
 * Endpoint post-login pintar:
 * Mengarahkan staf (BENDAHARA / ADMIN) langsung ke halaman kerja utama (/unggah),
 * sedangkan akun publik / Jamaah diarahkan ke halaman arsip (/ atau callbackUrl asli).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  let isUserStaff = isStaff(session);

  // Fallback membaca langsung dari token JWT jika session adapter sedang sinkronisasi
  if (!isUserStaff) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = (token?.role as string | undefined)?.trim().toUpperCase();
    if (role === "ADMIN" || role === "BENDAHARA") {
      isUserStaff = true;
    }
  }

  const target = request.nextUrl.searchParams.get("callbackUrl");

  // Jika pengguna adalah staf DKM (Bendahara / Admin), bawa langsung ke halaman unggah atau tujuan spesifik
  if (isUserStaff) {
    if (
      target &&
      target !== "/" &&
      !target.startsWith("/login") &&
      !target.startsWith("/auth/post-login")
    ) {
      return NextResponse.redirect(new URL(target, request.url));
    }
    // Jika pengguna adalah staf DKM (Bendahara / Admin), bawa ke dashboard analitik atau tujuan spesifik
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Pengguna tanpa role staf (Jamaah / Calon Staf yang belum diverifikasi) diarahkan ke halaman status pending
  return NextResponse.redirect(new URL("/pending", request.url));
}
