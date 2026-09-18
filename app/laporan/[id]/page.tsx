import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, FileSpreadsheet, ImageOff } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DeleteReportButton } from "@/components/delete-report-button";
import { DeleteAttachmentButton } from "@/components/delete-attachment-button";
import { AddAttachmentButton } from "@/components/add-attachment-button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Tambahkan ?download=<namaFile> agar Supabase memicu dialog Save-As di browser */
function downloadUrl(fileUrl: string, fileName: string): string {
  return `${fileUrl}?download=${encodeURIComponent(fileName)}`;
}

export default async function DetailLaporanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { uploadedBy: true, attachments: true },
  });
  if (!report) notFound();

  return (
    <AppShell active="/">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft size={16} /> Kembali ke Arsip
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Detail Laporan</h1>
        <p className="text-muted-foreground">
          Laporan {new Date(report.reportDate).toLocaleDateString("id-ID", { dateStyle: "full" })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Panel utama: daftar lampiran */}
        <div className="space-y-4">
          {report.attachments.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border bg-card p-12 text-center text-muted-foreground">
              <ImageOff size={40} className="mb-3" />
              <p>Tidak ada lampiran untuk laporan ini.</p>
            </div>
          ) : (
            report.attachments.map((att) => {
              if (att.fileType === "image") {
                return (
                  <div key={att.id} className="rounded-2xl border bg-card p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.fileUrl}
                      alt={att.originalFileName}
                      className="max-h-[70vh] w-full rounded-lg object-contain"
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <p className="truncate text-sm text-muted-foreground">{att.originalFileName}</p>
                      <a
                        href={downloadUrl(att.fileUrl, att.originalFileName)}
                        className="ml-2 shrink-0"
                      >
                        <Button size="sm" variant="outline">
                          <Download size={14} /> Unduh
                        </Button>
                      </a>
                      <DeleteAttachmentButton attachmentId={att.id} />
                    </div>
                  </div>
                );
              }

              if (att.fileType === "pdf") {
                return (
                  <div key={att.id} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{att.originalFileName}</p>
                      <p className="text-sm text-muted-foreground">
                        PDF · {(att.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">Buka</Button>
                      </a>
                      <a href={downloadUrl(att.fileUrl, att.originalFileName)}>
                        <Button size="sm">
                          <Download size={14} /> Unduh
                        </Button>
                      </a>
                      <DeleteAttachmentButton attachmentId={att.id} />
                    </div>
                  </div>
                );
              }

              if (att.fileType === "excel") {
                return (
                  <div key={att.id} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{att.originalFileName}</p>
                      <p className="text-sm text-muted-foreground">
                        Excel · {(att.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a href={downloadUrl(att.fileUrl, att.originalFileName)}>
                        <Button size="sm">
                          <Download size={14} /> Unduh
                        </Button>
                      </a>
                      <DeleteAttachmentButton attachmentId={att.id} />
                    </div>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Sidebar: metadata laporan */}
        <aside className="h-fit rounded-2xl border bg-card p-5">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Tanggal laporan</dt>
              <dd className="font-medium">
                {new Date(report.reportDate).toLocaleDateString("id-ID", { dateStyle: "long" })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Diunggah oleh</dt>
              <dd className="font-medium">{report.uploadedBy.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tanggal unggah</dt>
              <dd className="font-medium">
                {new Date(report.uploadedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Jumlah lampiran</dt>
              <dd className="mb-3 font-medium">{report.attachments.length} file</dd>
              <AddAttachmentButton reportId={report.id} />
            </div>
          </dl>
          <div className="mt-5 border-t pt-5">
            <DeleteReportButton reportId={report.id} />
          </div>
        </aside>
      </div>
    </AppShell>
  );
}