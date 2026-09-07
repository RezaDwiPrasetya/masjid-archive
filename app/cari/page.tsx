import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileSearch, ArrowRight } from "lucide-react";

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
    include: { uploadedBy: true },
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Cari Arsip</h1>
        <p className="text-muted-foreground">Temukan laporan berdasarkan tanggal atau pengurus.</p>
      </div>

      <form className="mb-8 grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
        <div>
          <label htmlFor="keyword" className="mb-2 block text-sm font-medium">Kata kunci</label>
          <Input id="keyword" name="keyword" defaultValue={keyword} placeholder="Contoh: Kosasih atau 12/1/2025" />
        </div>
        <div>
          <label htmlFor="year" className="mb-2 block text-sm font-medium">Tahun</label>
          <select id="year" name="year" defaultValue={year} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
            <option value="">Semua tahun</option>
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="month" className="mb-2 block text-sm font-medium">Bulan</label>
          <select id="month" name="month" defaultValue={month} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
            <option value="">Semua bulan</option>
            {MONTH_NAMES.map((item, index) => <option key={item} value={index + 1}>{item}</option>)}
          </select>
        </div>
        <Button type="submit"><Search size={16} /> Cari</Button>
      </form>

      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card p-12 text-center">
          <FileSearch className="mb-4 text-primary" size={40} />
          <h2 className="text-xl font-semibold">Laporan tidak ditemukan</h2>
          <p className="mt-2 text-muted-foreground">Coba ubah kata kunci atau filter periode.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <article key={report.id} className="flex flex-col rounded-xl border bg-card p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.photoUrl} alt={`Laporan ${report.reportDate}`} className="mb-3 aspect-[4/3] w-full rounded-lg object-cover" />
              <h2 className="font-medium">{new Date(report.reportDate).toLocaleDateString("id-ID", { dateStyle: "full" })}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Diunggah oleh {report.uploadedBy.name}</p>
              <Link href={`/laporan/${report.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium hover:bg-accent">Lihat Detail <ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}