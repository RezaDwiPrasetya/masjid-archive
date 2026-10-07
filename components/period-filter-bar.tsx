"use client";

import * as React from "react";
import { Calendar, CalendarDays, RotateCcw, Filter, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MONTH_NAMES } from "@/lib/period-filter";

export interface PeriodFilterBarProps {
  selectedYear: number | null;
  selectedMonth: number | null;
  availableYears: number[];
  onChange: (year: number | null, month: number | null) => void;
  isLoading?: boolean;
  className?: string;
}

export function PeriodFilterBar({
  selectedYear,
  selectedMonth,
  availableYears,
  onChange,
  isLoading = false,
  className = "",
}: PeriodFilterBarProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // Deteksi status preset aktif
  const isAllTime = selectedYear === null && selectedMonth === null;
  const isThisYear = selectedYear === currentYear && selectedMonth === null;
  const isThisMonth = selectedYear === currentYear && selectedMonth === currentMonth;

  // Preset handlers
  const handleSelectAllTime = () => {
    onChange(null, null);
  };

  const handleSelectThisYear = () => {
    onChange(currentYear, null);
  };

  const handleSelectThisMonth = () => {
    onChange(currentYear, currentMonth);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "all") {
      onChange(null, null);
    } else {
      const year = parseInt(val, 10);
      onChange(year, selectedMonth);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "all") {
      onChange(selectedYear, null);
    } else {
      const month = parseInt(val, 10);
      // Jika tahun belum dipilih, otomatis arahkan ke tahun sekarang atau tahun pertama yang tersedia
      const targetYear = selectedYear ?? (availableYears[0] || currentYear);
      onChange(targetYear, month);
    }
  };

  // Label deskripsi periode aktif
  const getActivePeriodLabel = () => {
    if (isAllTime) return "Semua Waktu (Sepanjang Masa)";
    if (selectedYear !== null && selectedMonth !== null) {
      return `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
    }
    if (selectedYear !== null) {
      return `Tahun ${selectedYear} (1 Tahun Penuh)`;
    }
    return "Periode Kustom";
  };

  return (
    <div
      className={`rounded-2xl border border-outline-variant bg-surface-container/70 p-4 sm:p-5 shadow-xs space-y-3.5 transition-all duration-200 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Sisi Kiri: Label & Status Periode Aktif */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Periode Waktu
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-semibold">
                <Filter className="h-2.5 w-2.5" />
                {getActivePeriodLabel()}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Pilih preset waktu atau tentukan tahun dan bulan yang ingin dianalisis.
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Reset Action jika sedang difilter */}
        {!isAllTime && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAllTime}
            disabled={isLoading}
            className="text-xs h-7 self-start lg:self-auto text-primary hover:text-primary hover:bg-primary/10 gap-1.5 px-2.5"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Periode</span>
          </Button>
        )}
      </div>

      {/* Kontrol Filter: Preset Buttons & Select Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-outline-variant/60">
        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={handleSelectAllTime}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-150 shrink-0 flex items-center gap-1.5 ${
              isAllTime
                ? "bg-primary text-on-primary font-semibold shadow-xs"
                : "bg-surface border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span>Semua Waktu</span>
          </button>

          <button
            type="button"
            onClick={handleSelectThisYear}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-150 shrink-0 flex items-center gap-1.5 ${
              isThisYear
                ? "bg-primary text-on-primary font-semibold shadow-xs"
                : "bg-surface border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <Calendar className="h-3 w-3 opacity-75" />
            <span>Tahun Ini ({currentYear})</span>
          </button>

          <button
            type="button"
            onClick={handleSelectThisMonth}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-150 shrink-0 flex items-center gap-1.5 ${
              isThisMonth
                ? "bg-primary text-on-primary font-semibold shadow-xs"
                : "bg-surface border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <Sparkles className="h-3 w-3 opacity-75" />
            <span>Bulan Ini ({MONTH_NAMES[currentMonth - 1]})</span>
          </button>
        </div>

        {/* Dropdown Pemilih Kustom (Tahun & Bulan) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Dropdown Tahun */}
          <div className="relative min-w-[120px] flex-1 sm:flex-initial">
            <select
              id="period-year-select"
              value={selectedYear ?? "all"}
              onChange={handleYearChange}
              disabled={isLoading}
              className="w-full h-8 text-xs appearance-none rounded-xl border border-outline-variant bg-surface pl-2.5 pr-7 text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-on-surface-variant pointer-events-none" />
          </div>

          {/* Dropdown Bulan */}
          <div className="relative min-w-[140px] flex-1 sm:flex-initial">
            <select
              id="period-month-select"
              value={selectedMonth ?? "all"}
              onChange={handleMonthChange}
              disabled={isLoading}
              className="w-full h-8 text-xs appearance-none rounded-xl border border-outline-variant bg-surface pl-2.5 pr-7 text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="all">Semua Bulan</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-on-surface-variant pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
