"use client";

import { Printer, ArrowLeft, Download } from "lucide-react";
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

  const handleDownloadPdf = () => {
    if (!pdfDownloadUrl) {
      window.print();
      return;
    }
    const link = document.createElement("a");
    link.href = pdfDownloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <aside
      aria-label="Aksi Dokumen Cetak"
      className="print:hidden sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-outline-variant bg-surface-container/95 backdrop-blur px-6 py-3.5 shadow-level-1"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Kembali
        </Button>
        <span className="hidden sm:inline text-xs font-semibold text-on-surface-variant">
          Pratinjau: <span className="text-on-surface">{title}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {pdfDownloadUrl && (
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs"
          >
            <Download size={14} /> Unduh PDF
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="gap-1.5 text-xs font-semibold border-outline-variant hover:bg-surface-container-high"
        >
          <Printer size={14} /> Cetak (Printer)
        </Button>
      </div>
    </aside>
  );
}

