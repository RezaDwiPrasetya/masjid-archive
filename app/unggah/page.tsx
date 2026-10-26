"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compressImage } from "@/lib/image-compression";
import {
  CloudUpload,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  X,
  FileImage,
  FileText,
  FileSpreadsheet,
  File,
  ShieldAlert,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";

// ─── Tipe & Konstanta ─────────────────────────────────────────────────────────

type FileEntry = {
  /** ID unik agar React key stabil */
  id: string;
  file: File;
  originalSize: number;
  compressedSize: number;
  isCompressed: boolean;
  savingsPercent: number;
};

type ValidationError = {
  fileName: string;
  reason: string;
};

const ALLOWED_TYPES: Record<string, { label: string; maxBytes: number }> = {
  "image/jpeg": { label: "Gambar JPEG", maxBytes: 10 * 1024 * 1024 },
  "image/png": { label: "Gambar PNG", maxBytes: 10 * 1024 * 1024 },
  "image/webp": { label: "Gambar WebP", maxBytes: 10 * 1024 * 1024 },
  "application/pdf": { label: "PDF", maxBytes: 10 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "Excel (.xlsx)", maxBytes: 10 * 1024 * 1024,
  },
  // .xls (MIME lama)
  "application/vnd.ms-excel": { label: "Excel (.xls)", maxBytes: 10 * 1024 * 1024 },
};

// ─── Helper: format ukuran file ───────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Helper: ikon per tipe file ───────────────────────────────────────────────

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/"))
    return <FileImage size={20} className="shrink-0 text-blue-500" />;
  if (mime === "application/pdf")
    return <FileText size={20} className="shrink-0 text-red-500" />;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("ms-excel"))
    return <FileSpreadsheet size={20} className="shrink-0 text-green-600" />;
  return <File size={20} className="shrink-0 text-muted-foreground" />;
}

// ─── Komponen utama ───────────────────────────────────────────────────────────

