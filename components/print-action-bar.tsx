"use client";

import { Printer, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PrintActionBarProps {
  backUrl: string;
  excelDownloadUrl: string;
  title: string;
}

export function PrintActionBar({
  backUrl,
  excelDownloadUrl,
  title,
}: PrintActionBarProps) {
  return (
    <aside
      aria-label="Aksi Dokumen Cetak"
      className="print:hidden sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-outline-variant bg-surface-container/95 backdrop-blur px-6 py-3.5 shadow-level-1"
    >
      <div className="flex items-center gap-3">
        <Link href={backUrl}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft size={14} /> Kembali
          </Button>
        </Link>
        <span className="hidden sm:inline text-xs font-semibold text-on-surface-variant">
          Pratinjau Cetak: <span className="text-on-surface">{title}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <a href={excelDownloadUrl} download>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download size={14} /> Unduh Excel (.xlsx)
          </Button>
        </a>
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
