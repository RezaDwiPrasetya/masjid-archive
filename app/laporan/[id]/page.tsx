import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function DetailLaporanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id }, include: { uploadedBy: true } });
  if (!report) notFound();

  return (
    <AppShell active="/">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft size={16} /> Kembali ke Arsip</Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Detail Laporan</h1>
        <p className="text-muted-foreground">Laporan {new Date(report.reportDate).toLocaleDateString("id-ID", { dateStyle: "full" })}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-2xl border bg-card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={report.photoUrl} alt={`Laporan ${report.reportDate}`} className="max-h-[70vh] w-full rounded-lg object-contain" />
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-5">
          <dl className="space-y-4 text-sm">
            <div><dt className="text-muted-foreground">Tanggal laporan</dt><dd className="font-medium">{new Date(report.reportDate).toLocaleDateString("id-ID", { dateStyle: "long" })}</dd></div>
            <div><dt className="text-muted-foreground">Diunggah oleh</dt><dd className="font-medium">{report.uploadedBy.name}</dd></div>
            <div><dt className="text-muted-foreground">Tanggal unggah</dt><dd className="font-medium">{new Date(report.uploadedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}</dd></div>
          </dl>
        <Button render={<a href={report.photoUrl} download />} nativeButton={false} className="mt-6 w-full">
        <Download size={16} /> Unduh Foto
        </Button>        </aside>
      </div>
    </AppShell>
  );
}