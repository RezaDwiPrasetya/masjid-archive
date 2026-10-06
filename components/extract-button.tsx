"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, RotateCcw, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

type ExtractionStatus = "not_extracted" | "processing" | "done" | "failed";

// Model utama yang dipakai sistem — harus sinkron dengan GEMINI_MODEL di lib/gemini.ts
const PRIMARY_MODEL = "gemini-3.6-flash";

interface ExtractButtonProps {
  attachmentId: string;
  extractionStatus: ExtractionStatus;
  extractionError?: string | null;
  extractionModel?: string | null;
  transactionCount?: number;
  verifiedCount?: number;
}

const statusBadge: Record<
  ExtractionStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  not_extracted: {
    label: "Belum diekstrak",
    className: "bg-surface-container-high border border-outline-variant text-on-surface-variant font-medium",
    icon: null,
  },
  processing: {
    label: "Sedang diproses…",
    className: "bg-amber-500/15 border border-amber-300 text-amber-800 font-semibold",
    icon: <Loader2 size={12} className="animate-spin text-amber-700" />,
  },
  done: {
    label: "Selesai",
    className: "bg-emerald-500/15 border border-emerald-300 text-emerald-800 font-semibold",
    icon: <CheckCircle2 size={12} className="text-emerald-700" />,
  },
  failed: {
    label: "Gagal",
    className: "bg-destructive/10 border border-destructive/30 text-destructive font-semibold",
    icon: <AlertCircle size={12} />,
  },
};

export function ExtractButton({
  attachmentId,
  extractionStatus,
  extractionError,
  extractionModel,
  transactionCount,
  verifiedCount = 0,
}: ExtractButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const currentStatus = loading ? "processing" : extractionStatus;
  const badge = statusBadge[currentStatus];

  const canExtract =
    !loading &&
    (extractionStatus === "not_extracted" || extractionStatus === "failed");

  async function handleExtract(replaceVerified = false) {
    setConfirmDialogOpen(false);
    setLoading(true);
    setLocalError(null);

    try {
      const res = await fetch(`/api/attachments/${attachmentId}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replaceVerified }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocalError(data.error ?? "Gagal memulai ekstraksi. Silakan coba lagi.");
        return;
      }

      if (data.data?.extractionStatus === "failed") {
        setLocalError(
          data.data?.extractionError ??
          "Ekstraksi gagal. Pastikan foto cukup jelas dan coba lagi."
        );
        return;
      }

      // Berhasil — refresh page agar daftar transaksi termuat dari server
      router.refresh();
    } catch {
      setLocalError("Tidak bisa terhubung ke server. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleReExtractClick() {
    if (verifiedCount > 0) {
      setConfirmDialogOpen(true);
    } else {
      handleExtract(false);
    }
  }

  const errorMessage = localError ?? extractionError;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Status badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${badge.className}`}
          >
            {badge.icon}
            {badge.label}
            {currentStatus === "done" && transactionCount !== undefined && (
              <span className="font-normal opacity-90">· {transactionCount} transaksi</span>
            )}
          </span>

          {/* Badge model fallback — tampil hanya jika model yang dipakai bukan model utama */}
          {currentStatus === "done" &&
            extractionModel &&
            extractionModel !== PRIMARY_MODEL && (
              <span
                title={`Model yang dipakai: ${extractionModel} (model cadangan)`}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-500/15 text-amber-800 border border-amber-300"
              >
                <span aria-hidden="true">&#9888;</span> Model Cadangan
              </span>
            )}
        </div>

        {/* Tombol Ekstrak / Coba Lagi */}
        {(extractionStatus === "not_extracted" || extractionStatus === "failed") && (
          <Button
            size="sm"
            variant={extractionStatus === "failed" ? "outline" : "default"}
            disabled={!canExtract}
            onClick={() => handleExtract(false)}
            className="gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Mengekstrak…
              </>
            ) : extractionStatus === "failed" ? (
              <>
                <RotateCcw size={13} />
                Coba Lagi
              </>
            ) : (
              <>
                <Sparkles size={13} />
                Ekstrak Data
              </>
            )}
          </Button>
        )}

        {/* Re-extract kalau sudah done */}
        {extractionStatus === "done" && !loading && (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={handleReExtractClick}
            className="gap-1.5 text-xs h-7 text-on-surface-variant hover:text-on-surface"
          >
            <RotateCcw size={12} />
            Ekstrak Ulang
          </Button>
        )}
      </div>

      {/* Pesan error */}
      {errorMessage && (
        <p className="flex items-start gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Dialog Konfirmasi Ekstrak Ulang saat sudah ada transaksi terverifikasi */}
      <AlertDialog
        open={confirmDialogOpen}
        onOpenChange={(v) => {
          if (!loading) setConfirmDialogOpen(v);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <AlertDialogTitle>Ekstrak Ulang Berkas Ini?</AlertDialogTitle>
                <span className="text-xs text-muted-foreground font-medium">
                  {verifiedCount} transaksi telah diverifikasi sebelumnya
                </span>
              </div>
            </div>
            <AlertDialogDescription className="pt-2 text-stone-600 dark:text-stone-300">
              Lampiran ini sudah memiliki <strong>{verifiedCount} transaksi terverifikasi</strong>.
              Jika Anda menambahkan draf baru tanpa mereset data lama, transaksi berisiko ganda/duplikat dan nilai kas akan terhitung dua kali.
              <br />
              <br />
              Pilih tindakan yang diinginkan:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => setConfirmDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleExtract(false)}
              className="border-amber-300 text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs"
              title="Pertahankan transaksi yang sudah diverifikasi dan tambahkan hasil ekstraksi baru sebagai draft"
            >
              Simpan Lama & Tambah Draf
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loading}
              onClick={() => handleExtract(true)}
              className="gap-1.5 text-xs"
              title="Hapus semua transaksi lama dari lampiran ini dan ganti dengan hasil ekstraksi baru"
            >
              Reset & Ekstrak Ulang
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
