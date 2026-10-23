import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Receipt,
  User,
  AlertCircle,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const donor = await prisma.donor.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: donor ? `Profil Donatur — ${donor.name}` : "Profil Donatur",
  };
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DonorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Query data donatur dan riwayat transaksi terverifikasi (strictly preserved)
  const donor = await prisma.donor.findUnique({
    where: { id },
    include: {
      transactions: {
        where: {
          isVerified: true,
          type: "pemasukan",
        },
        include: {
          report: {
            select: {
              id: true,
              reportDate: true,
            },
          },
        },
        orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      },
    },
  });

  // Handle 404: Donatur tidak ditemukan
  if (!donor) {
    return (
      <AppShell active="/donatur">
        <PageShell>
          <div className="mx-auto max-w-xl py-12">
            <div className="rounded-2xl border border-error/20 bg-surface-container p-8 text-center shadow-xs">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
                <AlertCircle size={32} />
              </div>
              <h1 className="text-2xl font-bold text-on-surface">
                Donatur Tidak Ditemukan
              </h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Data profil donatur dengan ID <code className="bg-surface-container-high px-1.5 py-0.5 rounded font-mono text-xs">{id}</code> tidak ditemukan di sistem atau belum memiliki transaksi terverifikasi.
              </p>
              <div className="mt-6">
                <Link href="/donatur">
                  <Button variant="default">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Daftar Donatur
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </PageShell>
      </AppShell>
    );
  }

  const totalContribution = donor.transactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const averagePerDonation =
    donor.transactions.length > 0
      ? totalContribution / donor.transactions.length
      : 0;

  return (
    <AppShell active="/donatur">
      <PageShell>
        <div className="space-y-6 sm:space-y-8">
          {/* HEADER ATAS DI KANVAS TERANG */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Link
                href="/donatur"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={14} /> Kembali ke Daftar Donatur
              </Link>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                Donatur Terverifikasi
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0e3824] text-white shadow-xs">
                <User size={24} className="text-emerald-300" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {donor.name}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Profil donatur tercatat dalam buku kas DKM Masjid Al-Luqman
                </p>
              </div>
            </div>
          </div>

          {/* HERO CARD MELAYANG */}
          <div className="rounded-3xl bg-[#0e3824] text-white p-6 sm:p-8 lg:p-9 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-wrap items-baseline gap-6 sm:gap-10">
              <div>
                <span className="text-xs text-emerald-200/90 font-bold uppercase tracking-wider block">Total Kontribusi Terverifikasi</span>
                <div className="text-3xl sm:text-4xl md:text-[44px] font-bold text-white tabular-nums mt-1 leading-none">
                  {formatRupiah(totalContribution)}
                </div>
              </div>

              <div className="border-l border-emerald-400/20 pl-6 sm:pl-10">
                <span className="text-xs text-emerald-200/90 font-bold uppercase tracking-wider block">Frekuensi Infaq</span>
                <div className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-1">
                  {donor.transactions.length} <span className="text-xs font-normal text-emerald-200/70">kali tercatat</span>
                </div>
              </div>

              <div className="border-l border-emerald-400/20 pl-6 sm:pl-10">
                <span className="text-xs text-emerald-200/90 font-bold uppercase tracking-wider block">Rata-rata per Infaq</span>
                <div className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-1">
                  {formatRupiah(averagePerDonation)}
                </div>
              </div>
            </div>
          </div>
          {/* Riwayat Transaksi — Format Buku Besar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold text-on-surface font-sans">
                  Riwayat Infaq Terverifikasi ({donor.transactions.length})
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant tabular-nums">
                Rata-rata: <strong className="text-on-surface font-semibold">{formatRupiah(averagePerDonation)}</strong> per infaq
              </span>
            </div>

            {donor.transactions.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant rounded-xl border border-dashed border-outline-variant bg-surface-container/50">
                <p className="text-sm">Belum ada riwayat transaksi terverifikasi untuk donatur ini.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden shadow-xs divide-y divide-outline-variant">
                {donor.transactions.map((tx) => {
                  const txDate = tx.transactionDate ?? tx.report.reportDate;
                  const dateStr = new Date(txDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 gap-3 transition-colors hover:bg-surface-container-high/40"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                          <Receipt size={15} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {tx.description || "Infaq Kas Masjid"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
                            <Calendar size={12} className="text-primary/70" />
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 ml-11 sm:ml-0">
                        <span className="text-base sm:text-lg font-bold text-primary tabular-nums">
                          +{formatRupiah(Number(tx.amount))}
                        </span>

                        <Link
                          href={`/laporan/${tx.reportId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary bg-surface-container hover:bg-surface-container-high border border-outline-variant px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <FileText size={12} />
                          <span>Laporan</span>
                          <ExternalLink size={10} className="opacity-70" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PageShell>
    </AppShell>
  );
}
