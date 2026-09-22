import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  ImageOff,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { DeleteReportButton } from "@/components/delete-report-button";
import { DeleteAttachmentButton } from "@/components/delete-attachment-button";
import { AddAttachmentButton } from "@/components/add-attachment-button";
import { ExtractButton } from "@/components/extract-button";
import { TransactionReviewPanel } from "@/components/transaction-review-panel";
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
  const session = await getServerSession(authOptions);
  const hasSession = !!session;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      uploadedBy: true,
      attachments: {
        include: {
          transactions: {
            include: {
              verifiedBy: {
                select: { id: true, name: true, email: true },
              },
              donor: {
                select: { id: true, name: true },
              },
            },
            orderBy: [{ isVerified: "asc" }, { transactionDate: "asc" }],
          },
        },
      },
    },
  });
  if (!report) notFound();

  // Untuk publik tanpa sesi, sembunyikan transaksi yang belum diverifikasi
  const attachmentsWithFilteredTx = report.attachments.map((att) => ({
    ...att,
    transactions: hasSession
      ? att.transactions
      : att.transactions.filter((t) => t.isVerified),
  }));

  return (
    <AppShell active="/">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Kembali ke Arsip
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Detail Laporan</h1>
        <p className="text-muted-foreground">
          Laporan{" "}
          {new Date(report.reportDate).toLocaleDateString("id-ID", {
            dateStyle: "full",
          })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Panel utama: daftar lampiran */}
        <div className="space-y-6">
          {report.attachments.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border bg-card p-12 text-center text-muted-foreground">
              <ImageOff size={40} className="mb-3" />
              <p>Tidak ada lampiran untuk laporan ini.</p>
            </div>
          ) : (
            attachmentsWithFilteredTx.map((att) => {
              const txCount = att.transactions.length;
              const verifiedCount = att.transactions.filter(
                (t) => t.isVerified
              ).length;
              const unverifiedCount = att.transactions.filter(
                (t) => !t.isVerified
              ).length;

              return (
                <div
                  key={att.id}
                  className="rounded-2xl border border-white/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden"
                >
                  {/* ── Gambar ── */}
                  {att.fileType === "image" && (
                    <>
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.fileUrl}
                          alt={att.originalFileName}
                          className="max-h-[70vh] w-full object-contain"
                        />
                      </div>
                      <div className="p-4 space-y-3 border-t border-border/50">
                        {/* Meta + aksi file */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="truncate text-sm text-muted-foreground max-w-[180px]">
                            {att.originalFileName}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={downloadUrl(
                                att.fileUrl,
                                att.originalFileName
                              )}
                              className="shrink-0"
                            >
                              <Button size="sm" variant="outline">
                                <Download size={14} /> Unduh
                              </Button>
                            </a>
                            {hasSession && (
                              <DeleteAttachmentButton attachmentId={att.id} />
                            )}
                          </div>
                        </div>

                        {/* ── Blok Ekstraksi (F-011) — hanya tampil jika ada sesi ── */}
                        {hasSession && (
                          <div className="rounded-xl bg-muted/50 border border-border/60 p-3 space-y-3">
                            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                              Ekstraksi Data Transaksi
                            </p>
                            <ExtractButton
                              attachmentId={att.id}
                              extractionStatus={
                                att.extractionStatus as
                                  | "not_extracted"
                                  | "processing"
                                  | "done"
                                  | "failed"
                              }
                              extractionError={att.extractionError}
                              extractionModel={att.extractionModel}
                              transactionCount={txCount}
                              verifiedCount={verifiedCount}
                            />
                          </div>
                        )}

                        {/* ── Panel Review Transaksi (F-012) ── */}
                        {(txCount > 0 ||
                          (hasSession &&
                            att.extractionStatus === "done")) && (
                          <div className="rounded-xl border border-border/60 p-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                                Transaksi Hasil Ekstraksi
                              </p>
                              {hasSession && unverifiedCount > 0 && (
                                <span className="text-xs text-amber-600 font-medium">
                                  {unverifiedCount} perlu dikonfirmasi
                                </span>
                              )}
                            </div>
                            <TransactionReviewPanel
                              key={`${att.id}-${att.transactions.length}-${unverifiedCount}`}
                              transactions={att.transactions.map((t) => ({
                                ...t,
                                amount: t.amount.toString(),
                                transactionDate: t.transactionDate
                                  ? t.transactionDate.toISOString()
                                  : null,
                                verifiedAt: t.verifiedAt
                                  ? t.verifiedAt.toISOString()
                                  : null,
                                donorNameRaw: t.donorNameRaw,
                                donorId: t.donorId,
                                donor: t.donor
                                  ? { id: t.donor.id, name: t.donor.name }
                                  : null,
                              }))}
                              hasSession={hasSession}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── PDF ── */}
                  {att.fileType === "pdf" && (
                    <div className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {att.originalFileName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PDF · {(att.fileSizeBytes / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            Buka
                          </Button>
                        </a>
                        <a
                          href={downloadUrl(att.fileUrl, att.originalFileName)}
                        >
                          <Button size="sm">
                            <Download size={14} /> Unduh
                          </Button>
                        </a>
                        {hasSession && (
                          <DeleteAttachmentButton attachmentId={att.id} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Excel ── */}
                  {att.fileType === "excel" && (
                    <div className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <FileSpreadsheet size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {att.originalFileName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Excel ·{" "}
                          {(att.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <a
                          href={downloadUrl(att.fileUrl, att.originalFileName)}
                        >
                          <Button size="sm">
                            <Download size={14} /> Unduh
                          </Button>
                        </a>
                        {hasSession && (
                          <DeleteAttachmentButton attachmentId={att.id} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar: metadata laporan */}
        <aside className="h-fit rounded-2xl border bg-card p-5">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Tanggal laporan</dt>
              <dd className="font-medium">
                {new Date(report.reportDate).toLocaleDateString("id-ID", {
                  dateStyle: "long",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Diunggah oleh</dt>
              <dd className="font-medium">{report.uploadedBy.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tanggal unggah</dt>
              <dd className="font-medium">
                {new Date(report.uploadedAt).toLocaleDateString("id-ID", {
                  dateStyle: "long",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Jumlah lampiran</dt>
              <dd className="mb-3 font-medium">
                {report.attachments.length} file
              </dd>
              {hasSession && <AddAttachmentButton reportId={report.id} />}
            </div>

            {/* Ringkasan kas & transaksi terverifikasi */}
            {(() => {
              const allVerified = report.attachments.flatMap((a) =>
                a.transactions.filter((t) => t.isVerified)
              );
              const allUnverified = report.attachments.flatMap((a) =>
                a.transactions.filter((t) => !t.isVerified)
              );

              // Baca saldo langsung dari Report — tidak lagi dari Attachment (sudah dimigrasikan)
              const initialBalance = report.initialBalance
                ? parseFloat(report.initialBalance.toString())
                : null;
              const finalBalance = report.finalBalance
                ? parseFloat(report.finalBalance.toString())
                : null;

              if (
                allVerified.length === 0 &&
                allUnverified.length === 0 &&
                initialBalance === null &&
                finalBalance === null
              ) {
                return null;
              }

              const totalMasuk = allVerified
                .filter((t) => t.type === "pemasukan")
                .reduce((s, t) => s + parseFloat(t.amount.toString()), 0);
              const totalKeluar = allVerified
                .filter((t) => t.type === "pengeluaran")
                .reduce((s, t) => s + parseFloat(t.amount.toString()), 0);
              const netChange = totalMasuk - totalKeluar;
              const calculatedFinal =
                initialBalance !== null ? initialBalance + netChange : null;

              // Check reconciliation: if both initial & final exist from paper, is it balanced?
              const isReconciled =
                calculatedFinal !== null &&
                finalBalance !== null &&
                Math.abs(calculatedFinal - finalBalance) < 1;

              const hasDifference =
                calculatedFinal !== null &&
                finalBalance !== null &&
                !isReconciled;

              const fmt = (n: number) =>
                new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(n);

              return (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                      Ringkasan Kas Pekan Ini
                    </p>
                  </div>

                  {allUnverified.length > 0 && (
                    <p className="text-xs text-amber-600 font-medium bg-amber-50 rounded-lg px-2.5 py-1.5 dark:bg-amber-950/30 dark:text-amber-400">
                      {allUnverified.length} transaksi menunggu verifikasi
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    {/* Saldo Lalu / Awal jika terdeteksi dari kertas */}
                    {initialBalance !== null && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Saldo Lalu</span>
                        <span className="font-semibold text-foreground">
                          {fmt(initialBalance)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground">Pemasukan</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        + {fmt(totalMasuk)}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground">Pengeluaran</span>
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        - {fmt(totalKeluar)}
                      </span>
                    </div>

                    {/* Selisih Pemasukan - Pengeluaran Pekan Ini */}
                    {initialBalance !== null && (
                      <div className="flex justify-between items-baseline py-1 border-t border-dashed border-border/70 text-xs">
                        <span className="text-muted-foreground">Selisih Pekan Ini</span>
                        <span
                          className={`font-semibold ${
                            netChange >= 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {netChange > 0 ? `+ ${fmt(netChange)}` : fmt(netChange)}
                        </span>
                      </div>
                    )}

                    {/* Jika ada Saldo Awal, hitung Saldo Akhir Kumulatif */}
                    {initialBalance !== null ? (
                      <div className="flex justify-between items-baseline border-t border-border/80 pt-2">
                        <span className="font-bold text-foreground">Saldo Kas Akhir</span>
                        <span className="font-extrabold text-base text-primary">
                          {fmt(calculatedFinal!)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-baseline border-t border-border/80 pt-2">
                        <span className="font-semibold text-foreground">Selisih Kas</span>
                        <span
                          className={`font-bold ${
                            netChange >= 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {fmt(netChange)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lencana Rekonsiliasi Kas Otomatis */}
                  {isReconciled && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 p-2.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-300">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Perhitungan buku kas seimbang</span>
                    </div>
                  )}

                  {hasDifference && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-300">
                      <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Total tertulis di buku: {fmt(finalBalance!)}
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          Terdapat selisih {fmt(Math.abs(calculatedFinal! - finalBalance!))} dengan kalkulasi transaksi terverifikasi.
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground">
                    * Berdasarkan transaksi yang sudah diverifikasi
                  </p>
                </div>
              );
            })()}
          </dl>

          {hasSession && (
            <div className="mt-5 border-t pt-5">
              <DeleteReportButton reportId={report.id} />
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}