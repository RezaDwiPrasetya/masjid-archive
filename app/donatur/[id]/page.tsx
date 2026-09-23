import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  HeartHandshake,
  Receipt,
  User,
  AlertCircle,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  // Query data donatur dan riwayat transaksi terverifikasi
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
        <div className="mx-auto max-w-xl py-12">
          <Card className="border-destructive/20 bg-card/70 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Donatur Tidak Ditemukan
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Data profil donatur dengan ID <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{id}</code> tidak ditemukan di sistem atau belum memiliki transaksi terverifikasi.
            </p>
            <div className="mt-6">
              <Link href="/donatur">
                <Button className="rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Daftar Donatur
                </Button>
              </Link>
            </div>
          </Card>
        </div>
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
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/donatur"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors"
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Donatur
        </Link>

        {/* Profil Header Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-emerald-500/10 via-card/70 to-card/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                  <User size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {donor.name}
                    </h1>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Donatur Terverifikasi
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Profil donasi tercatat secara resmi pada pembukuan kas masjid.
                  </p>
                </div>
              </div>

              {/* Stat Cards Mini */}
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                <div className="rounded-2xl border border-white/20 bg-card/60 p-3 backdrop-blur-md min-w-[140px]">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Total Kontribusi
                  </span>
                  <span className="text-lg font-bold text-primary block mt-0.5">
                    {formatRupiah(totalContribution)}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/20 bg-card/60 p-3 backdrop-blur-md min-w-[120px]">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Frekuensi Infaq
                  </span>
                  <span className="text-lg font-bold text-foreground block mt-0.5">
                    {donor.transactions.length} kali
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Riwayat Transaksi */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Riwayat Transaksi Terverifikasi
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daftar seluruh catatan infaq donatur yang telah dikonfirmasi oleh pengurus DKM.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Rata-rata: {formatRupiah(averagePerDonation)}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {donor.transactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-sm">Belum ada riwayat transaksi terverifikasi untuk donatur ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
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
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 px-6 gap-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <HeartHandshake size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {tx.description || "Infaq Kas Masjid"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Calendar size={12} />
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 ml-11 sm:ml-0">
                        <span className="text-base font-bold text-emerald-700">
                          +{formatRupiah(Number(tx.amount))}
                        </span>

                        <Link
                          href={`/laporan/${tx.reportId}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
