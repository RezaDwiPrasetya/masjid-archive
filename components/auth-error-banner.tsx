"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";

interface AuthErrorBannerProps {
  authError?: string | null;
}

export function AuthErrorBanner({ authError }: AuthErrorBannerProps) {
  const searchParams = useSearchParams();
  const isForbidden = authError === "forbidden" || searchParams?.get("error") === "forbidden";
  const [dismissed, setDismissed] = React.useState(false);

  if (!isForbidden || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined" && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  };

  return (
    <div className="rounded-xl border border-amber-300/80 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 text-amber-950 dark:text-amber-100 flex items-start justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-3 min-w-0">
        <ShieldAlert className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs space-y-1">
          <div className="font-semibold text-sm text-amber-900 dark:text-amber-200">
            Akses Ditolak — Fitur Khusus Staf Pengurus DKM
          </div>
          <p className="leading-relaxed text-amber-800 dark:text-amber-300">
            Anda dialihkan kembali ke Beranda karena halaman yang dituju (seperti <strong>Unggah Laporan</strong> atau <strong>Manajemen Pengguna</strong>) memerlukan hak akses staf (<strong>Bendahara</strong> atau <strong>Administrator</strong>). Akun Anda saat ini memiliki hak akses sebagai <strong>Jemaah</strong>. Silakan hubungi Administrator DKM jika memerlukan peningkatan wewenang operasional.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/40 transition-colors shrink-0"
        title="Tutup pemberitahuan"
      >
        <X size={16} />
      </button>
    </div>
  );
}
