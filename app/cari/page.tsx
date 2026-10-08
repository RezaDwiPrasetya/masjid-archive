import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileSearch, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cari Arsip Laporan",
  description: "Cari dan telusuri arsip laporan keuangan kas mingguan DKM Masjid Al-Luqman.",
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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
        select: { verifiedAt: true },
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
    ? sortedReports.filter((report) =>
        `${new Date(report.reportDate).toLocaleDateString("id-ID")} ${report.uploadedBy.name}`
          .toLowerCase()
          .includes(keyword.toLowerCase())
      )
    : sortedReports;

  return (
    <AppShell active="/cari">
      <PageShell>
        <div className="space-y-6">
          <div className="border-b border-outline-variant pb-5">
            <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">
              Cari Arsip
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Telusuri berkas pindaian laporan kas berdasarkan kata kunci nama pengurus, tanggal, atau periode.
            </p>
          </div>

          <form className="grid gap-4 rounded-xl border border-outline-variant bg-surface-container p-5 sm:p-6 shadow-level-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_140px_140px_220px_auto] lg:items-end">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {filteredReports.map((report) => {
                  const thumb = report.attachments.find((a) => a.fileType === "image");
                  const lastActive = getReportLastActivity(report);
                  return (
                    <Link
                      key={report.id}
                      href={`/laporan/${report.id}`}
                      className="group flex flex-col focus:outline-hidden"
                    >
                      {/* Visual Unit: Photo container with 3:4 aspect ratio */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-high transition-all duration-200 group-hover:scale-[1.02] group-hover:border-primary/50 group-hover:shadow-level-2">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb.fileUrl}
                            alt={`Laporan ${report.reportDate}`}
                            className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-95"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary/40 bg-surface-container">
                            <FileText size={36} className="text-primary/60" />
                          </div>
                        )}

                        <div className="absolute top-2 right-2">
                          <span className="rounded-md bg-surface-container/90 px-1.5 py-0.5 text-[10px] font-semibold text-on-surface border border-outline-variant/60 shadow-xs backdrop-blur-xs">
                            Pekan {report.weekOfMonth}
                          </span>
                        </div>
                      </div>

                      {/* Caption directly under photo */}
                      <div className="mt-2 space-y-0.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                          {new Date(report.reportDate).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          Oleh: {report.uploadedBy.name}
                        </p>
                        <p className="text-[10px] text-on-surface-variant/70 truncate">
                          Aktivitas:{" "}
                          {new Date(lastActive).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
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