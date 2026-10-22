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

  const heroContent = (
    <div>
      <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-primary-fixed">
        <Lock className="h-4 w-4 shrink-0" />
        <span>Gerbang Autentikasi Pengurus DKM • Masjid Al-Luqman</span>
      </div>

      <h1 className="mt-3 text-2xl sm:text-4xl md:text-[44px] font-semibold leading-tight tracking-tight text-on-primary">
        Akses Ruang Kerja Pengurus
      </h1>

      <div className="mt-2 text-xs md:text-sm text-primary-fixed/80">
        Khusus bendahara, panitia pengurus, dan administrator sistem arsip kas Masjid Al-Luqman, Soklat, Subang.
      </div>
    </div>
  );

  return (
    <AppShell active={activePath}>
      <PageShell heroBand={heroContent}>
        <div className="flex flex-col items-center justify-center py-10 sm:py-16">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container p-7 sm:p-8 text-center shadow-xs space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface">
                Masuk dengan Akun Google
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Gunakan email akun Google yang telah didaftarkan atau ditugaskan oleh pengurus DKM untuk mengelola arsip pembukuan kas.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full rounded-xl gap-2 font-semibold bg-primary text-on-primary hover:bg-primary/90 shadow-xs"
              onClick={() => signIn("google", { callbackUrl: targetCallback })}
            >
              <LogIn className="h-4 w-4" />
              <span>Lanjutkan dengan Google</span>
            </Button>

            <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
              <HeartHandshake className="h-4 w-4 text-primary shrink-0" />
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