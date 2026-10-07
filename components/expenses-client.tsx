"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Receipt,
  Tag,
  PieChart,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";
import { PeriodFilterBar } from "@/components/period-filter-bar";
import {
  getCategoryLabel,
  getCategoryColor,
} from "@/lib/expense-categories";

export interface ExpenseCategoryBreakdown {
  category: string | null;
  label: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface ExpenseTransactionItem {
  id: string;
  amount: number;
  description: string | null;
  transactionDate: string | null;
  category: string | null;
  reportId: string;
  reportDate: string;
  reportPeriod: string;
}

interface ExpensesClientProps {
  totalAmount: number;
  transactionCount: number;
  breakdown: ExpenseCategoryBreakdown[];
  transactions: ExpenseTransactionItem[];
  availableYears: number[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateIndo(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function ExpensesClient({
  totalAmount,
  transactionCount,
  breakdown,
  transactions,
  availableYears,
}: ExpensesClientProps) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | "all">("all");
  const [sortBy, setSortBy] = React.useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  // State Periode Waktu (Issue #66 / Fase V8)
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const [isPeriodLoading, setIsPeriodLoading] = React.useState(false);

  // Live Data State yang terpengaruh oleh Periode Filter
  const [currentTotalAmount, setCurrentTotalAmount] = React.useState(totalAmount);
  const [currentTransactionCount, setCurrentTransactionCount] = React.useState(transactionCount);
  const [currentBreakdown, setCurrentBreakdown] = React.useState<ExpenseCategoryBreakdown[]>(breakdown);
  const [currentTransactions, setCurrentTransactions] = React.useState<ExpenseTransactionItem[]>(transactions);

  // Sinkronisasi data saat filter periode diubah
  const handlePeriodChange = React.useCallback(
    async (year: number | null, month: number | null) => {
      setSelectedYear(year);
      setSelectedMonth(month);

      // Jika kembali ke Semua Waktu, reset instan ke initial props
      if (year === null && month === null) {
        setCurrentTotalAmount(totalAmount);
        setCurrentTransactionCount(transactionCount);
        setCurrentBreakdown(breakdown);
        setCurrentTransactions(transactions);
        return;
      }

      setIsPeriodLoading(true);
      try {
        const params = new URLSearchParams();
        if (year !== null) params.set("year", String(year));
        if (month !== null) params.set("month", String(month));

        const [summaryRes, txRes] = await Promise.all([
          fetch(`/api/expenses?${params.toString()}`),
          fetch(`/api/expenses/transactions?${params.toString()}`),
        ]);

        if (summaryRes.ok && txRes.ok) {
          const summaryJson = await summaryRes.json();
          const txJson = await txRes.json();

          if (summaryJson.success && summaryJson.data) {
            setCurrentTotalAmount(summaryJson.data.totalAmount ?? 0);
            setCurrentTransactionCount(summaryJson.data.transactionCount ?? 0);
            setCurrentBreakdown(summaryJson.data.breakdown ?? []);
          }

          if (txJson.success && txJson.data) {
            setCurrentTransactions(txJson.data.transactions ?? []);
          }
        }
      } catch (err) {
        console.error("[ExpensesClient] Gagal memfilter periode pengeluaran:", err);
      } finally {
        setIsPeriodLoading(false);
      }
    },
    [totalAmount, transactionCount, breakdown, transactions]
  );

  // Kategori terbesar
  const topCategory = React.useMemo(() => {
    if (!currentBreakdown || currentBreakdown.length === 0) return null;
    return currentBreakdown.reduce((max, curr) =>
      curr.totalAmount > max.totalAmount ? curr : max
    );
  }, [currentBreakdown]);

  // Filter & Urutkan transaksi
  const filteredTransactions = React.useMemo(() => {
    let list = [...currentTransactions];

    // Filter kategori
    if (selectedCategory !== "all") {
      if (selectedCategory === "__null__") {
        list = list.filter((t) => !t.category);
      } else {
        list = list.filter((t) => t.category === selectedCategory);
      }
    }

    // Filter pencarian
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const descMatch = (t.description ?? "").toLowerCase().includes(q);
        const dateMatch = (t.transactionDate ?? "").toLowerCase().includes(q);
        const periodMatch = t.reportPeriod.toLowerCase().includes(q);
        const catLabel = getCategoryLabel(t.category).toLowerCase();
        return descMatch || dateMatch || periodMatch || catLabel.includes(q);
      });
    }

    // Urutkan
    list.sort((a, b) => {
      if (sortBy === "date-desc") {
        const dateA = a.transactionDate ?? a.reportDate;
        const dateB = b.transactionDate ?? b.reportDate;
        return dateB.localeCompare(dateA);
      }
      if (sortBy === "date-asc") {
        const dateA = a.transactionDate ?? a.reportDate;
        const dateB = b.transactionDate ?? b.reportDate;
        return dateA.localeCompare(dateB);
      }
      if (sortBy === "amount-desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount-asc") {
        return a.amount - b.amount;
      }
      return 0;
    });

    return list;
  }, [currentTransactions, selectedCategory, search, sortBy]);