export default function UnggahLaporanPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: session, status } = useSession();

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [reportDate, setReportDate] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressingText, setCompressingText] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploadedReportId, setUploadedReportId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (status === "loading") {
    return (
      <AppShell active="/unggah">
        <PageShell>
          <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Memuat...</div>
        </PageShell>
      </AppShell>
    );
  }

  // Hanya BENDAHARA dan ADMIN yang bisa akses
  const allowedRoles = ["ADMIN", "BENDAHARA"];
  const userRole = session?.user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <AppShell active="/unggah">
        <PageShell>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container p-8 text-center shadow-xs">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-on-surface font-sans">
                Akses Ditolak
              </h1>
              <p className="text-sm text-on-surface-variant">
                Hanya pengurus DKM (Bendahara atau Admin) yang dapat mengunggah laporan.
              </p>
            </div>
          </div>
        </PageShell>
      </AppShell>
    );
  }

  // ── #028 & #029 & #031: handle pemilihan file & kompresi client-side (Issue #075) ──
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const errors: ValidationError[] = [];
    const validFilesToProcess: File[] = [];

    for (const file of selected) {
      const rule = ALLOWED_TYPES[file.type];

      // Validasi tipe file
      if (!rule) {
        errors.push({
          fileName: file.name,
          reason: `Tipe file tidak didukung (${file.type || "tidak dikenal"})`,
        });
        continue;
      }

      // Validasi ukuran file batas maksimal 10 MB
      if (file.size > rule.maxBytes) {
        errors.push({
          fileName: file.name,
          reason: `${rule.label} melebihi batas ${formatBytes(rule.maxBytes)} (ukuran: ${formatBytes(file.size)})`,
        });
        continue;
      }

      // Cegah file duplikat (nama + ukuran sama)
      const isDuplicate = files.some(
        (entry) =>
          (entry.file.name === file.name && entry.originalSize === file.size) ||
          (entry.file.name === file.name && entry.file.size === file.size)
      );
      if (isDuplicate) continue;

      validFilesToProcess.push(file);
    }

    setValidationErrors(errors);

    if (validFilesToProcess.length > 0) {
      setCompressing(true);
      const newEntries: FileEntry[] = [];

      for (let i = 0; i < validFilesToProcess.length; i++) {
        const file = validFilesToProcess[i];
        setCompressingText(`Mengoptimalkan berkas ${i + 1} dari ${validFilesToProcess.length}...`);

        const result = await compressImage(file);
        newEntries.push({
          id: `${file.name}-${file.size}-${Date.now()}-${i}`,
          file: result.file,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          isCompressed: result.isCompressed,
          savingsPercent: result.savingsPercent,
        });
      }

      setCompressing(false);
      setCompressingText("");
      setFiles((prev) => [...prev, ...newEntries]);
    }

    // Reset nilai input agar file yang sama bisa dipilih lagi jika dihapus
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── #030: hapus file individual ────────────────────────────────────────────
  function removeFile(id: string) {
    setFiles((prev) => prev.filter((e) => e.id !== id));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSaved(false);

    if (files.length === 0) {
      setSubmitError("Pilih minimal satu file sebelum mengunggah.");
      return;
    }
    if (!reportDate) {
      setSubmitError("Tanggal laporan wajib diisi.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach((entry) => formData.append("files", entry.file));
    formData.append("reportDate", reportDate);

    const res = await fetch("/api/reports", { method: "POST", body: formData });
    setLoading(false);

    if (res.ok) {
      const result = await res.json();
      const newReportId = result.data?.id;
      setSaved(true);
      setFiles([]);
      setReportDate("");
      setValidationErrors([]);
      if (newReportId) {
        setUploadedReportId(newReportId);
        setIsRedirecting(true);
        // Langsung arahkan ke halaman detail laporan tempat ekstraksi data AI berada!
        router.push(`/laporan/${newReportId}`);
      }
    } else {
      const data = await res.json();
      setSubmitError(data.error || "Terjadi kesalahan saat mengunggah.");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppShell active="/unggah">
      <PageShell>
        <div className="space-y-6 sm:space-y-8">
          {/* HEADER ATAS DI KANVAS TERANG */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <UploadCloud className="h-3.5 w-3.5 text-emerald-800" />
              <span>Ruang Kerja Pengurus DKM • Pembukuan Kas Digital</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Unggah Berkas Laporan Kas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Digitalisasi warta Jum&apos;at, pindaian buku kas fisik, dokumen PDF, dan spreadsheet Excel ke arsip terverifikasi.
            </p>
          </div>

        {/* Banner sukses */}
        {saved && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-700 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-900">
                  {isRedirecting
                    ? "Laporan Berhasil Disimpan! Mengalihkan ke halaman ekstraksi..."
                    : "Laporan Berhasil Disimpan"}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Lampiran siap diproses melalui ekstraksi otomatis AI.
                </p>
              </div>
            </div>
            {uploadedReportId ? (
              <Link
                href={`/laporan/${uploadedReportId}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0e3824] hover:bg-[#144731] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <span>Buka Detail &amp; Ekstraksi Data</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                href="/cari"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0e3824] hover:bg-[#144731] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <span>Buka Arsip Laporan</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── #028: Drop zone multi-file ── */}
          <label
            htmlFor="file-input"
            className="relative flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 shadow-2xs text-center transition-all hover:border-emerald-600 hover:bg-emerald-50/20"
          >
            <input
              id="file-input"
              ref={inputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls"
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              onChange={handleFileChange}
              disabled={compressing || loading}
            />
            <div className="pointer-events-none flex flex-col items-center gap-3">
              {compressing ? (
                <>
                  <div className="rounded-2xl bg-emerald-50 text-emerald-800 p-4 border border-emerald-200 animate-pulse">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-slate-900">
                      {compressingText || "Mengoptimalkan dan mengompresi foto..."}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                      Mengonversi ke WebP beresolusi tajam & menghemat kuota penyimpanan
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl bg-emerald-50 text-emerald-800 p-4 border border-emerald-200">
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-base text-slate-900">
                      Ketuk atau seret file laporan ke sini
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                      Gambar (dioptimasi otomatis ke WebP) · PDF (maks 10 MB) · Excel (maks 10 MB)
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Format: .jpg · .png · .webp · .pdf · .xlsx · .xls
                    </p>
                  </div>
                </>
              )}
            </div>
          </label>

          {/* ── #031: Error validasi tipe/ukuran ── */}
          {validationErrors.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle size={18} />
                <p className="text-sm font-semibold">
                  {validationErrors.length} file ditolak:
                </p>
              </div>
              <ul className="ml-6 list-disc space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i} className="text-sm text-destructive">
                    <span className="font-medium">{err.fileName}</span> — {err.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── #029 & #030: Daftar file terpilih ── */}
          {files.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <p className="text-sm font-bold text-slate-900">
                  File Terpilih ({files.length})
                </p>
              </div>
              <ul className="divide-y divide-slate-100">
                {files.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                  >
                    <FileIcon mime={entry.file.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {entry.file.name}
                      </p>
                      {entry.isCompressed ? (
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400 line-through">
                            {formatBytes(entry.originalSize)}
                          </span>
                          <span className="text-xs font-semibold text-emerald-800">
                            → {formatBytes(entry.compressedSize)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <Sparkles className="size-3" />
                            Hemat {entry.savingsPercent}%
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatBytes(entry.file.size)}
                        </p>
                      )}
                    </div>
                    {/* #030: Tombol hapus individual */}
                    <button
                      type="button"
                      onClick={() => removeFile(entry.id)}
                      disabled={compressing || loading}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label={`Hapus ${entry.file.name}`}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              {/* Tombol tambah lebih banyak file */}
              <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/40">
                <label
                  htmlFor="file-input"
                  className={`text-xs font-bold text-emerald-800 inline-flex items-center gap-1 ${compressing || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:underline"
                    }`}
                >
                  + Tambah berkas lain
                </label>
              </div>
            </div>
          )}

          {/* Error submit */}
          {submitError && (
            <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <AlertTriangle className="shrink-0 text-destructive" size={20} />
              <p className="text-sm font-medium text-destructive">{submitError}</p>
            </div>
          )}

          {/* Detail laporan */}
          <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5">
              Detail Laporan
            </h3>

            <div>
              <label
                htmlFor="report-date"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Tanggal Laporan
              </label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
                className="rounded-xl border-slate-200 bg-white text-slate-900 max-w-sm h-10 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Pilih tanggal laporan ini dibacakan di hadapan jamaah (biasanya hari Jumat)
              </p>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-11 text-sm font-bold rounded-xl bg-[#0e3824] hover:bg-[#144731] text-white shadow-xs gap-2 transition-colors disabled:opacity-50"
            disabled={loading || compressing || files.length === 0}
          >
            <CloudUpload size={18} />
            {loading
              ? "Mengunggah..."
              : compressing
                ? "Mengoptimalkan foto..."
                : files.length === 0
                  ? "Pilih file terlebih dahulu"
                  : `Simpan ke Arsip (${files.length} file)`}
          </Button>
        </form>
        </div>
      </PageShell>
    </AppShell>
  );
}