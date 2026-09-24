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
import { PageShell } from "@/components/page-shell";
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

  // Kumpulkan seluruh transaksi terverifikasi di seluruh lampiran laporan ini untuk deteksi duplikat lintas attachment
  const allVerifiedInReport = report.attachments
    .flatMap((a) => a.transactions)
    .filter((t) => t.isVerified)
    .map((t) => ({
      ...t,
      amount: t.amount.toString(),
      transactionDate: t.transactionDate
        ? t.transactionDate.toISOString()
        : null,
      verifiedAt: t.verifiedAt ? t.verifiedAt.toISOString() : null,
      donorNameRaw: t.donorNameRaw,
      donorId: t.donorId,
      donor: t.donor ? { id: t.donor.id, name: t.donor.name } : null,
    }));

  return (
    <AppShell active="/">
      <PageShell>
        <div className="space-y-6">
          {/* Back Navigation */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
            >
              <ArrowLeft size={14} /> Kembali ke Arsip Laporan
            </Link>
          </div>

          {/* Page Heading */}
          <div className="border-b border-outline-variant pb-5">
            <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">
              Detail Laporan
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Laporan Keuangan Kas • {new Date(report.reportDate).toLocaleDateString("id-ID", {
                dateStyle: "full",
              })}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                  className="rounded-xl border border-outline-variant bg-surface-container shadow-level-1 overflow-hidden"
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
                          <p className="truncate text-sm text-muted-foreground">
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
                        {txCount > 0 && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <h2 className="text-base font-semibold">
                                Transaksi Kas ({txCount})
                              </h2>
                              {hasSession && unverifiedCount > 0 && (
                                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
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
                              allVerifiedTransactions={allVerifiedInReport}
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
        <aside className="h-fit rounded-xl border border-outline-variant bg-surface-container p-5 sm:p-6 shadow-level-1">
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant pb-2">
                Informasi Dokumen
              </h3>
              <dl className="mt-3 space-y-3 text-xs sm:text-sm">
                <div>
                  <dt className="text-on-surface-variant text-xs">Tanggal Laporan</dt>
                  <dd className="font-semibold text-on-surface">
                    {new Date(report.reportDate).toLocaleDateString("id-ID", {
                      dateStyle: "long",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs">Diunggah Oleh</dt>
                  <dd className="font-semibold text-on-surface">{report.uploadedBy.name}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs">Tanggal Pengunggahan</dt>
                  <dd className="font-medium text-on-surface">
                    {new Date(report.uploadedAt).toLocaleDateString("id-ID", {
                      dateStyle: "medium",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs">Jumlah Lampiran</dt>
                  <dd className="font-semibold text-on-surface mt-0.5">
                    {report.attachments.length} berkas pindaian
                  </dd>
                  {hasSession && (
                    <div className="mt-2.5">
                      <AddAttachmentButton reportId={report.id} />
                    </div>
                  )}
                </div>
              </dl>
            </div>

            {/* Ringkasan kas & transaksi terverifikasi */}
            {(() => {
              const allVerified = report.attachments.flatMap((a) =>
                a.transactions.filter((t) => t.isVerified)
              );
              const allUnverified = report.attachments.flatMap((a) =>
                a.transactions.filter((t) => !t.isVerified)
              );

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
                <div className="border-t border-outline-variant pt-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Ringkasan Kas Pekan Ini
                  </h3>

                  {allUnverified.length > 0 && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-xs text-amber-900 dark:text-amber-300 font-medium">
                      {allUnverified.length} transaksi belum diverifikasi
                    </div>
                  )}

                  <div className="space-y-2 text-xs sm:text-sm">
                    {initialBalance !== null && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-on-surface-variant">Saldo Lalu</span>
                        <span className="font-semibold text-on-surface tabular-nums">
                          {fmt(initialBalance)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline">
                      <span className="text-on-surface-variant">Pemasukan</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        + {fmt(totalMasuk)}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <span className="text-on-surface-variant">Pengeluaran</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                        - {fmt(totalKeluar)}
                      </span>
                    </div>

                    {initialBalance !== null && (
                      <div className="flex justify-between items-baseline py-1 border-t border-dashed border-outline-variant text-xs">
                        <span className="text-on-surface-variant">Arus Kas Pekan Ini</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            netChange >= 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {netChange > 0 ? `+ ${fmt(netChange)}` : fmt(netChange)}
                        </span>
                      </div>
                    )}

                    {initialBalance !== null ? (
                      <div className="flex justify-between items-baseline border-t border-outline-variant pt-2">
                        <span className="font-bold text-on-surface">Saldo Kas Akhir</span>
                        <span className="font-extrabold text-base text-primary tabular-nums">
                          {fmt(calculatedFinal!)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-baseline border-t border-outline-variant pt-2">
                        <span className="font-semibold text-on-surface">Selisih Kas</span>
                        <span
                          className={`font-bold tabular-nums ${
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

                  {isReconciled && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                      <span>Perhitungan buku kas seimbang</span>
                    </div>
                  )}

                  {hasDifference && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                      <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Total di buku: {fmt(finalBalance!)}
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          Selisih {fmt(Math.abs(calculatedFinal! - finalBalance!))} dengan transaksi terverifikasi.
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-on-surface-variant/80">
                    * Berdasarkan transaksi yang telah diverifikasi
                  </p>
                </div>
              );
            })()}

            {hasSession && (
              <div className="pt-4 border-t border-outline-variant">
                <DeleteReportButton reportId={report.id} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  </PageShell>
    </AppShell>
  );
}