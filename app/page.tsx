import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { Calendar, FolderOpen, ArrowRight } from "lucide-react";

const MONTH_NAMES = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default async function ArsipLaporanPage() {
  const reports = await prisma.report.findMany({
    orderBy: { reportDate: "desc" },
    include: { uploadedBy: true },
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
        <div className="flex flex-col items-center rounded-2xl border bg-card p-12 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <FolderOpen className="text-primary" size={40} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">
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
                          className="flex flex-col rounded-xl border bg-background p-4"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={report.photoUrl}
                              alt={`Laporan ${report.reportDate}`}
                              className="mb-3 aspect-[4/3] w-full rounded-lg object-cover"
                            />
                          <h3 className="mb-1 font-medium text-foreground">
                            {new Date(report.reportDate).toLocaleDateString("id-ID", {
                              weekday: "long",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </h3>
                          <p className="mb-4 text-sm text-muted-foreground">
                            Minggu ke-{report.weekOfMonth}
                          </p>
                          <button className="mt-auto flex items-center justify-center gap-1 rounded-lg border py-2 text-sm font-medium hover:bg-accent">
                            Lihat Detail <ArrowRight size={16} />
                          </button>
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