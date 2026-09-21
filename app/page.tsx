import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FolderOpen, ArrowRight, FileText } from "lucide-react";

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
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Arsip Laporan</h1>
          <p className="text-muted-foreground">
            Telusuri pindaian buku kas dan laporan keuangan.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-white/20 bg-card/60 p-12 text-center shadow-lg backdrop-blur-xl">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 shadow-inner">
            <FolderOpen className="text-primary" size={48} />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            Belum ada laporan yang diarsipkan
          </h2>
          <p className="max-w-md text-muted-foreground">
            Laporan yang kamu unggah akan muncul di sini, tersusun otomatis per tahun dan bulan.
          </p>
        </div>
      ) : (
        years.map((year) => (
          <section key={year} className="mb-8">
            <div className="mb-4 flex items-center gap-4">
              <h2 className="text-2xl font-bold text-primary">{year}</h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            {[...groupedByYear.get(year)!.keys()]
              .sort((a, b) => b - a)
              .map((month) => {
                const monthReports = groupedByYear.get(year)!.get(month)!;
                return (
                  <details key={month} open className="mb-4 rounded-2xl border bg-card">
                    <summary className="flex cursor-pointer items-center gap-3 p-4 font-semibold">
                      {MONTH_NAMES[month]}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({monthReports.length} Laporan)
                      </span>
                    </summary>
                    <div className="grid grid-cols-1 gap-4 border-t p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {monthReports.map((report) => (
                        <div
                          key={report.id}
                          className="group flex flex-col rounded-3xl border border-white/40 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:bg-card/90 hover:shadow-xl hover:shadow-primary/10"
                        >
                          {(() => {
                            const thumb = report.attachments.find((a) => a.fileType === "image");
                            return thumb ? (
                              <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-2xl">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={thumb.fileUrl}
                                  alt={`Laporan ${report.reportDate}`}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div className="mb-4 flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100/50 to-teal-50 text-primary/40 transition-colors duration-300 group-hover:from-emerald-100 group-hover:to-teal-100">
                                <FileText size={48} className="drop-shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:text-primary/60" />
                              </div>
                            );
                          })()}
                          <h3 className="mb-1 font-bold text-foreground">
                            {new Date(report.reportDate).toLocaleDateString("id-ID", {
                              weekday: "long",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </h3>
                          <p className="mb-5 text-sm font-medium text-muted-foreground">
                            Minggu ke-{report.weekOfMonth}
                          </p>
                          <Link href={`/laporan/${report.id}`} className="mt-auto flex items-center justify-center gap-1 rounded-xl border border-white/40 bg-white/50 py-2.5 text-sm font-bold transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-md">
                            Lihat Detail <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
          </section>
        ))
      )}
    </AppShell>
  );
}