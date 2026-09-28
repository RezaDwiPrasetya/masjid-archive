"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PrintActionBarProps {
  backUrl: string;
  excelDownloadUrl?: string;
  title: string;
}

export function PrintActionBar({
  backUrl,
  title,
}: PrintActionBarProps) {
  const router = useRouter();

  const handleBack = () => {
    // 1. Jika tab ini dibuka di tab baru dengan opener, tutup window agar tab tidak menumpuk
    if (typeof window !== "undefined") {
      if (window.opener) {
        window.close();
        return;
      }

      // 2. Jika riwayat peramban tersedia, navigasi mundur secara normal
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
          Pratinjau Cetak: <span className="text-on-surface">{title}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => window.print()}
          className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-on-primary font-semibold shadow-xs"
        >
          <Printer size={14} /> Cetak / Simpan PDF
        </Button>
      </div>
    </aside>
  );
}
