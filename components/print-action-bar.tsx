"use client";

import * as React from "react";
import { Printer, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PrintActionBarProps {
  backUrl: string;
  pdfDownloadUrl?: string;
  excelDownloadUrl?: string;
  title: string;
}

export function PrintActionBar({
  backUrl,
  pdfDownloadUrl,
  title,
}: PrintActionBarProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      if (window.opener) {
        window.close();
        return;
      }

      if (window.history.length > 1) {
        router.back();
        return;
      }

      window.close();
      setTimeout(() => {
        router.push(backUrl);
      }, 100);
      return;
    }

    router.push(backUrl);
  };

  const handlePrint = async () => {
    if (!pdfDownloadUrl) {
      window.print();
      return;
    }

    setIsDownloading(true);
    setFeedback(null);

    try {
      // Ambil berkas via fetch untuk memantau status jaringan dan menampilkan feedback visual
      const res = await fetch(pdfDownloadUrl);
      if (!res.ok) {
        throw new Error(`Gagal menyiapkan berkas PDF (${res.status})`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;

      // Dapatkan nama file dari header Content-Disposition jika tersedia
      const disposition = res.headers.get("content-disposition");
      let filename = "Laporan-Kas-Al-Luqman.pdf";
      if (disposition && disposition.includes("filename=")) {
        const matches = /filename="?([^"]+)"?/.exec(disposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setFeedback({
        type: "success",
        message: "Berkas PDF resmi berhasil diunduh. Silakan buka berkas untuk mencetak ke printer atau mengarsipkan.",
      });

      // Hilangkan pesan notifikasi setelah 5 detik
      setTimeout(() => {
        setFeedback(null);
      }, 5000);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setFeedback({
        type: "error",
        message: "Terjadi kendala saat menyiapkan berkas PDF. Silakan coba lagi.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <aside
      aria-label="Aksi Dokumen Cetak"
      className="print:hidden sticky top-0 z-50 flex flex-col border-b border-outline-variant bg-surface-container/95 backdrop-blur shadow-level-1"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-1.5 text-xs font-semibold border-outline-variant hover:bg-surface-container-high"
          >
            <ArrowLeft size={14} /> Kembali
          </Button>
          <span className="hidden sm:inline text-xs font-semibold text-on-surface-variant">
            Pratinjau: <span className="text-on-surface">{title}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={isDownloading}
            className="gap-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs transition-all"
            title="Cetak laporan resmi berstandar A4 bebas dari label situs web"
          >
            {isDownloading ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                <span>Menyiapkan Dokumen...</span>
              </>
            ) : (
              <>
                <Printer size={14} />
                <span>Cetak Laporan</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Banner Feedback / Notifikasi Unduhan */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`px-6 py-2 text-xs font-medium flex items-center justify-between border-t transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-bold underline cursor-pointer hover:opacity-80 ml-4 shrink-0"
          >
            Tutup
          </button>
        </div>
      )}
    </aside>
  );
}
