import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FolderOpen, FileText } from "lucide-react";

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
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">Arsip Laporan</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Telusuri pindaian buku kas dan laporan keuangan kas masjid per periode.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-outline-variant bg-surface-container p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FolderOpen size={32} />
            </div>
            <h2 className="mb-1 text-xl font-bold text-on-surface">
              Belum ada laporan yang diarsipkan
            </h2>
            <p className="max-w-md text-sm text-on-surface-variant">
              Laporan yang kamu unggah akan muncul di sini, tersusun otomatis per tahun dan bulan.
            </p>
          </div>
        ) : (
          years.map((year) => (
            <section key={year} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-primary">{year}</h2>
                <div className="h-px flex-1 bg-outline-variant" />
              </div>

              {[...groupedByYear.get(year)!.keys()]
                .sort((a, b) => b - a)
                .map((month) => {
                  const monthReports = groupedByYear.get(year)!.get(month)!;
                  return (
                    <div key={month} className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-base font-semibold text-on-surface">
                          {MONTH_NAMES[month]}
                        </h3>
                        <span className="text-xs text-on-surface-variant">
                          ({monthReports.length} Laporan)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                        {monthReports.map((report) => {
                          const thumb = report.attachments.find((a) => a.fileType === "image");
                          return (
                            <Link
                              key={report.id}
                              href={`/laporan/${report.id}`}
                              className="group flex flex-col focus:outline-hidden"
                            >
                              {/* Visual Unit: Photo container with 3:4 aspect ratio and rounded-xl (Extra large token) */}
                              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-high transition-transform duration-200 group-hover:scale-[1.02]">
                                {thumb ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={thumb.fileUrl}
                                    alt={`Laporan ${report.reportDate}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-primary/40">
                                    <FileText size={36} className="text-primary/60" />
                                  </div>
                                )}
                              </div>

                              {/* Caption directly under the photo, no separate card box */}
                              <div className="mt-2 space-y-0.5">
                                <h4 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                                  {new Date(report.reportDate).toLocaleDateString("id-ID", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </h4>
                                <p className="text-xs text-on-surface-variant">
                                  Minggu ke-{report.weekOfMonth}
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
          ))
        )}
        </div>
      </PageShell>
    </AppShell>
  );
}