  // Nominal subtotal dari transaksi yang sedang difilter
  const filteredTotal = React.useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  return (
    <PageShell>
      <div className="space-y-8">
        {/* Page Title Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            Rekap & Transparansi Pengeluaran
          </h1>
          <p className="text-sm text-on-surface-variant">
            Transparansi pembukuan alokasi dana kas masjid per kategori pengeluaran yang telah diverifikasi.
          </p>
        </div>

        {/* TIME-RANGE PERIOD FILTER BAR (Issue #66 / Fase V8) */}
        <PeriodFilterBar
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          availableYears={availableYears}
          onChange={handlePeriodChange}
          isLoading={isPeriodLoading}
        />

        {/* CONTAINER KONTEN DENGAN LOADING STATE TRANSITION */}
        <div className={`space-y-8 transition-opacity duration-200 ${isPeriodLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          {/* 1. KARTU KPI TIGA KOLOM (Total Pengeluaran, Jumlah Transaksi, Kategori Terbesar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Total Pengeluaran */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container/70 p-5 sm:p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Total Pengeluaran Kas
                </span>
                <span className="rounded-full bg-rose-500/10 border border-rose-300 px-2 py-0.5 text-xs font-semibold text-rose-800">
                  Terverifikasi
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-on-surface tabular-nums">
                {formatRupiah(currentTotalAmount)}
              </div>
              <p className="text-xs text-on-surface-variant">
                Akumulasi dana keluar dari seluruh buku kas yang disahkan.
              </p>
            </div>

            {/* Card 2: Jumlah Transaksi Pengeluaran */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container/70 p-5 sm:p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Jumlah Transaksi
                </span>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                  Tercatat
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-on-surface tabular-nums">
                {currentTransactionCount} <span className="text-base font-normal text-on-surface-variant">Transaksi</span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Rata-rata {currentTransactionCount > 0 ? formatRupiah(Math.round(currentTotalAmount / currentTransactionCount)) : "Rp 0"} per transaksi pengeluaran.
              </p>
            </div>

            {/* Card 3: Alokasi Terbesar */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container/70 p-5 sm:p-6 shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Alokasi Terbesar
                </span>
                {topCategory && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      getCategoryColor(topCategory.category).bg
                    } ${getCategoryColor(topCategory.category).border} ${
                      getCategoryColor(topCategory.category).text
                    }`}
                  >
                    {topCategory.percentage.toFixed(1)}% Porsi
                  </span>
                )}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-on-surface truncate">
                {topCategory ? topCategory.label : "-"}
              </div>
              <p className="text-xs text-on-surface-variant">
                {topCategory
                  ? `${formatRupiah(topCategory.totalAmount)} (${topCategory.transactionCount} transaksi)`
                  : "Belum ada transaksi pengeluaran"}
              </p>
            </div>
          </div>

          {/* 2. BREAKDOWN PER KATEGORI (DISTRIBUSI ALOKASI DANA) */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container/60 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <PieChart className="size-4 text-primary" />
                  Distribusi Alokasi Pengeluaran
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Klik kartu kategori di bawah untuk langsung menyaring daftar rincian transaksi.
                </p>
              </div>
              {selectedCategory !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="text-xs h-7 self-start sm:self-auto text-primary hover:text-primary hover:bg-primary/10"
                >
                  Reset Filter Kategori
                </Button>
              )}
            </div>

            {/* Visual Progress Bar Strip */}
            {currentTotalAmount > 0 && (
              <div className="h-3 w-full rounded-full bg-surface-container-high overflow-hidden flex shadow-inner">
                {currentBreakdown.map((item) => {
                  if (item.percentage <= 0) return null;
                  return (
                    <div
                      key={item.category ?? "null"}
                      title={`${item.label}: ${item.percentage.toFixed(1)}% (${formatRupiah(item.totalAmount)})`}
                      style={{ width: `${item.percentage}%` }}
                      className={`h-full transition-all duration-300 hover:opacity-85 ${
                        item.category === "operasional"
                          ? "bg-blue-500"
                          : item.category === "honor"
                          ? "bg-violet-500"
                          : item.category === "sosial"
                          ? "bg-rose-500"
                          : item.category === "pembangunan"
                          ? "bg-amber-500"
                          : item.category === "konsumsi"
                          ? "bg-orange-500"
                          : item.category === "administrasi"
                          ? "bg-slate-500"
                          : item.category === "lainnya"
                          ? "bg-stone-500"
                          : "bg-stone-400"
                      }`}
                    />
                  );
                })}
              </div>
            )}

            {/* Kartu Grid Interaktif Kategori */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {currentBreakdown.map((item) => {
                const isSelected =
                  (selectedCategory === "__null__" && item.category === null) ||
                  selectedCategory === item.category;
                const color = getCategoryColor(item.category);

                return (
                  <button
                    key={item.category ?? "null"}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategory("all");
                      } else {
                        setSelectedCategory(item.category === null ? "__null__" : item.category);
                      }
                    }}
                    className={`text-left rounded-xl p-3.5 border transition-all duration-150 flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "ring-2 ring-primary border-primary bg-primary/5 shadow-xs"
                        : "border-outline-variant bg-surface hover:bg-surface-container hover:border-outline-variant/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-md px-2 py-0.5 border ${color.bg} ${color.border} ${color.text}`}
                      >
                        <Tag size={10} />
                        {item.label}
                      </span>
                      <span className="text-[11px] font-bold text-on-surface-variant tabular-nums">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-on-surface tabular-nums">
                        {formatRupiah(item.totalAmount)}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {item.transactionCount} transaksi
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. DAFTAR RINCIAN TRANSAKSI PENGELUARAN */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Receipt className="size-4.5 text-primary" />
                  Rincian Transaksi Pengeluaran
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Menampilkan {filteredTransactions.length} dari {currentTransactions.length} transaksi
                  {selectedCategory !== "all" && (
                    <span className="font-semibold text-primary ml-1">
                      (Subtotal: {formatRupiah(filteredTotal)})
                    </span>
                  )}
                </p>
              </div>

              {/* Filter & Pengurutan */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-on-surface-variant" />
                  <Input
                    id="expense-search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari uraian, tanggal..."
                    className="h-8 pl-8 text-xs bg-surface border-outline-variant focus-visible:ring-primary"
                  />
                </div>

                {/* Sort Dropdown */}
                <select
                  id="expense-sort-select"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | "date-desc"
                        | "date-asc"
                        | "amount-desc"
                        | "amount-asc"
                    )
                  }
                  className="h-8 text-xs rounded-md border border-outline-variant bg-surface px-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="date-desc">Tanggal Terbaru</option>
                  <option value="date-asc">Tanggal Terlama</option>
                  <option value="amount-desc">Nominal Terbesar</option>
                  <option value="amount-asc">Nominal Terkecil</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-primary text-on-primary font-semibold shadow-xs"
                    : "bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Semua ({currentTransactions.length})
              </button>
              {currentBreakdown.map((item) => {
                const catKey = item.category === null ? "__null__" : item.category;
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? "all" : catKey)}
                    className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? "bg-primary text-on-primary font-semibold shadow-xs"
                        : "bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-75">({item.transactionCount})</span>
                  </button>
                );
              })}
            </div>

          {/* Tabel Transaksi (Desktop) & Cards (Mobile) */}
          {filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant p-10 text-center space-y-2 bg-surface-container/30">
              <Receipt className="mx-auto size-8 text-on-surface-variant/60" />
              <p className="text-sm font-semibold text-on-surface">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                {search || selectedCategory !== "all"
                  ? "Coba ubah kata kunci pencarian atau reset filter kategori."
                  : "Belum ada data transaksi pengeluaran terverifikasi yang tercatat."}
              </p>
              {(search || selectedCategory !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                  className="mt-2 text-xs h-8 border-outline-variant"
                >
                  Reset Semua Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden shadow-xs">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-32">Tanggal</th>
                      <th className="py-3 px-4">Uraian / Keterangan</th>
                      <th className="py-3 px-4 w-36">Kategori</th>
                      <th className="py-3 px-4 w-44 text-right">Nominal</th>
                      <th className="py-3 px-4 w-48 text-right">Laporan Asal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {filteredTransactions.map((tx) => {
                      const color = getCategoryColor(tx.category);
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-surface-container-high/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-on-surface tabular-nums">
                            {formatDateIndo(tx.transactionDate ?? tx.reportDate)}
                          </td>
                          <td className="py-3 px-4 text-on-surface">
                            <span className="font-medium">
                              {tx.description || "(Tanpa uraian)"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${color.bg} ${color.border} ${color.text}`}
                            >
                              <Tag size={9} />
                              {getCategoryLabel(tx.category)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-700 tabular-nums">
                            - {formatRupiah(tx.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/laporan/${tx.reportId}`}
                              className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                              title="Buka laporan pembukuan kas terkait"
                            >
                              <FileText size={11} className="shrink-0" />
                              <span className="truncate max-w-[140px]">{tx.reportPeriod}</span>
                              <ExternalLink size={10} className="shrink-0 opacity-70" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-outline-variant/60">
                {filteredTransactions.map((tx) => {
                  const color = getCategoryColor(tx.category);
                  return (
                    <div key={tx.id} className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold text-on-surface-variant tabular-nums">
                          {formatDateIndo(tx.transactionDate ?? tx.reportDate)}
                        </span>
                        <span className="text-sm font-bold text-rose-700 tabular-nums">
                          - {formatRupiah(tx.amount)}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-on-surface">
                        {tx.description || "(Tanpa uraian)"}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border ${color.bg} ${color.border} ${color.text}`}
                        >
                          <Tag size={9} />
                          {getCategoryLabel(tx.category)}
                        </span>

                        <Link
                          href={`/laporan/${tx.reportId}`}
                          className="inline-flex items-center gap-1 text-[10px] text-primary font-medium hover:underline"
                        >
                          <FileText size={10} />
                          <span>{tx.reportPeriod}</span>
                          <ExternalLink size={9} className="opacity-70" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </PageShell>
  );
}
