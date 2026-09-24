"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}: ExtractButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const currentStatus = loading ? "processing" : extractionStatus;
  const badge = statusBadge[currentStatus];

  const canExtract =
    !loading &&
    (extractionStatus === "not_extracted" || extractionStatus === "failed");

  async function handleExtract() {
    setLoading(true);
    setLocalError(null);

    try {
      const res = await fetch(`/api/attachments/${attachmentId}/extract`, {
        method: "POST",
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
            onClick={handleExtract}
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
            onClick={handleExtract}
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
    </div>
  );
}
