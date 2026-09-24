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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
            <Card className="border-error/20 bg-surface-container p-8 text-center">
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
            </Card>
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
        <div className="space-y-6">
          {/* Back Navigation */}
          <div>
            <Link
              href="/donatur"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
            >
              <ArrowLeft size={14} /> Kembali ke Daftar Donatur
            </Link>
          </div>

          {/* Profile Header Card */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6 sm:p-7 shadow-level-1">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fixed shadow-xs">
                  <User size={28} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight font-sans">
                      {donor.name}
                    </h1>
                    <Badge variant="success">
                      Donatur Terverifikasi
                    </Badge>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Profil donasi tercatat dan telah diverifikasi pada pembukuan kas masjid.
                  </p>
                </div>
              </div>

              {/* Stat Summary - Horizontal & Balanced */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 border-t md:border-t-0 md:border-l border-outline-variant pt-4 md:pt-0 md:pl-6">
                <div className="min-w-[140px]">
                  <span className="text-xs font-medium text-on-surface-variant block">
                    Total Kontribusi
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-primary tabular-nums mt-0.5 block">
                    {formatRupiah(totalContribution)}
                  </span>
                </div>
                <div className="min-w-[110px]">
                  <span className="text-xs font-medium text-on-surface-variant block">
                    Frekuensi Infaq
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-on-surface tabular-nums mt-0.5 block">
                    {donor.transactions.length} <span className="text-xs font-normal text-on-surface-variant">kali</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Riwayat Transaksi — Format Buku Besar */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold text-on-surface font-sans">
                  Riwayat Infaq Terverifikasi ({donor.transactions.length})
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant tabular-nums">
                Rata-rata per infaq: <strong className="text-on-surface">{formatRupiah(averagePerDonation)}</strong>
              </span>
            </div>

            {donor.transactions.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant rounded-xl border border-dashed border-outline-variant bg-surface-container/50">
                <p className="text-sm">Belum ada riwayat transaksi terverifikasi untuk donatur ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant border-y border-outline-variant">
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
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 px-3 gap-3 transition-colors hover:bg-surface-container rounded-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Receipt size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {tx.description || "Infaq Kas Masjid"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5">
                            <Calendar size={12} className="text-primary/70" />
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 ml-10 sm:ml-0">
                        <span className="text-base font-bold text-primary tabular-nums">
                          +{formatRupiah(Number(tx.amount))}
                        </span>

                        <Link
                          href={`/laporan/${tx.reportId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary bg-surface-container-high hover:bg-surface-container border border-outline-variant px-2.5 py-1 rounded-md transition-colors"
                        >
                          <FileText size={12} />
                          <span>Laporan</span>
                          <ExternalLink size={10} />
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
