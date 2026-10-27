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

  // Hitung akumulasi keuangan dari dokumen yang terfilter
  let totalMasukSemua = 0;
  let totalKeluarSemua = 0;
  let totalTxTerverifikasi = 0;

  for (const r of filteredReports) {
    for (const t of r.transactions) {
      if (t.isVerified) {
        totalTxTerverifikasi++;
        if (t.type === "pemasukan") {
          totalMasukSemua += Number(t.amount);
        } else if (t.type === "pengeluaran") {
          totalKeluarSemua += Number(t.amount);
        }
      }
    }
  }

  return (
    <AppShell active="/cari">
      <PageShell>
        <div className="space-y-6 sm:space-y-8">
          {/* UNIFIED HERO HEADER CARD (F-039) */}
          <div className="rounded-3xl bg-[#0e3824] text-white p-6 sm:p-8 lg:p-9 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5 sm:space-y-6">
              {/* Baris Atas: Judul Halaman & Subjudul Deskriptif */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Pencarian Arsip Laporan
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
                    {keyword || year || month
                      ? `Hasil pencarian berkas arsip kas dari total ${reports.length} pindaian tersimpan.`
                      : `Seluruh pindaian pembukuan kas mingguan tersedia lintas ${years.length} tahun pembukuan.`}
                  </p>
                </div>
              </div>

              {/* Garis Pemisah Halus */}
              <div className="border-t border-white/10" />

              {/* Baris Bawah: Grid Total Dokumen & Agregat Finansial */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                <div className="xl:col-span-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                    <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <FileSearch size={14} />
                    </div>
                    <span>Total Arsip Ditemukan</span>
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-white tabular-nums leading-tight font-sans">
                    {filteredReports.length} Dokumen
                  </div>
                  <div className="text-xs text-emerald-100/80">
                    {keyword ? `Pencarian kata kunci "${keyword}"` : "Pindaian kas mingguan & warta terverifikasi"}
                  </div>
                </div>

                <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#144731]/80 border border-emerald-400/20 backdrop-blur-sm flex flex-col justify-between">
                    <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider leading-tight">
                      Total Pemasukan Kas
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-emerald-300 tabular-nums mt-1">
                      {formatRupiah(totalMasukSemua)}
                    </div>
                    <div className="text-xs text-emerald-300/80 mt-0.5">
                      Dari {filteredReports.length} berkas terfilter
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#144731]/80 border border-emerald-400/20 backdrop-blur-sm flex flex-col justify-between">
                    <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider leading-tight">
                      Total Pengeluaran Kas
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-rose-300 tabular-nums mt-1">
                      {formatRupiah(totalKeluarSemua)}
                    </div>
                    <div className="text-xs text-emerald-300/80 mt-0.5">
                      {totalTxTerverifikasi} transaksi terverifikasi
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <form className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-12 gap-3 sm:gap-4 items-end">
              <div className="sm:col-span-2 md:col-span-3 xl:col-span-4">
                <label htmlFor="keyword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kata Kunci
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    id="keyword"
                    name="keyword"
                    defaultValue={keyword}
                    placeholder="Nama pengurus, tanggal, atau pekan..."
                    className="pl-9.5 rounded-xl border border-slate-200 bg-white h-10 text-sm text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div className="sm:col-span-1 md:col-span-1 xl:col-span-2">
                <label htmlFor="year" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tahun
                </label>
                <select
                  id="year"
                  name="year"
                  defaultValue={year}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
                >
                  <option value="">Semua tahun</option>
                  {years.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 md:col-span-1 xl:col-span-2">
                <label htmlFor="month" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Bulan
                </label>
                <select
                  id="month"
                  name="month"
                  defaultValue={month}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
                >
                  <option value="">Semua bulan</option>
                  {MONTH_NAMES.map((item, index) => (
                    <option key={item} value={index + 1}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 md:col-span-2 xl:col-span-3">
                <label htmlFor="sort" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Urutkan
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sort}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
                >
                  <option value="terbaru_aktivitas">Terakhir Diubah / Ditambahkan</option>
                  <option value="tanggal_desc">Tanggal Laporan (Terbaru)</option>
                  <option value="tanggal_asc">Tanggal Laporan (Terlama)</option>
                </select>
              </div>

              <div className="sm:col-span-1 md:col-span-1 xl:col-span-1">
                <Button type="submit" variant="default" className="h-10 w-full px-4 gap-2 rounded-xl bg-[#0e3824] hover:bg-[#144731] text-white text-xs font-bold shadow-xs transition-colors">
                  <Search size={15} />
                  <span>Cari</span>
                </Button>
              </div>
            </div>
          </form>

          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <FileSearch size={28} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-sans">
                Laporan tidak ditemukan
              </h2>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Tidak ada dokumen arsip yang cocok dengan kata kunci atau filter periode yang Anda pilih.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ditemukan {filteredReports.length} Laporan
                </span>
                <span className="text-xs text-slate-500 font-medium">
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
                      <h2 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight shrink-0">
                        {yr}
                      </h2>
                      <span className="text-xs font-semibold text-slate-500 shrink-0">
                        ({yearReportsCount} Laporan)
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
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
                              className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs"
                            >
                              {/* Month Header with Financial Info at the Top */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/70">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                    <CalendarDays size={16} />
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-bold text-slate-900 font-sans">
                                      {MONTH_NAMES[mo - 1] ?? mo} {yr}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                      {monthReports.length} laporan pekan &middot; {totalVerifiedTx} transaksi terverifikasi
                                    </p>
                                  </div>
                                </div>

                                {hasFinancialData && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                                      <TrendingUp size={12} className="text-emerald-700 shrink-0" />
                                      <span className="text-xs font-bold text-emerald-800 tabular-nums">
                                        +{formatRupiah(monthMasuk)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1">
                                      <TrendingDown size={12} className="text-rose-600 shrink-0" />
                                      <span className="text-xs font-bold text-rose-700 tabular-nums">
                                        -{formatRupiah(monthKeluar)}
                                      </span>
                                    </div>
                                    <div
                                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 border ${
                                        monthNet >= 0
                                          ? "bg-emerald-50 border-emerald-300"
                                          : "bg-rose-50 border-rose-300"
                                      }`}
                                    >
                                      <span
                                        className={`text-xs font-bold tabular-nums ${
                                          monthNet >= 0
                                            ? "text-emerald-800"
                                            : "text-rose-800"
                                        }`}
                                      >
                                        Net {monthNet >= 0 ? "+" : ""}
                                        {formatRupiah(monthNet)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Weekly report cards: Responsif 2 kolom pada laptop hingga 4 kolom pada layar lebar */}
                              <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                  {monthReports
                                    .slice()
                                    .sort((a, b) => {
                                      if (sort === "tanggal_desc") {
                                        return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
                                      }
                                      return new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime();
                                    })
                                    .map((report) => {
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
                                        className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 hover:border-emerald-600/50 hover:shadow-2xs hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
                                      >
                                        {/* Thumbnail 16:10 */}
                                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                                          {thumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={thumb.fileUrl}
                                              alt={`Laporan ${report.reportDate}`}
                                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-slate-50">
                                              <FileText size={28} className="text-slate-300" />
                                            </div>
                                          )}

                                          {thumb && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                          )}

                                          {/* Week badge top-left */}
                                          <div className="absolute top-2 left-2">
                                            <span className="rounded-md bg-[#0e3824]/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-sm">
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
                                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 leading-snug">
                                                {dateFormatted}
                                              </h4>
                                              <ArrowRight
                                                size={13}
                                                className="shrink-0 text-slate-400 transition-all group-hover:text-emerald-800 group-hover:translate-x-0.5"
                                              />
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                              Oleh: {report.uploadedBy.name}
                                            </p>
                                          </div>

                                          {/* Financial chips — rapi tanpa truncate angka */}
                                          {hasReportFinancials ? (
                                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
                                              {reportMasuk > 0 && (
                                                <span className="flex-1 min-w-[70px] text-center rounded-md bg-emerald-50 border border-emerald-200 py-0.5 px-1 text-[10.5px] sm:text-[11px] font-bold text-emerald-800 tabular-nums">
                                                  +{formatRupiah(reportMasuk)}
                                                </span>
                                              )}
                                              {reportKeluar > 0 && (
                                                <span className="flex-1 min-w-[70px] text-center rounded-md bg-rose-50 border border-rose-200 py-0.5 px-1 text-[10.5px] sm:text-[11px] font-bold text-rose-700 tabular-nums">
                                                  -{formatRupiah(reportKeluar)}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="pt-1.5 border-t border-slate-100">
                                              <span className="text-[10px] text-slate-400 italic">
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