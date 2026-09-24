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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Cari Arsip</h1>
          <p className="text-muted-foreground">Temukan laporan berdasarkan tanggal atau pengurus.</p>
        </div>

      <form className="mb-8 grid gap-4 rounded-xl border border-outline-variant bg-surface-container p-6 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
        <div>
          <label htmlFor="keyword" className="mb-2 block text-sm font-medium text-on-surface">Kata kunci</label>
          <Input id="keyword" name="keyword" defaultValue={keyword} placeholder="Contoh: Kosasih atau 12/1/2025" className="border-outline-variant bg-surface-container" />
        </div>
        <div>
          <label htmlFor="year" className="mb-2 block text-sm font-medium text-on-surface">Tahun</label>
          <select id="year" name="year" defaultValue={year} className="h-8 w-full rounded-lg border border-outline-variant bg-surface-container px-2.5 text-sm text-on-surface">
            <option value="">Semua tahun</option>
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="month" className="mb-2 block text-sm font-medium text-on-surface">Bulan</label>
          <select id="month" name="month" defaultValue={month} className="h-8 w-full rounded-lg border border-outline-variant bg-surface-container px-2.5 text-sm text-on-surface">
            <option value="">Semua bulan</option>
            {MONTH_NAMES.map((item, index) => <option key={item} value={index + 1}>{item}</option>)}
          </select>
        </div>
        <Button type="submit"><Search size={16} /> Cari</Button>
      </form>

      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-outline-variant bg-surface-container p-12 text-center">
          <FileSearch className="mb-4 text-primary" size={40} />
          <h2 className="text-xl font-semibold text-on-surface">Laporan tidak ditemukan</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Coba ubah kata kunci atau filter periode.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {filteredReports.map((report) => {
            const thumb = report.attachments.find((a) => a.fileType === "image");
            return (
              <Link
                key={report.id}
                href={`/laporan/${report.id}`}
                className="group flex flex-col focus:outline-hidden"
              >
                {/* Visual Unit: Photo container with 3:4 aspect ratio and rounded-xl */}
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
                      <FileText size={40} className="text-primary/60" />
                    </div>
                  )}
                </div>

                {/* Caption directly under photo, no separate card box */}
                <div className="mt-2 space-y-0.5">
                  <h2 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {new Date(report.reportDate).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Diunggah oleh {report.uploadedBy.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      </PageShell>
    </AppShell>
  );
}