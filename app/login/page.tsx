"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { LogIn, Lock, ShieldCheck, HeartHandshake } from "lucide-react";
import { isStaff } from "@/lib/auth-guard";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Jika sudah terautentikasi, otomatis alihkan ke tujuan atau /unggah untuk staf
  useEffect(() => {
    if (status === "authenticated" && session) {
      if (callbackUrl && callbackUrl !== "/" && !callbackUrl.includes("/login")) {
        router.replace(callbackUrl);
      } else if (isStaff(session)) {
        router.replace("/unggah");
      } else {
        router.replace("/");
      }
    }
  }, [status, session, callbackUrl, router]);

  const targetCallback = callbackUrl && callbackUrl !== "/"
    ? `/auth/post-login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/post-login";

  let activePath: "/" | "/unggah" | "/cari" = "/";
  if (callbackUrl?.includes("/unggah")) activePath = "/unggah";
  else if (callbackUrl?.includes("/cari")) activePath = "/cari";

  return (
    <AppShell active={activePath}>
      <PageShell>
        <div className="flex flex-col items-center justify-center py-10 sm:py-16">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-8 text-center shadow-2xs space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Masuk dengan Akun Google
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Gunakan email akun Google yang telah didaftarkan atau ditugaskan oleh pengurus DKM untuk mengelola arsip pembukuan kas.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full rounded-xl gap-2 font-bold text-sm bg-[#0e3824] hover:bg-[#144731] text-white shadow-xs h-11 transition-colors"
              onClick={() => signIn("google", { callbackUrl: targetCallback })}
            >
              <LogIn className="h-4 w-4" />
              <span>Lanjutkan dengan Google</span>
            </Button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <HeartHandshake className="h-4 w-4 text-emerald-800 shrink-0" />
              <span>Jemaah & donatur umum dapat mengakses laporan tanpa perlu masuk.</span>
            </div>
          </div>
        </div>
      </PageShell>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AppShell active="/">
        <PageShell>
          <div className="py-16 text-center text-muted-foreground">Memuat...</div>
        </PageShell>
      </AppShell>
    }>
      <LoginContent />
    </Suspense>
  );
}