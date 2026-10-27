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
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { CashflowTrendSection } from "@/components/cashflow-trend-section";

export interface PendingReportItem {
  id: string;
  reportDate: string;
  weekOfMonth: number;
  month: number;
  year: number;
  uploadedAt: string;
  attachmentCount: number;
  unextractedCount: number;
  unverifiedCount: number;
}

interface DashboardClientProps {
  initialFinalBalance: number | null;
  latestReportDate: string | null;
  latestReportId: string | null;
  pendingReports?: PendingReportItem[];
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
  pendingReports = [],
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

  return (
    <PageShell>
      <div className="space-y-6 sm:space-y-8">
        {/* UNIFIED HERO HEADER CARD (F-039) */}
        <div className="rounded-3xl bg-[#0e3824] text-white p-6 sm:p-8 lg:p-9 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5 sm:space-y-6">
            {/* Baris Atas: Judul Halaman & Tombol Aksi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Dashboard Kas Masjid
              </h1>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/unggah"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-[#0e3824] text-xs font-bold shadow-xs transition-colors"
                >
                  <ImagePlus size={14} />
                  <span>+ Unggah Laporan Baru</span>
                </Link>
                <Link
                  href="/?view=public"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold backdrop-blur-xs transition-colors"
                >
                  <ExternalLink size={13} />
                  <span>Lihat Portal Publik</span>
                </Link>
              </div>
            </div>

            {/* Garis Pemisah Halus */}
            <div className="border-t border-white/10" />

            {/* Baris Bawah: Metrik Saldo Kas & Informasi Tanggal Laporan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                  <Wallet size={14} />
                </div>
                <span>Saldo Kas Fisik Terverifikasi (Laporan Terakhir)</span>
              </div>

              <div className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-white tabular-nums leading-tight font-sans">
                {initialFinalBalance !== null
                  ? formatRupiah(animatedBalance)
                  : "Belum Ada"}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-emerald-100/80">
                {latestReportDate ? (
                  <>
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    <span>
                      Laporan terakhir:{" "}
                      {new Date(latestReportDate).toLocaleDateString("id-ID", {
                        dateStyle: "medium",
                      })}
                    </span>
                    {latestReportId && (
                      <Link
                        href={`/laporan/${latestReportId}`}
                        className="inline-flex items-center gap-1 text-emerald-200 hover:text-white underline ml-1"
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
          </div>
        </div>

        {/* BANNER LAPORAN BARU MENUNGGU EKSTRAKSI (Alur Cepat Staf Pengurus) */}
        {pendingReports && pendingReports.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#0e3824] text-white flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Laporan Baru Menunggu Ekstraksi AI &amp; Verifikasi ({pendingReports.length})
                  </h3>
                  <p className="text-xs text-slate-600">
                    Berkas laporan fisik telah berhasil diunggah dan siap diekstraksi ke pembukuan kas.
                  </p>
                </div>
              </div>
              <Link
                href="/cari"
                className="text-xs font-bold text-emerald-800 hover:underline self-start sm:self-auto"
              >
                Lihat Semua di Arsip &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {pendingReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        Pekan {rep.weekOfMonth}, {rep.month}/{rep.year}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        {rep.unextractedCount > 0 ? "Perlu Ekstraksi" : "Perlu Verifikasi"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(rep.reportDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                    </div>
                  </div>

                  <Link
                    href={`/laporan/${rep.id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#0e3824] hover:bg-[#144731] text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    <span>Buka &amp; Ekstrak Data</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Banner Notifikasi Akses Ditolak (Issue #074) */}
        {showForbiddenAlert && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-amber-950 flex items-start justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3 min-w-0">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs space-y-1">
                <div className="font-bold text-sm text-amber-900">
                  Akses Ditolak — Fitur Khusus Staf Pengurus DKM
                </div>
                <p className="leading-relaxed text-amber-800">
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
              className="p-1 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors shrink-0"
              title="Tutup pemberitahuan"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Banner Status Pengumpulan Data */}
        <div className="flex items-center gap-2.5 py-3 px-4 text-xs rounded-2xl border border-slate-200/90 bg-white text-slate-600 shadow-2xs">
          <Info className="h-4 w-4 shrink-0 text-emerald-800" />
          <span className="text-xs text-slate-600 font-medium">
            Data masih dalam tahap pengumpulan awal — sebagian periode mungkin belum lengkap.
          </span>
        </div>

        {/* Komponen Ringkasan Kas & Tren Terpadu */}
        <CashflowTrendSection
          initialYear={initialDate.getUTCFullYear()}
          initialMonth={initialDate.getUTCMonth() + 1}
        />
      </div>
    </PageShell>
  );
}
