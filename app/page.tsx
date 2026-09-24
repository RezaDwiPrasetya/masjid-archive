import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FolderOpen, FileText, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default async function ArsipLaporanPage() {
  const reports = await prisma.report.findMany({
    orderBy: { reportDate: "desc" },
    include: { uploadedBy: true, attachments: true },
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
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end border-b border-outline-variant pb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">
                  Arsip Laporan
                </h1>
                <Badge variant="secondary" size="sm">
                  {reports.length} Laporan
                </Badge>
              </div>
              <p className="text-sm text-on-surface-variant max-w-xl">
                Dokumentasi pindaian buku kas fisik dan laporan berkala DKM per periode mingguan & bulanan.
              </p>
            </div>

            {years.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <CalendarDays size={14} className="text-primary" />
                <span>Periode:</span>
                <span className="font-semibold text-on-surface">
                  {years[years.length - 1]} – {years[0]}
                </span>
              </div>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container/60 p-12 text-center">
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
                (sum, arr) => sum + arr.length,
                0
              );

              return (
                <section key={year} className="space-y-6">
                  {/* Year Header Divider */}
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-primary font-sans tracking-tight">
                      {year}
                    </h2>
                    <span className="text-xs font-semibold text-on-surface-variant/80">
                      ({yearReportsCount} Laporan)
                    </span>
                    <div className="h-px flex-1 bg-outline-variant" />
                  </div>

                  {[...groupedByYear.get(year)!.keys()]
                    .sort((a, b) => b - a)
                    .map((month) => {
                      const monthReports = groupedByYear.get(year)!.get(month)!;
                      return (
                        <div key={month} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                            <h3 className="text-sm font-semibold text-on-surface">
                              {MONTH_NAMES[month]}
                            </h3>
                            <span className="text-xs text-on-surface-variant">
                              • {monthReports.length} Berkas
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                            {monthReports.map((report) => {
                              const thumb = report.attachments.find(
                                (a) => a.fileType === "image"
                              );
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

                                    {/* Week Badge Overlay */}
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
                      );
                    })}
                </section>
              );
            })
          )}
        </div>
      </PageShell>
    </AppShell>
  );
}