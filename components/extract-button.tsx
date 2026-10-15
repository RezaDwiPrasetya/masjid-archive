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

// Model utama yang dipakai sistem — sinkron dengan GEMINI_MODEL di lib/gemini.ts
const PRIMARY_MODEL = "gemini-3-flash-preview";

interface ExtractButtonProps {
  attachmentId: string;
  extractionStatus: ExtractionStatus;
  extractionError?: string | null;
  extractionModel?: string | null;
  transactionCount?: number;
  verifiedCount?: number;
  manualCount?: number; // F-025: jumlah baris manual (draf + verified) untuk peringatan di dialog
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
  manualCount = 0,
}: ExtractButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [showTechnicalError, setShowTechnicalError] = useState(false);
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
    setTechnicalError(null);
    setShowTechnicalError(false);

    try {
      const res = await fetch(`/api/attachments/${attachmentId}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replaceVerified }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocalError(data.error ?? "Gagal memulai ekstraksi. Silakan coba lagi.");
        if (data.technicalDetails) {
          setTechnicalError(data.technicalDetails);
        }
        return;
      }

      if (data.data?.extractionStatus === "failed") {
        setLocalError(
          data.data?.extractionError ??
          "Ekstraksi gagal. Pastikan foto cukup jelas dan coba lagi."
        );
        if (data.data?.technicalDetails) {
          setTechnicalError(data.data.technicalDetails);
        }
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
            title={extractionModel ? `Model AI: ${extractionModel}` : undefined}
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
                title={`Model utama sibuk. Dialihkan ke: ${extractionModel}`}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-500/15 text-amber-800 border border-amber-300"
              >
                <span aria-hidden="true">&#9888;</span> Model Cadangan ({extractionModel})
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
        <div className="flex flex-col gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <div className="flex items-start gap-1.5">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="font-medium">
              {errorMessage.includes("[GoogleGenerativeAI") ||
              errorMessage.includes("Error:") ||
              errorMessage.includes("fetch failed")
                ? "Ekstraksi gagal. Pastikan foto cukup jelas dan coba lagi."
                : errorMessage}
            </span>
          </div>

          {/* Toggle Detail Masalah Teknis untuk Admin */}
          {(technicalError ||
            (extractionError &&
              (extractionError.includes("[GoogleGenerativeAI") ||
                extractionError.includes("Error") ||
                extractionError.includes("fetch failed")))) && (
            <div className="mt-1 pt-1.5 border-t border-destructive/20 text-[11px]">
              <button
                type="button"
                onClick={() => setShowTechnicalError(!showTechnicalError)}
                className="underline hover:text-destructive/80 font-mono text-[11px] cursor-pointer text-left"
              >
                {showTechnicalError
                  ? "▲ Sembunyikan detail masalah teknis"
                  : "▼ Lihat detail masalah teknis (untuk admin)"}
              </button>
              {showTechnicalError && (
                <pre className="mt-1.5 p-2 rounded bg-black/10 text-[10px] font-mono break-all whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {technicalError ?? extractionError}
                </pre>
              )}
            </div>
          )}
        </div>
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
              {manualCount > 0 && (
                <>
                  <br />
                  <br />
                  <span className="text-amber-800 font-semibold">
                    ⚠️ Terdapat {manualCount} baris manual yang akan ikut terhapus jika Anda memilih &quot;Reset & Ekstrak Ulang&quot;.
                  </span>
                </>
              )}
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
