"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wallet,
  Calendar,
  FileText,
  Info,
  ShieldAlert,
  X,
  ImagePlus,
  ExternalLink,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/page-shell";
import { CashflowTrendSection } from "@/components/cashflow-trend-section";

interface DashboardClientProps {
  initialFinalBalance: number | null;
  latestReportDate: string | null;
  latestReportId: string | null;
  authError?: string | null;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Hook untuk animasi count-up halus (~600ms, easing ease-out cubic)
function useCountUp(target: number, duration: number = 600) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easedProgress * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return count;
}

export function DashboardClient({
  initialFinalBalance,
  latestReportDate,
  latestReportId,
  authError,
}: DashboardClientProps) {
  const searchParams = useSearchParams();
  const isForbidden = authError === "forbidden" || searchParams?.get("error") === "forbidden";
  const [forbiddenDismissed, setForbiddenDismissed] = React.useState(false);
  const showForbiddenAlert = isForbidden && !forbiddenDismissed;

  const animatedBalance = useCountUp(initialFinalBalance ?? 0, 600);

  const now = React.useMemo(() => new Date(), []);
  const initialDate = React.useMemo(() => {
    if (latestReportDate) {
      const d = new Date(latestReportDate + "T00:00:00Z");
      if (!isNaN(d.getTime())) return d;
    }
    return now;
  }, [latestReportDate, now]);

  const heroContent = (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary-fixed/20 pb-4">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-primary-fixed">
          <Wallet className="h-4 w-4 shrink-0" />
          <span>Kokpit Analitik Kas Pengurus • DKM Al-Luqman</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/unggah"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-on-primary text-primary text-xs font-bold shadow-xs hover:bg-on-primary/90 transition-colors"
          >
            <ImagePlus size={14} />
            <span>+ Unggah Laporan Baru</span>
          </Link>
          <Link
            href="/?view=public"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 text-xs font-semibold transition-colors"
          >
            <ExternalLink size={13} />
            <span>Lihat Portal Publik</span>
          </Link>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[11px] uppercase tracking-wider text-primary-fixed/80 font-bold block">
          Saldo Kas Fisik Terverifikasi (Laporan Terakhir)
        </span>
        <div className="text-3xl sm:text-5xl md:text-[52px] font-bold leading-tight tracking-tight tabular-nums text-on-primary font-sans">
          {initialFinalBalance !== null
            ? formatRupiah(animatedBalance)
            : "Belum Ada"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-primary-fixed/80">
        {latestReportDate ? (
          <>
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              Laporan terakhir:{" "}
              {new Date(latestReportDate).toLocaleDateString("id-ID", {
                dateStyle: "medium",
              })}
            </span>
            {latestReportId && (
              <Link
                href={`/laporan/${latestReportId}`}
                className="inline-flex items-center gap-1 text-primary-fixed hover:underline ml-1"
              >
                <span>(Lihat Dokumen)</span>
                <FileText className="h-3 w-3" />
              </Link>
            )}
          </>
        ) : (
          <span>Belum ada laporan dengan saldo kas terverifikasi.</span>
        )}
      </div>
    </div>
  );

  return (
    <PageShell heroBand={heroContent}>
      <div className="space-y-8 sm:space-y-10">
        {/* Banner Notifikasi Akses Ditolak (Issue #074) */}
        {showForbiddenAlert && (
          <div className="rounded-xl border border-amber-300/80 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 text-amber-950 dark:text-amber-100 flex items-start justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3 min-w-0">
              <ShieldAlert className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs space-y-1">
                <div className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                  Akses Ditolak — Fitur Khusus Staf Pengurus DKM
                </div>
                <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                  Anda dialihkan kembali ke Dashboard karena halaman yang dituju (seperti <strong>Unggah Laporan</strong> atau <strong>Manajemen Pengguna</strong>) memerlukan hak akses staf (<strong>Bendahara</strong> atau <strong>Administrator</strong>). Akun Anda saat ini memiliki hak akses sebagai <strong>Jemaah</strong>. Silakan hubungi Administrator DKM jika memerlukan peningkatan wewenang operasional.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setForbiddenDismissed(true);
                if (typeof window !== "undefined" && window.history.replaceState) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("error");
                  window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
                }
              }}
              className="p-1 rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/40 transition-colors shrink-0"
              title="Tutup pemberitahuan"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Banner Status Pengumpulan Data */}
        <Alert
          variant="info"
          className="flex items-center gap-2.5 py-2.5 px-4 text-xs rounded-lg shadow-none"
        >
          <Info className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-xs text-emerald-950 dark:text-emerald-100 font-medium leading-none">
            Data masih dalam tahap pengumpulan awal — sebagian periode mungkin belum lengkap.
          </AlertDescription>
        </Alert>

        {/* Komponen Ringkasan Kas & Tren Terpadu */}
        <CashflowTrendSection
          initialYear={initialDate.getUTCFullYear()}
          initialMonth={initialDate.getUTCMonth() + 1}
        />
      </div>
    </PageShell>
  );
}
