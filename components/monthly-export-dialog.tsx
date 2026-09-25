"use client";

import { useState } from "react";
import { Download, Printer, FileSpreadsheet, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export function MonthlyExportDialog() {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);

  const currentYear = now.getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const excelUrl = `/api/reports/export/monthly/excel?year=${year}&month=${month}`;
  const printUrl = `/laporan/cetak/bulanan?year=${year}&month=${month}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs font-semibold h-9 px-3.5 border-outline-variant hover:bg-surface-container-high transition-colors"
          >
            <Download size={14} className="text-primary" />
            <span>Ekspor Rekap Bulanan</span>
          </Button>
        }
      />
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <FileSpreadsheet size={16} />
            </div>
            <DialogTitle className="text-lg font-bold font-sans">
              Ekspor Rekapitulasi Kas
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-on-surface-variant">
            Pilih periode bulan dan tahun pembukuan kas DKM Masjid Al-Luqman untuk dicetak ke papan mading atau diunduh sebagai arsip spreadsheet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Form Pemilihan Periode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Calendar size={13} className="text-on-surface-variant" />
                Bulan
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Calendar size={13} className="text-on-surface-variant" />
                Tahun
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opsi Ekspor */}
          <div className="rounded-xl border border-outline-variant bg-surface p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface">
                Format Berkas
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Hanya data terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={printUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full gap-2 text-xs font-semibold h-10 border-outline-variant hover:bg-surface-container-high"
                >
                  <Printer size={14} className="text-primary" />
                  Cetak / PDF Mading
                </Button>
              </a>

              <a
                href={excelUrl}
                download
                onClick={() => setOpen(false)}
                className="w-full"
              >
                <Button
                  className="w-full gap-2 text-xs font-semibold h-10 bg-primary hover:bg-primary/90 text-on-primary"
                >
                  <FileSpreadsheet size={14} />
                  Unduh Excel (.xlsx)
                </Button>
              </a>
            </div>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
