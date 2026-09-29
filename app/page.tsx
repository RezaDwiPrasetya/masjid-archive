import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  FolderOpen,
  FileText,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export default async function ArsipLaporanPage() {
  const reports = await prisma.report.findMany({
    orderBy: { reportDate: "desc" },
    include: {
      uploadedBy: true,
      attachments: true,
      transactions: {
        where: { isVerified: true },
        select: { type: true, amount: true },
      },
    },
  });

  const groupedByYear = new Map<number, Map<number, typeof reports>>();
  for (const report of reports) {
    if (!groupedByYear.has(report.year)) groupedByYear.set(report.year, new Map());
    const yearGroup = groupedByYear.get(report.year)!;
    if (!yearGroup.has(report.month)) yearGroup.set(report.month, []);
    yearGroup.get(report.month)!.push(report);
  }

  const years = [...groupedByYear.keys()].sort((a, b) => b - a);

  return (
    <AppShell active="/">
      <PageShell>
        <div className="space-y-10">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b border-outline-variant pb-7">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">
                  Arsip Laporan
                </h1>
                <Badge variant="secondary" size="sm">
                  {reports.length} Laporan
                </Badge>
              </div>
              <p className="text-sm text-on-surface-variant max-w-xl leading-relaxed">
                Dokumentasi pindaian buku kas fisik dan laporan berkala DKM per periode mingguan &amp; bulanan.
              </p>
            </div>
            {years.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
                <CalendarDays size={14} className="text-primary" />
                <span>Periode:</span>
                <span className="font-semibold text-on-surface">
                  {years[years.length - 1]} {String.fromCharCode(8211)} {years[0]}
                </span>
              </div>
            )}
          </div>

          {/* Empty State */}
          {reports.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container/60 p-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FolderOpen size={32} />
              </div>
              <h2 className="mb-1 text-xl font-bold text-on-surface">
                Belum ada laporan yang diarsipkan
              </h2>
              <p className="max-w-md text-sm text-on-surface-variant">
                Pindaian buku kas yang diunggah oleh pengurus DKM akan tersusun otomatis di sini per tahun dan bulan.
              </p>
            </div>
          ) : (
            years.map((year) => {
              const yearReportsCount = [...groupedByYear.get(year)!.values()].reduce(
                (sum, arr) => sum + arr.length, 0
              );
              return (
                <section key={year} className="space-y-6">
                  {/* Year divider */}
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-primary font-sans tracking-tight shrink-0">
                      {year}
                    </h2>
                    <span className="text-xs font-semibold text-on-surface-variant/70 shrink-0">
                      ({yearReportsCount} Laporan)
                    </span>
                    <div className="h-px flex-1 bg-outline-variant" />
                  </div>

                  {/* Monthly groups */}
                  <div className="space-y-5">
                    {[...groupedByYear.get(year)!.keys()]
                      .sort((a, b) => b - a)
                      .map((month) => {
                        const monthReports = groupedByYear.get(year)!.get(month)!;

                        const monthMasuk = monthReports.reduce((sum, r) =>
                          sum + r.transactions
                            .filter(t => t.type === "pemasukan")
                            .reduce((s, t) => s + Number(t.amount), 0), 0);
                        const monthKeluar = monthReports.reduce((sum, r) =>
                          sum + r.transactions
                            .filter(t => t.type === "pengeluaran")
                            .reduce((s, t) => s + Number(t.amount), 0), 0);
                        const monthNet = monthMasuk - monthKeluar;
                        const hasFinancialData = monthMasuk > 0 || monthKeluar > 0;
                        const totalVerifiedTx = monthReports.reduce((s, r) => s + r.transactions.length, 0);

                        return (
                          <div
                            key={month}
                            className="rounded-2xl border border-outline-variant bg-surface-container/40 overflow-hidden"
                          >
                            {/* Month header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-outline-variant/60 bg-surface-container">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                  <CalendarDays size={16} />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-on-surface font-sans">
                                    {MONTH_NAMES[month]} {year}
                                  </h3>
                                  <p className="text-xs text-on-surface-variant">
                                    {monthReports.length} laporan pekan &middot; {totalVerifiedTx} transaksi terverifikasi
                                  </p>
                                </div>
                              </div>

                              {hasFinancialData && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5">
                                    <TrendingUp size={12} className="text-emerald-600 shrink-0" />
                                    <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                                      +{formatRupiah(monthMasuk)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5">
                                    <TrendingDown size={12} className="text-rose-600 shrink-0" />
                                    <span className="text-xs font-semibold text-rose-700 tabular-nums">
                                      -{formatRupiah(monthKeluar)}
                                    </span>
                                  </div>
                                  <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border ${monthNet >= 0 ? "bg-primary/5 border-primary/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                                    <span className={`text-xs font-bold tabular-nums ${monthNet >= 0 ? "text-primary" : "text-amber-700"}`}>
                                      Net {monthNet >= 0 ? "+" : ""}{formatRupiah(monthNet)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Weekly report cards */}
                            <div className="p-4 sm:p-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {monthReports.map((report) => {
                                  const thumb = report.attachments.find(a => a.fileType === "image");
                                  const verifiedCount = report.transactions.length;
                                  const reportMasuk = report.transactions
                                    .filter(t => t.type === "pemasukan")
                                    .reduce((s, t) => s + Number(t.amount), 0);
                                  const reportKeluar = report.transactions
                                    .filter(t => t.type === "pengeluaran")
                                    .reduce((s, t) => s + Number(t.amount), 0);
                                  const hasReportFinancials = reportMasuk > 0 || reportKeluar > 0;
                                  const isVerified = verifiedCount > 0;

                                  return (
                                    <Link
                                      key={report.id}
                                      href={`/laporan/${report.id}`}
                                      className="group flex flex-col rounded-xl border border-outline-variant bg-surface overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-level-2 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                    >
                                      {/* Thumbnail 16:10 */}
                                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-high">
                                        {thumb ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={thumb.fileUrl}
                                            alt={`Laporan ${report.reportDate}`}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center bg-surface-container">
                                            <FileText size={32} className="text-primary/40" />
                                          </div>
                                        )}

                                        {thumb && (
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                        )}

                                        {/* Week badge top-left */}
                                        <div className="absolute top-2 left-2">
                                          <span className="rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-on-primary shadow-xs backdrop-blur-sm">
                                            Pekan {report.weekOfMonth}
                                          </span>
                                        </div>

                                        {/* Verification badge top-right */}
                                        <div className="absolute top-2 right-2">
                                          {isVerified ? (
                                            <span className="flex items-center gap-1 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-sm">
                                              <CheckCircle2 size={9} />
                                              Terverifikasi
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1 rounded-md bg-surface-container/90 px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-variant shadow-xs backdrop-blur-sm border border-outline-variant/60">
                                              <Clock size={9} />
                                              Draft
                                            </span>
                                          )}
                                        </div>

                                        {/* Extra attachments count bottom-right */}
                                        {report.attachments.length > 1 && (
                                          <div className="absolute bottom-2 right-2">
                                            <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-sm">
                                              +{report.attachments.length - 1} berkas
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Card body */}
                                      <div className="flex flex-1 flex-col justify-between gap-2 p-3">
                                        {/* Date row */}
                                        <div className="flex items-center justify-between gap-2">
                                          <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                                            {new Date(report.reportDate).toLocaleDateString("id-ID", {
                                              weekday: "short",
                                              day: "numeric",
                                              month: "short",
                                            })}
                                          </h4>
                                          <ArrowRight
                                            size={13}
                                            className="shrink-0 text-on-surface-variant/40 transition-all group-hover:text-primary group-hover:translate-x-0.5"
                                          />
                                        </div>

                                        {/* Financial chips — single symmetrical row */}
                                        {hasReportFinancials ? (
                                          <div className="flex items-center gap-1.5 pt-1 border-t border-outline-variant/40">
                                            {reportMasuk > 0 && (
                                              <span className="flex-1 text-center rounded-md bg-emerald-500/10 border border-emerald-500/20 py-0.5 text-[11px] font-bold text-emerald-700 tabular-nums">
                                                +{formatRupiah(reportMasuk)}
                                              </span>
                                            )}
                                            {reportKeluar > 0 && (
                                              <span className="flex-1 text-center rounded-md bg-rose-500/10 border border-rose-500/20 py-0.5 text-[11px] font-bold text-rose-600 tabular-nums">
                                                -{formatRupiah(reportKeluar)}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="pt-1 border-t border-outline-variant/40">
                                            <span className="text-[10px] text-on-surface-variant/50 italic">Belum ada data</span>
                                          </div>
                                        )}
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </PageShell>
    </AppShell>
  );
}
