"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FolderOpen,
  Calendar,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SerializedReport {
  id: string;
  reportDate: string;
  year: number;
  month: number;
  weekOfMonth: number | null;
  attachmentsCount: number;
  verifiedTxCount: number;
}

interface ArchiveReportsListProps {
  reports: SerializedReport[];
}

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const ITEMS_PER_PAGE = 6;

export function ArchiveReportsList({ reports }: ArchiveReportsListProps) {
  // 1. Ekstrak daftar unik bulan yang tersedia (diurutkan dari yang paling baru)
  const availableMonths = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { year: number; month: number; label: string }[] = [];
    for (const r of reports) {
      const key = `${r.year}-${r.month}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          year: r.year,
          month: r.month,
          label: `${MONTH_NAMES[r.month]} ${r.year}`,
        });
      }
    }
    return list;
  }, [reports]);

  // 3 Bulan terbaru yang diunggah pengurus (misal: Feb 2026, Jan 2026, Des 2025)
  const latest3Months = React.useMemo(() => {
    return availableMonths.slice(0, 3);
  }, [availableMonths]);

  // Daftar tahun unik
  const availableYears = React.useMemo(() => {
    return Array.from(new Set(reports.map((r) => r.year))).sort((a, b) => b - a);
  }, [reports]);

  // Filter state: "latest3" (default) | number (tahun tertentu) | "all"
  const [filterMode, setFilterMode] = React.useState<"latest3" | "all" | number>("latest3");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset pagination saat filter berganti
  const handleFilterChange = (mode: "latest3" | "all" | number) => {
    setFilterMode(mode);
    setCurrentPage(1);
  };

  // Filter laporan berdasarkan mode terpilih
  const filteredReports = React.useMemo(() => {
    if (filterMode === "latest3") {
      if (latest3Months.length === 0) return reports;
      return reports.filter((r) =>
        latest3Months.some((m) => m.year === r.year && m.month === r.month)
      );
    }
    if (typeof filterMode === "number") {
      return reports.filter((r) => r.year === filterMode);
    }
    return reports;
  }, [reports, filterMode, latest3Months]);

  // Paginasi
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE) || 1;
  const paginatedReports = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const scrollToSection = () => {
    const el = document.getElementById("arsip-laporan");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      scrollToSection();
    }
  };

  // Label filter aktif untuk informasi pengguna
  const activeFilterDescription = React.useMemo(() => {
    if (filterMode === "latest3") {
      if (latest3Months.length > 0) {
        const newest = latest3Months[0].label;
        const oldest = latest3Months[latest3Months.length - 1].label;
        return newest === oldest ? newest : `${oldest} – ${newest}`;
      }
      return "3 Bulan Terakhir";
    }
    if (typeof filterMode === "number") {
      return `Tahun ${filterMode}`;
    }
    return "Seluruh Arsip Kas";
  }, [filterMode, latest3Months]);

  return (
    <div className="space-y-5">
      {/* Header Bar Kontrol & Filter Tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab 3 Bulan Terakhir (Pilihan Rekomendasi/Default) */}
          <button
            type="button"
            onClick={() => handleFilterChange("latest3")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              filterMode === "latest3"
                ? "bg-[#0e3824] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            3 Bulan Terakhir
          </button>

          {/* Tab Tahun-tahun yang tersedia */}
          {availableYears.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleFilterChange(year)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                filterMode === year
                  ? "bg-[#0e3824] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Tahun {year}
            </button>
          ))}

          {/* Tab Semua Laporan */}
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              filterMode === "all"
                ? "bg-[#0e3824] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Semua ({reports.length})
          </button>
        </div>

        {/* Informasi Ringkas Status Data */}
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <span className="font-bold text-slate-800">{paginatedReports.length}</span> dari{" "}
          <span className="font-bold text-slate-800">{filteredReports.length}</span> laporan ({activeFilterDescription})
        </div>
      </div>

      {/* Grid Kartu Laporan Kas */}
      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <FolderOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-900">Belum ada dokumen laporan kas</p>
          <p className="text-xs text-slate-500 mt-1">
            Dokumen pindaian buku kas akan tampil setelah pengurus mengunggah arsip mingguan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedReports.map((report) => {
            const date = new Date(report.reportDate);
            const formattedDate = date.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <Link
                key={report.id}
                href={`/laporan/${report.id}`}
                className="group block rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/70 p-5 transition-all duration-150 shadow-2xs hover:border-emerald-600/40 space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">
                      Pekan {report.weekOfMonth ?? 1} &bull; {MONTH_NAMES[report.month]} {report.year}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {formattedDate}
                    </h4>
                  </div>
                  <span className="p-2 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-800 transition-colors">
                    <ChevronRight size={16} />
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>{report.verifiedTxCount} mutasi kas</span>
                  </span>
                  <span>&bull;</span>
                  <span>{report.attachmentsCount} berkas fisik</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Kontrol Paginasi Modern & Responsif */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3">
          <p className="text-xs text-slate-500 font-medium">
            Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{" "}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Sebelumnya</span>
            </button>

            {/* Nomor Halaman */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-[#0e3824] text-white shadow-xs"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Selanjutnya</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
