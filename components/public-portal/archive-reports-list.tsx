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
} from "lucide-react";

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

const MONTHS_PER_PAGE = 3;

interface MonthGroup {
  key: string;
  year: number;
  month: number;
  label: string;
  reports: SerializedReport[];
}

export function ArchiveReportsList({ reports }: ArchiveReportsListProps) {
  // 1. Kelompokkan seluruh laporan berdasarkan { tahun, bulan }
  // Setiap kolom pada tampilan merepresentasikan satu bulan
  const allMonthGroups = React.useMemo(() => {
    const map = new Map<string, MonthGroup>();

    // Urutkan laporan dari tanggal paling baru
    const sorted = [...reports].sort((a, b) => {
      return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
    });

    for (const r of sorted) {
      const key = `${r.year}-${r.month}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          year: r.year,
          month: r.month,
          label: `${MONTH_NAMES[r.month]} ${r.year}`,
          reports: [],
        });
      }
      map.get(key)!.reports.push(r);
    }

    return Array.from(map.values());
  }, [reports]);

  // Daftar tahun yang ada untuk opsi navigasi cepat
  const availableYears = React.useMemo(() => {
    return Array.from(new Set(reports.map((r) => r.year))).sort((a, b) => b - a);
  }, [reports]);

  // Filter tahun: "all" (seluruh bulan diurutkan terbaru) atau number (hanya tahun tertentu)
  const [selectedYear, setSelectedYear] = React.useState<"all" | number>("all");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset halaman saat berganti filter tahun
  const handleYearFilter = (year: "all" | number) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  // Bulan-bulan yang lolos filter
  const filteredMonthGroups = React.useMemo(() => {
    if (selectedYear === "all") return allMonthGroups;
    return allMonthGroups.filter((g) => g.year === selectedYear);
  }, [allMonthGroups, selectedYear]);

  // Paginasi: 3 Bulan per halaman (Kolom 1, Kolom 2, Kolom 3)
  const totalPages = Math.ceil(filteredMonthGroups.length / MONTHS_PER_PAGE) || 1;
  const currentMonthColumns = React.useMemo(() => {
    const start = (currentPage - 1) * MONTHS_PER_PAGE;
    return filteredMonthGroups.slice(start, start + MONTHS_PER_PAGE);
  }, [filteredMonthGroups, currentPage]);

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

  // Rentang bulan yang sedang ditampilkan pada halaman saat ini
  const activePeriodLabel = React.useMemo(() => {
    if (currentMonthColumns.length === 0) return "";
    const newest = currentMonthColumns[0].label;
    const oldest = currentMonthColumns[currentMonthColumns.length - 1].label;
    return newest === oldest ? newest : `${newest} – ${oldest}`;
  }, [currentMonthColumns]);

  return (
    <div className="space-y-6">
      {/* Header Kontrol: Filter Navigasi Cepat & Status Periode 3 Bulan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Tampilkan Periode Terbaru */}
          <button
            type="button"
            onClick={() => handleYearFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              selectedYear === "all"
                ? "bg-[#0e3824] text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Semua Periode ({allMonthGroups.length} Bulan)
          </button>

          {/* Tombol Filter Tahun */}
          {availableYears.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleYearFilter(year)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                selectedYear === year
                  ? "bg-[#0e3824] text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Tahun {year}
            </button>
          ))}
        </div>

        {/* Status Periode Aktif */}
        <div className="text-xs text-slate-600 font-medium">
          Menampilkan 3 Kolom Bulan:{" "}
          <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs inline-block">
            {activePeriodLabel || "Tidak ada data"}
          </span>
        </div>
      </div>

      {/* TAMPILAN 3 KOLOM BULAN (Setiap Kolom Merepresentasikan Satu Bulan) */}
      {currentMonthColumns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <FolderOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-900">Belum ada dokumen laporan kas</p>
          <p className="text-xs text-slate-500 mt-1">
            Dokumen pindaian buku kas akan tampil setelah pengurus mengunggah arsip mingguan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {currentMonthColumns.map((group) => (
            <div
              key={group.key}
              className="flex flex-col bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5"
            >
              {/* Header Kolom: Nama Bulan & Tahun + Badge Jumlah Pekan */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-800">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                      {group.label}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Pindaian kas mingguan
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full shrink-0">
                  {group.reports.length} Pekan
                </span>
              </div>

              {/* Daftar Kartu Laporan Pekanan dalam Bulan Ini (Tersusun Rapi ke Bawah) */}
              <div className="space-y-3">
                {group.reports.map((report) => {
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
                      className="group block rounded-xl border border-slate-200/90 bg-white hover:bg-emerald-50/30 p-3.5 transition-all duration-150 shadow-2xs hover:border-emerald-600/50 hover:shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[10.5px] font-bold text-emerald-800 block uppercase tracking-wider">
                            Pekan {report.weekOfMonth ?? 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                            {formattedDate}
                          </h4>
                        </div>
                        <span className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-800 transition-colors shrink-0">
                          <ChevronRight size={14} />
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                          <span>{report.verifiedTxCount} mutasi kas</span>
                        </span>
                        <span>&bull;</span>
                        <span>{report.attachmentsCount} berkas fisik</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginasi Periode Bulan (Navigasi 3 Bulan per Halaman) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 flex-wrap gap-3">
          <p className="text-xs text-slate-500 font-medium">
            Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{" "}
            <span className="font-bold text-slate-900">{totalPages}</span> (Total {filteredMonthGroups.length} Bulan)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={14} />
              <span>Bulan Sebelumnya</span>
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
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            >
              <span>Bulan Selanjutnya</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
