import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileSearch,
  FileText,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  Clock,
  Paperclip,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cari Arsip Laporan",
  description: "Cari dan telusuri arsip laporan keuangan kas mingguan DKM Masjid Al-Luqman.",
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getReportLastActivity(report: {
  uploadedAt: Date;
  attachments: { uploadedAt: Date; extractedAt: Date | null }[];
  transactions: { verifiedAt: Date | null }[];
}): number {
  let latest = new Date(report.uploadedAt).getTime();

  for (const att of report.attachments) {
    if (att.uploadedAt) {
      const t = new Date(att.uploadedAt).getTime();
      if (t > latest) latest = t;
    }
    if (att.extractedAt) {
      const t = new Date(att.extractedAt).getTime();
      if (t > latest) latest = t;
    }
  }

  for (const tx of report.transactions) {
    if (tx.verifiedAt) {
      const t = new Date(tx.verifiedAt).getTime();
      if (t > latest) latest = t;
    }
  }

  return latest;
}

export default async function CariLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const keyword = valueOf(query.keyword);
  const year = valueOf(query.year);
  const month = valueOf(query.month);
  const sort = valueOf(query.sort) || "terbaru_aktivitas";

  // Ambil daftar tahun lengkap secara distinct
  const distinctYears = await prisma.report.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  const years = distinctYears.map((r) => r.year);

  const reports = await prisma.report.findMany({
    where: {
      ...(year ? { year: Number(year) } : {}),
      ...(month ? { month: Number(month) } : {}),
    },
    select: {
      id: true,
      reportDate: true,
      year: true,
      month: true,
      weekOfMonth: true,
      uploadedAt: true,
      uploadedBy: {
        select: {
          name: true,
        },
      },
      attachments: {
        select: {
          id: true,
          fileType: true,
          fileUrl: true,
          uploadedAt: true,
          extractedAt: true,
        },
      },
      transactions: {
        select: {
          id: true,
          type: true,
          amount: true,
          isVerified: true,
          verifiedAt: true,
        },
      },
    },
  });

  // Urutkan laporan sesuai opsi yang dipilih (default: terbaru_aktivitas)
  const sortedReports = [...reports].sort((a, b) => {
    if (sort === "tanggal_asc") {
      return new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime();
    }
    if (sort === "tanggal_desc") {
      return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
    }
    // Default: "terbaru_aktivitas" (Paling baru diubah atau ditambahkan)
    return getReportLastActivity(b) - getReportLastActivity(a);
  });

  const filteredReports = keyword
    ? sortedReports.filter((report) => {
        const monthName = MONTH_NAMES[report.month - 1] ?? "";
        const searchTarget = `${new Date(report.reportDate).toLocaleDateString("id-ID")} ${monthName} pekan ${report.weekOfMonth ?? ""} ${report.uploadedBy.name ?? ""}`.toLowerCase();
        return searchTarget.includes(keyword.toLowerCase());
      })
    : sortedReports;

  // Kelompokkan hasil pencarian berdasarkan Tahun dan Bulan
  const groupedByYear = new Map<number, Map<number, typeof filteredReports>>();
  for (const report of filteredReports) {
    if (!groupedByYear.has(report.year)) {
      groupedByYear.set(report.year, new Map());
    }
    const yearGroup = groupedByYear.get(report.year)!;
    if (!yearGroup.has(report.month)) {
      yearGroup.set(report.month, []);
    }
    yearGroup.get(report.month)!.push(report);
  }

  const yearsWithReports = [...groupedByYear.keys()].sort((a, b) =>
    sort === "tanggal_asc" ? a - b : b - a
  );

  return (
    <AppShell active="/cari">
      <PageShell>
        <div className="space-y-6 sm:space-y-8">
          {/* HEADER ATAS DI KANVAS TERANG */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <FileSearch className="h-3.5 w-3.5 text-emerald-800" />
                <span>Pencarian Arsip Kas & Warta Jum&apos;at • DKM Masjid Al-Luqman</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Pencarian Arsip Laporan
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {keyword || year || month
                  ? `Hasil pencarian berkas arsip kas dari total ${reports.length} pindaian tersimpan.`
                  : `Seluruh pindaian pembukuan kas mingguan tersedia lintas ${years.length} tahun pembukuan.`}
              </p>
            </div>
          </div>

          {/* HERO CARD MELAYANG */}
          <div className="rounded-3xl bg-[#0e3824] text-white p-6 sm:p-8 lg:p-9 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                  <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <FileSearch size={16} />
                  </div>
                  <span>Total Dokumen Ditemukan</span>
                </div>
                <div className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white tabular-nums leading-none font-sans">
                  {filteredReports.length} Dokumen
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/80">
                  {keyword ? `Pencarian untuk kata kunci "${keyword}"` : "Semua berkas laporan fisik terarsip"}
                </p>
              </div>
            </div>
          </div>
          <form className="grid gap-4 rounded-2xl border border-outline-variant bg-surface p-5 sm:p-6 shadow-xs grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_140px_140px_220px_auto] lg:items-end">
            <div>
              <label htmlFor="keyword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Kata Kunci
              </label>
              <Input
                id="keyword"
                name="keyword"
                defaultValue={keyword}
                placeholder="Nama pengurus atau tanggal..."
                className="bg-surface border-outline-variant h-9 text-sm"
              />
            </div>
            <div>
              <label htmlFor="year" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Tahun
              </label>
              <select
                id="year"
                name="year"
                defaultValue={year}
                className="h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Semua tahun</option>
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="month" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Bulan
              </label>
              <select
                id="month"
                name="month"
                defaultValue={month}
                className="h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Semua bulan</option>
                {MONTH_NAMES.map((item, index) => (
                  <option key={item} value={index + 1}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Urutkan
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort}
                className="h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 font-medium"
              >
                <option value="terbaru_aktivitas">Terakhir Diubah / Ditambahkan</option>
                <option value="tanggal_desc">Tanggal Laporan (Terbaru)</option>
                <option value="tanggal_asc">Tanggal Laporan (Terlama)</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <Button type="submit" variant="default" className="h-9 w-full lg:w-auto gap-2">
                <Search size={15} /> Cari
              </Button>
            </div>
          </form>

          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container/60 p-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileSearch size={28} />
              </div>
              <h2 className="text-lg font-bold text-on-surface font-sans">
                Laporan tidak ditemukan
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant max-w-sm">
                Tidak ada dokumen arsip yang cocok dengan kata kunci atau filter periode yang Anda pilih.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Ditemukan {filteredReports.length} Laporan
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {sort === "terbaru_aktivitas" && "Diurutkan: Terakhir Diubah / Ditambahkan"}
                  {sort === "tanggal_desc" && "Diurutkan: Tanggal Dokumen Terbaru"}
                  {sort === "tanggal_asc" && "Diurutkan: Tanggal Dokumen Terlama"}
                </span>
              </div>

              {yearsWithReports.map((yr) => {
                const yearReportsCount = [...groupedByYear.get(yr)!.values()].reduce(
                  (sum, arr) => sum + arr.length,
                  0
                );

                return (
                  <section key={yr} className="space-y-6">
                    {/* Year divider */}
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-primary font-sans tracking-tight shrink-0">
                        {yr}
                      </h2>
                      <span className="text-xs font-semibold text-on-surface-variant/70 shrink-0">
                        ({yearReportsCount} Laporan)
                      </span>
                      <div className="h-px flex-1 bg-outline-variant" />
                    </div>

                    {/* Monthly groups */}
                    <div className="space-y-5">
                      {[...groupedByYear.get(yr)!.keys()]
                        .sort((a, b) => (sort === "tanggal_asc" ? a - b : b - a))
                        .map((mo) => {
                          const monthReports = groupedByYear.get(yr)!.get(mo)!;

                          const monthMasuk = monthReports.reduce(
                            (sum, r) =>
                              sum +
                              r.transactions
                                .filter((t) => t.type === "pemasukan")
                                .reduce((s, t) => s + Number(t.amount), 0),
                            0
                          );
                          const monthKeluar = monthReports.reduce(
                            (sum, r) =>
                              sum +
                              r.transactions
                                .filter((t) => t.type === "pengeluaran")
                                .reduce((s, t) => s + Number(t.amount), 0),
                            0
                          );
                          const monthNet = monthMasuk - monthKeluar;
                          const hasFinancialData = monthMasuk > 0 || monthKeluar > 0;
                          const totalVerifiedTx = monthReports.reduce(
                            (s, r) => s + r.transactions.filter((t) => t.isVerified).length,
                            0
                          );

                          return (
                            <div
                              key={mo}
                              className="rounded-2xl border border-outline-variant bg-surface-container/40 overflow-hidden shadow-xs"
                            >
                              {/* Month Header with Financial Info at the Top */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-outline-variant/60 bg-surface-container">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <CalendarDays size={16} />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-bold text-on-surface font-sans">
                                      {MONTH_NAMES[mo - 1] ?? mo} {yr}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant">
                                      {monthReports.length} laporan pekan &middot; {totalVerifiedTx} transaksi terverifikasi
                                    </p>
                                  </div>
                                </div>

                                {hasFinancialData && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5">
                                      <TrendingUp size={12} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 tabular-nums">
                                        +{formatRupiah(monthMasuk)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5">
                                      <TrendingDown size={12} className="text-rose-700 dark:text-rose-400 shrink-0" />
                                      <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 tabular-nums">
                                        -{formatRupiah(monthKeluar)}
                                      </span>
                                    </div>
                                    <div
                                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border ${
                                        monthNet >= 0
                                          ? "bg-emerald-600/10 border-emerald-600/20"
                                          : "bg-rose-500/10 border-rose-500/20"
                                      }`}
                                    >
                                      <span
                                        className={`text-xs font-bold tabular-nums ${
                                          monthNet >= 0
                                            ? "text-emerald-800 dark:text-emerald-300"
                                            : "text-rose-800 dark:text-rose-300"
                                        }`}
                                      >
                                        Net {monthNet >= 0 ? "+" : ""}
                                        {formatRupiah(monthNet)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Weekly report cards: 4 to 5 cards per row */}
                              <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                                  {monthReports.map((report) => {
                                    const thumb = report.attachments.find((a) => a.fileType === "image");
                                    const verifiedCount = report.transactions.filter((t) => t.isVerified).length;
                                    const reportMasuk = report.transactions
                                      .filter((t) => t.type === "pemasukan")
                                      .reduce((s, t) => s + Number(t.amount), 0);
                                    const reportKeluar = report.transactions
                                      .filter((t) => t.type === "pengeluaran")
                                      .reduce((s, t) => s + Number(t.amount), 0);
                                    const hasReportFinancials = reportMasuk > 0 || reportKeluar > 0;
                                    const isVerified =
                                      report.transactions.length > 0 && verifiedCount === report.transactions.length;

                                    const repDate = new Date(report.reportDate);
                                    const dateFormatted = repDate.toLocaleDateString("id-ID", {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "short",
                                    });

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
                                              <FileText size={28} className="text-primary/40" />
                                            </div>
                                          )}

                                          {thumb && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                          )}

                                          {/* Week badge top-left */}
                                          <div className="absolute top-2 left-2">
                                            <span className="rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-on-primary shadow-xs backdrop-blur-sm">
                                              Pekan {report.weekOfMonth}
                                            </span>
                                          </div>

                                          {/* Verification badge top-right */}
                                          <div className="absolute top-2 right-2">
                                            {report.transactions.length === 0 ? (
                                              <span className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200 shadow-xs backdrop-blur-sm">
                                                Belum Ekstrak
                                              </span>
                                            ) : isVerified ? (
                                              <span className="flex items-center gap-1 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-sm">
                                                <CheckCircle2 size={10} />
                                                Terverifikasi
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1 rounded-md bg-amber-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-sm">
                                                <Clock size={10} />
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
                                        <div className="flex flex-1 flex-col justify-between gap-1.5 p-3">
                                          <div>
                                            <div className="flex items-center justify-between gap-1.5">
                                              <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                                                {dateFormatted}
                                              </h4>
                                              <ArrowRight
                                                size={13}
                                                className="shrink-0 text-on-surface-variant/40 transition-all group-hover:text-primary group-hover:translate-x-0.5"
                                              />
                                            </div>
                                            <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                                              Oleh: {report.uploadedBy.name}
                                            </p>
                                          </div>

                                          {/* Financial chips — single symmetrical row */}
                                          {hasReportFinancials ? (
                                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-outline-variant/40">
                                              {reportMasuk > 0 && (
                                                <span className="flex-1 text-center rounded-md bg-emerald-500/10 border border-emerald-500/20 py-0.5 px-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 tabular-nums truncate">
                                                  +{formatRupiah(reportMasuk)}
                                                </span>
                                              )}
                                              {reportKeluar > 0 && (
                                                <span className="flex-1 text-center rounded-md bg-rose-500/10 border border-rose-500/20 py-0.5 px-1 text-[11px] font-bold text-rose-600 dark:text-rose-300 tabular-nums truncate">
                                                  -{formatRupiah(reportKeluar)}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="pt-1.5 border-t border-outline-variant/40">
                                              <span className="text-[10px] text-on-surface-variant/50 italic">
                                                Belum ada mutasi
                                              </span>
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
              })}
            </div>
          )}
        </div>
      </PageShell>
    </AppShell>
  );
}