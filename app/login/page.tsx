"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { LogIn, ShieldAlert } from "lucide-react";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  let activePath: "/" | "/unggah" | "/cari" = "/";
  if (callbackUrl.includes("/unggah")) activePath = "/unggah";
  else if (callbackUrl.includes("/cari")) activePath = "/cari";

  return (
    <AppShell active={activePath}>
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <ShieldAlert className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Akses Dibatasi
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Silakan masuk menggunakan akun Google Anda untuk melanjutkan ke halaman khusus pengurus DKM.
          </p>

          <Button 
            size="lg" 
            className="w-full rounded-xl"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <LogIn className="mr-2 h-5 w-5" />
            Masuk dengan Google
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AppShell active="/">
        <div className="py-16 text-center text-muted-foreground">Memuat...</div>
      </AppShell>
    }>
      <LoginContent />
    </Suspense>
  );
}