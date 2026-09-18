"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";

// ─── Tipe & Konstanta ─────────────────────────────────────────────────────────

type UserOption = { id: string; name: string; role: string };

type FileEntry = {
  /** ID unik agar React key stabil */
  id: string;
  file: File;
};

type ValidationError = {
  fileName: string;
  reason: string;
};

const ALLOWED_TYPES: Record<string, { label: string; maxBytes: number }> = {
  "image/jpeg":  { label: "Gambar JPEG", maxBytes: 5 * 1024 * 1024 },
  "image/png":   { label: "Gambar PNG",  maxBytes: 5 * 1024 * 1024 },
  "application/pdf": { label: "PDF",     maxBytes: 10 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "Excel (.xlsx)", maxBytes: 5 * 1024 * 1024,
  },
  // .xls (MIME lama)
  "application/vnd.ms-excel": { label: "Excel (.xls)", maxBytes: 5 * 1024 * 1024 },
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

  const [users, setUsers] = useState<UserOption[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [reportDate, setReportDate] = useState("");
  const [uploadedById, setUploadedById] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Ambil daftar user untuk dropdown
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((json) => setUsers(json.data ?? []));
  }, []);

  // ── #028 & #029 & #031: handle pemilihan file ──────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const errors: ValidationError[] = [];
    const accepted: FileEntry[] = [];

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

      // Validasi ukuran file
      if (file.size > rule.maxBytes) {
        errors.push({
          fileName: file.name,
          reason: `${rule.label} melebihi batas ${formatBytes(rule.maxBytes)} (ukuran: ${formatBytes(file.size)})`,
        });
        continue;
      }

      // Cegah file duplikat (nama + ukuran sama)
      const isDuplicate = files.some(
        (e) => e.file.name === file.name && e.file.size === file.size
      );
      if (isDuplicate) continue;

      accepted.push({ id: `${file.name}-${file.size}-${Date.now()}`, file });
    }

    setValidationErrors(errors);
    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
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
    if (!uploadedById) {
      setSubmitError("Pilih nama pengunggah terlebih dahulu.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach((entry) => formData.append("files", entry.file));
    formData.append("reportDate", reportDate);
    formData.append("uploadedById", uploadedById);

    const res = await fetch("/api/reports", { method: "POST", body: formData });
    setLoading(false);

    if (res.ok) {
      setSaved(true);
      setFiles([]);
      setReportDate("");
      setUploadedById("");
      setValidationErrors([]);
      router.refresh();
    } else {
      const data = await res.json();
      setSubmitError(data.error || "Terjadi kesalahan saat mengunggah.");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppShell active="/unggah">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Unggah Laporan Baru</h1>
        <p className="text-muted-foreground">
          Lampirkan satu atau beberapa file (gambar, PDF, Excel) untuk laporan mingguan ini.
        </p>
      </div>

      {/* Banner sukses */}
      {saved && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-primary">
          <CheckCircle2 size={22} />
          <div>
            <p className="font-semibold">Laporan Berhasil Disimpan</p>
            <Link href="/" className="text-sm underline">
              Lihat di Arsip
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── #028: Drop zone multi-file ── */}
        <label
          htmlFor="file-input"
          className="relative flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card text-center transition-colors hover:border-primary"
        >
          <input
            id="file-input"
            ref={inputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
          <div className="pointer-events-none flex flex-col items-center gap-3 px-6 py-8">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <UploadCloud size={32} />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Ketuk atau seret file ke sini
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Gambar (maks 5 MB) · PDF (maks 10 MB) · Excel (maks 5 MB)
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                .jpg · .png · .pdf · .xlsx · .xls
              </p>
            </div>
          </div>
        </label>

        {/* ── #031: Error validasi tipe/ukuran ── */}
        {validationErrors.length > 0 && (
          <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
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
          <div className="rounded-2xl border bg-card">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                File Terpilih ({files.length})
              </p>
            </div>
            <ul className="divide-y">
              {files.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <FileIcon mime={entry.file.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(entry.file.size)}
                    </p>
                  </div>
                  {/* #030: Tombol hapus individual */}
                  <button
                    type="button"
                    onClick={() => removeFile(entry.id)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Hapus ${entry.file.name}`}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            {/* Tombol tambah lebih banyak file */}
            <div className="border-t px-4 py-3">
              <label
                htmlFor="file-input"
                className="cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                + Tambah file lain
              </label>
            </div>
          </div>
        )}

        {/* Error submit */}
        {submitError && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertTriangle className="shrink-0 text-destructive" size={20} />
            <p className="text-sm font-medium text-destructive">{submitError}</p>
          </div>
        )}

        {/* Detail laporan */}
        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <h3 className="font-semibold text-foreground">Detail Laporan</h3>

          <div>
            <label
              htmlFor="report-date"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Tanggal Laporan
            </label>
            <Input
              id="report-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih tanggal laporan ini dibacakan (biasanya hari Jumat)
            </p>
          </div>

          <div>
            <label
              htmlFor="uploader-select"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Diunggah oleh
            </label>
            <Select
              items={users.map((u) => ({
                label: `${u.name} (${u.role})`,
                value: u.id,
              }))}
              value={uploadedById}
              onValueChange={(value) => setUploadedById(value ?? "")}
            >
              <SelectTrigger id="uploader-select" className="w-full">
                <SelectValue placeholder="Pilih pengurus" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || files.length === 0}
        >
          <CloudUpload size={20} />
          {loading
            ? "Mengunggah..."
            : files.length === 0
            ? "Pilih file terlebih dahulu"
            : `Simpan ke Arsip (${files.length} file)`}
        </Button>
      </form>
    </AppShell>
  );
}