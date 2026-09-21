"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExtractionStatus = "not_extracted" | "processing" | "done" | "failed";

interface ExtractButtonProps {
  attachmentId: string;
  extractionStatus: ExtractionStatus;
  extractionError?: string | null;
  transactionCount?: number;
  verifiedCount?: number;
}

const statusBadge: Record<
  ExtractionStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  not_extracted: {
    label: "Belum diekstrak",
    className: "bg-muted text-muted-foreground",
    icon: null,
  },
  processing: {
    label: "Sedang diproses…",
    className: "bg-amber-100 text-amber-700",
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  done: {
    label: "Selesai",
    className: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 size={12} />,
  },
  failed: {
    label: "Gagal",
    className: "bg-destructive/10 text-destructive",
    icon: <AlertCircle size={12} />,
  },
};

export function ExtractButton({
  attachmentId,
  extractionStatus,
  extractionError,
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
    <div className="flex flex-col gap-2">
      {/* Status badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.icon}
          {badge.label}
          {currentStatus === "done" && transactionCount !== undefined && (
            <span className="ml-1">· {transactionCount} transaksi</span>
          )}
        </span>

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
            variant="ghost"
            disabled={loading}
            onClick={handleExtract}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={13} />
            Ekstrak Ulang
          </Button>
        )}
      </div>

      {/* Pesan error */}
      {errorMessage && (
        <p className="flex items-start gap-1.5 rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={13} className="mt-px shrink-0" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
