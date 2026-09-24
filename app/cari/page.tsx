import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileSearch, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
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
  const reports = await prisma.report.findMany({
    where: {
      ...(year ? { year: Number(year) } : {}),
      ...(month ? { month: Number(month) } : {}),
    },
    orderBy: { reportDate: "desc" },
    include: { uploadedBy: true, attachments: true },
  });
  const filteredReports = keyword
    ? reports.filter((report) =>
        `${new Date(report.reportDate).toLocaleDateString("id-ID")} ${report.uploadedBy.name}`
          .toLowerCase()
          .includes(keyword.toLowerCase())
      )
    : reports;
  const years = [...new Set(reports.map((report) => report.year))].sort((a, b) => b - a);

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

          <form className="grid gap-4 rounded-xl border border-outline-variant bg-surface-container p-5 sm:p-6 shadow-level-1 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
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
            <Button type="submit" variant="default" className="h-9 gap-2">
              <Search size={15} /> Cari Laporan
            </Button>
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
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {filteredReports.map((report) => {
                  const thumb = report.attachments.find((a) => a.fileType === "image");
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