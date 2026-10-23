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
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredReports.map((report) => {
                  const thumb = report.attachments.find((a) => a.fileType === "image");

                  // Hitung ringkasan keuangan
                  const totalMasuk = report.transactions
                    .filter((t) => t.type === "pemasukan")
                    .reduce((s, t) => s + Number(t.amount), 0);
                  const totalKeluar = report.transactions
                    .filter((t) => t.type === "pengeluaran")
                    .reduce((s, t) => s + Number(t.amount), 0);
                  const netChange = totalMasuk - totalKeluar;

                  const verifiedCount = report.transactions.filter((t) => t.isVerified).length;
                  const unverifiedCount = report.transactions.length - verifiedCount;
                  const isAllVerified = report.transactions.length > 0 && unverifiedCount === 0;

                  const repDate = new Date(report.reportDate);
                  const dateFormatted = repDate.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <Link
                      key={report.id}
                      href={`/laporan/${report.id}`}
                      className="group flex flex-col justify-between rounded-2xl border border-outline-variant bg-surface-container/40 hover:bg-surface-container transition-all duration-200 hover:border-primary/50 hover:shadow-md overflow-hidden p-4 sm:p-5 space-y-4 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      {/* Visual Unit: Photo/Doc container with 16:10 aspect ratio */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-high">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb.fileUrl}
                            alt={`Laporan Kas ${dateFormatted}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-surface-container text-on-surface-variant/60 gap-1.5 p-4 text-center">
                            <FileText size={32} className="text-primary/70" />
                            <span className="text-xs font-medium">Berkas Fisik Laporan</span>
                          </div>
                        )}

                        {/* Overlay Badge Pekan & Periode */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white border border-white/10 shadow-xs backdrop-blur-md">
                            Pekan {report.weekOfMonth ?? 1}
                          </span>
                        </div>

                        {/* Overlay Status Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          {report.transactions.length === 0 ? (
                            <span className="rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 border border-white/10 shadow-xs backdrop-blur-md flex items-center gap-1.5">
                              <FileText size={12} />
                              <span>Belum Diekstrak</span>
                            </span>
                          ) : isAllVerified ? (
                            <span className="rounded-lg bg-emerald-900/85 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 border border-emerald-500/20 shadow-xs backdrop-blur-md flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-300" />
                              <span>Terverifikasi</span>
                            </span>
                          ) : (
                            <span className="rounded-lg bg-amber-900/85 px-2.5 py-1 text-[11px] font-semibold text-amber-100 border border-amber-400/20 shadow-xs backdrop-blur-md flex items-center gap-1.5">
                              <Clock size={12} className="text-amber-300" />
                              <span>{unverifiedCount} Menunggu Verifikasi</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Header Informasi Periode & Tanggal */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">
                          <CalendarDays size={12} />
                          <span>
                            {MONTH_NAMES[report.month - 1] ?? ""} {report.year} &bull; Pekan {report.weekOfMonth ?? 1}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                          {dateFormatted}
                        </h4>
                        <p className="text-xs text-on-surface-variant truncate">
                          Diunggah oleh: <span className="font-semibold text-on-surface">{report.uploadedBy.name}</span>
                        </p>
                      </div>

                      {/* Mini Financial Breakdown Grid */}
                      {report.transactions.length > 0 ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 p-2.5 sm:p-3 rounded-xl bg-surface border border-outline-variant/70 shadow-xs">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                <ArrowDownLeft size={13} className="text-emerald-700 shrink-0" />
                                <span>Pemasukan</span>
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100 tabular-nums truncate">
                                +{formatRupiah(totalMasuk)}
                              </div>
                            </div>
                            <div className="space-y-0.5 border-l border-outline-variant/70 pl-2.5 sm:pl-3 min-w-0">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                                <ArrowUpRight size={13} className="text-rose-700 shrink-0" />
                                <span>Pengeluaran</span>
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100 tabular-nums truncate">
                                -{formatRupiah(totalKeluar)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs px-1 text-on-surface-variant">
                            <span className="flex items-center gap-1">
                              <span>Arus Kas:</span>
                              <strong
                                className={`font-bold tabular-nums ${
                                  netChange >= 0
                                    ? "text-emerald-800 dark:text-emerald-300"
                                    : "text-rose-800 dark:text-rose-300"
                                }`}
                              >
                                {netChange >= 0 ? "+" : ""}
                                {formatRupiah(netChange)}
                              </strong>
                            </span>
                            <span className="text-[11px] font-medium text-on-surface-variant">
                              {report.transactions.length} mutasi kas
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-surface border border-dashed border-outline-variant/80 text-center space-y-1">
                          <p className="text-xs font-semibold text-on-surface">Data Mutasi Belum Diekstrak</p>
                          <p className="text-[11px] text-on-surface-variant">
                            Buka detail laporan untuk menjalankan ekstraksi AI
                          </p>
                        </div>
                      )}

                      {/* Footer Card */}
                      <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <Paperclip size={12} className="text-on-surface-variant/70" />
                          <span>{report.attachments.length} berkas fisik</span>
                        </span>
                        <span className="font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                          <span>Detail Laporan</span>
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PageShell>
    </AppShell>
  );
}