"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  ListOrdered,
  FileText,
  ExternalLink,
  RotateCcw,
  Loader2,
  Calendar,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PageShell } from "@/components/page-shell";
import { PeriodFilterBar } from "@/components/period-filter-bar";
import { MONTH_NAMES } from "@/lib/period-filter";

export interface DonorItem {
  id: string;
  name: string;
  totalContribution: number;
  donationCount: number;
}

export interface AnonymousAggregate {
  totalContribution: number;
  donationCount: number;
}

interface AnonymousTransaction {
  id: string;
  amount: number;
  description: string;
  transactionDate: string | null;
  reportId: string;
  reportDate: string;
  reportPeriod: string;
}

interface DonorsClientProps {
  donors: DonorItem[];
  anonymous: AnonymousAggregate;
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

export function DonorsClient({ donors, anonymous, availableYears }: DonorsClientProps) {
  const [search, setSearch] = React.useState("");

  // State Periode Waktu (Issue #66 / Fase V8)
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const [isPeriodLoading, setIsPeriodLoading] = React.useState(false);

  // Live Data State yang terpengaruh oleh Periode Filter
  const [currentDonors, setCurrentDonors] = React.useState<DonorItem[]>(donors);
  const [currentAnonymous, setCurrentAnonymous] = React.useState<AnonymousAggregate>(anonymous);

  // State untuk modal rincian infaq anonim (Issue #054 / F-018)
  const [isAnonModalOpen, setIsAnonModalOpen] = React.useState(false);
  const [anonLoading, setAnonLoading] = React.useState(false);
  const [anonError, setAnonError] = React.useState<string | null>(null);
  const [anonTransactions, setAnonTransactions] = React.useState<AnonymousTransaction[]>([]);
  const [anonSearch, setAnonSearch] = React.useState("");

  // Sinkronisasi data saat filter periode diubah
  const handlePeriodChange = React.useCallback(
    async (year: number | null, month: number | null) => {
      setSelectedYear(year);
      setSelectedMonth(month);
      // Invalidate transaksi modal lama agar selalu memuat sesuai periode baru
      setAnonTransactions([]);

      if (year === null && month === null) {
        setCurrentDonors(donors);
        setCurrentAnonymous(anonymous);
        return;
      }

      setIsPeriodLoading(true);
      try {
        const params = new URLSearchParams();
        if (year !== null) params.set("year", String(year));
        if (month !== null) params.set("month", String(month));

        const res = await fetch(`/api/donors?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setCurrentDonors(json.data.donors ?? []);
            setCurrentAnonymous(
              json.data.anonymous ?? { totalContribution: 0, donationCount: 0 }
            );
          }
        }
      } catch (err) {
        console.error("[DonorsClient] Gagal memfilter periode donatur:", err);
      } finally {
        setIsPeriodLoading(false);
      }
    },
    [donors, anonymous]
  );

  // Ambil data transaksi anonim berdasarkan periode aktif
  const fetchAnonymousTransactions = React.useCallback(
    async (yr: number | null = selectedYear, mo: number | null = selectedMonth) => {
      setAnonLoading(true);
      setAnonError(null);
      try {
        const params = new URLSearchParams();
        if (yr !== null) params.set("year", String(yr));
        if (mo !== null) params.set("month", String(mo));

        const res = await fetch(`/api/donors/anonymous/transactions?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setAnonTransactions(json.data?.transactions ?? []);
      } catch (err) {
        console.error("[DonorsClient] Gagal mengambil rincian infaq anonim:", err);
        setAnonError("Gagal memuat rincian transaksi anonim. Silakan periksa koneksi dan coba lagi.");
      } finally {
        setAnonLoading(false);
      }
    },
    [selectedYear, selectedMonth]
  );

  const handleOpenAnonModal = () => {
    setIsAnonModalOpen(true);
    fetchAnonymousTransactions(selectedYear, selectedMonth);
  };

  // Live filter rincian anonim dalam modal
  const filteredAnonTx = React.useMemo(() => {
    if (!anonSearch.trim()) return anonTransactions;
    const q = anonSearch.toLowerCase();
    return anonTransactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        (t.transactionDate && t.transactionDate.includes(q)) ||
        t.reportPeriod.toLowerCase().includes(q)
    );
  }, [anonTransactions, anonSearch]);

  // Live filter real-time donatur terdata
  const filteredDonors = React.useMemo(() => {
    if (!search.trim()) return currentDonors;
    const q = search.toLowerCase();
    return currentDonors.filter((d) => d.name.toLowerCase().includes(q));
  }, [currentDonors, search]);

  const totalNamedDonations = currentDonors.reduce(
    (acc, d) => acc + d.totalContribution,
    0
  );

  // Paginasi Donatur
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  // Reset ke halaman 1 saat pencarian atau periode filter berubah
  const [prevFilterKey, setPrevFilterKey] = React.useState(
    () => `${search}-${selectedYear}-${selectedMonth}`
  );
  const currentFilterKey = `${search}-${selectedYear}-${selectedMonth}`;
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredDonors.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedDonors = React.useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredDonors.slice(start, start + pageSize);
  }, [filteredDonors, safePage, pageSize]);

  // Label periode aktif untuk modal dialog
  const activePeriodLabel = React.useMemo(() => {
    if (selectedYear !== null && selectedMonth !== null) {
      return `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
    }
    if (selectedYear !== null) {
      return `Tahun ${selectedYear}`;
    }
    return "Semua Waktu";
  }, [selectedYear, selectedMonth]);

  const totalCombinedDonations = totalNamedDonations + currentAnonymous.totalContribution;
  const totalCombinedCount =
    currentDonors.reduce((acc, d) => acc + d.donationCount, 0) +
    currentAnonymous.donationCount;

  return (
    <PageShell>
      <div className="space-y-6 sm:space-y-8">
        {/* UNIFIED HERO HEADER CARD (F-039) */}
        <div className="rounded-3xl bg-[#0e3824] text-white p-6 sm:p-8 lg:p-9 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5 sm:space-y-6">
            {/* Baris Atas: Judul Halaman & Ringkasan Catatan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Donatur &amp; Infaq Kas Masjid
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
                  Akumulasi infaq masuk dari {totalCombinedCount} catatan terverifikasi ({activePeriodLabel})
                </p>
              </div>
            </div>

            {/* Garis Pemisah Halus */}
            <div className="border-t border-white/10" />

            {/* Baris Bawah: Grid Metrik Finansial Infaq */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
              <div className="xl:col-span-5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                  <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <Users size={14} />
                  </div>
                  <span>Total Akumulasi Infaq Masuk</span>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-white tabular-nums leading-tight font-sans">
                  {formatRupiah(totalCombinedDonations)}
                </div>
                <div className="text-xs text-emerald-100/80">
                  Akumulasi infaq terverifikasi ({activePeriodLabel})
                </div>
              </div>

            <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#144731]/80 border border-emerald-400/20 backdrop-blur-sm flex flex-col justify-between">
                <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider leading-tight">
                  Donatur Terdata ({currentDonors.length} Nama)
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-bold text-white tabular-nums mt-1">
                  {formatRupiah(totalNamedDonations)}
                </div>
                <div className="text-xs text-emerald-300/80 mt-0.5">
                  Tercatat per nama donatur tetap
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#144731]/80 border border-emerald-400/20 backdrop-blur-sm flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider leading-tight">
                    Tromol / Anonim
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAnonModal}
                    className="shrink-0 h-6 px-2 text-[10.5px] font-semibold rounded-lg bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#0e3824] transition-colors"
                  >
                    <ListOrdered className="h-3 w-3 mr-1" />
                    Rincian
                  </Button>
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-bold text-white tabular-nums">
                  {formatRupiah(currentAnonymous.totalContribution)}
                </div>
                <div className="text-xs text-emerald-300/80">
                  {currentAnonymous.donationCount} kali infaq tanpa nama
                </div>
              </div>
            </div>
          </div>
        </div>
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
        <div className={`space-y-6 transition-opacity duration-200 ${isPeriodLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

          {/* DIALOG MODAL RINCIAN INFAQ ANONIM (Issue #054 / F-018) */}
          <Dialog open={isAnonModalOpen} onOpenChange={setIsAnonModalOpen}>
            <DialogPopup className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ListOrdered className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle>Rincian Infaq Anonim & Kotak Amal</DialogTitle>
                      {(selectedYear !== null || selectedMonth !== null) && (
                        <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-semibold">
                          {activePeriodLabel}
                        </span>
                      )}
                    </div>
                    <DialogDescription>
                      Seluruh catatan transaksi terverifikasi tanpa identitas nama (kotak amal, tromol Jumat, dan hamba Allah).
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Ringkasan Akumulasi di Atas Tabel */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface border border-outline-variant/70 text-xs">
                <div>
                  <div className="text-on-surface-variant">Total Akumulasi Terverifikasi</div>
                  <div className="text-base font-bold text-primary tabular-nums mt-0.5">
                    {formatRupiah(currentAnonymous.totalContribution)}
                  </div>
                </div>
                <div className="border-l border-outline-variant/60 pl-3">
                  <div className="text-on-surface-variant">Total Transaksi</div>
                  <div className="text-base font-bold text-on-surface tabular-nums mt-0.5">
                    {currentAnonymous.donationCount} kali infaq
                  </div>
                </div>
              </div>

              {/* Pencarian Khusus di dalam Modal jika ada transaksi */}
              {anonTransactions.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant h-3.5 w-3.5" />
                  <Input
                    type="text"
                    placeholder="Cari rincian transaksi (misal: kotak amal, tromol)..."
                    value={anonSearch}
                    onChange={(e) => setAnonSearch(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-lg border-outline-variant bg-surface"
                  />
                </div>
              )}

              {/* Kontainer Daftar Transaksi (Scrollable) */}
              <div className="flex-1 overflow-y-auto max-h-[46vh] rounded-xl border border-outline-variant bg-surface/40 divide-y divide-outline-variant/70">
                {anonLoading ? (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Memuat rincian transaksi terverifikasi...</span>
                    </div>
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : anonError ? (
                  <div className="p-6 text-center space-y-3">
                    <ShieldAlert className="h-8 w-8 text-destructive mx-auto" />
                    <p className="text-xs text-destructive font-medium">{anonError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAnonymousTransactions(selectedYear, selectedMonth)}
                      className="gap-1.5 text-xs h-7"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Coba Lagi
                    </Button>
                  </div>
                ) : filteredAnonTx.length === 0 ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    {anonSearch
                      ? `Tidak ada transaksi yang cocok dengan kata kunci "${anonSearch}".`
                      : "Belum ada transaksi infaq anonim terverifikasi yang tercatat."}
                  </div>
                ) : (
                  filteredAnonTx.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-container transition-colors text-xs"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="font-semibold text-on-surface text-sm leading-snug">
                          {tx.description}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-on-surface-variant/70" />
                            {formatDateIndo(tx.transactionDate ?? tx.reportDate)}
                          </span>
                          <span>•</span>
                          <Link
                            href={`/laporan/${tx.reportId}`}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                            title="Buka laporan fisik asal"
                          >
                            <FileText className="h-3 w-3" />
                            <span>{tx.reportPeriod}</span>
                            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                          </Link>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
                          {formatRupiah(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <DialogFooter>
                <DialogClose className="w-full sm:w-auto">
                  Tutup
                </DialogClose>
              </DialogFooter>
            </DialogPopup>
          </Dialog>


          {/* 2. HEADER DAFTAR & SEARCH BAR */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                  Daftar Profil Donatur
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                  {filteredDonors.length} Donatur
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Urutan berdasarkan kontribusi infaq tertinggi ke terendah
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari nama donatur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-2xs"
              />
            </div>
          </div>

          {/* 3. DAFTAR KARTU LIST PROFIL DONATUR */}
          {filteredDonors.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white shadow-2xs">
              <ShieldAlert className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-900">
                {search ? "Donatur tidak ditemukan" : "Belum ada donatur terdata"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {search
                  ? `Tidak ada profil donatur yang cocok dengan kata kunci "${search}".`
                  : "Nama donatur yang diverifikasi oleh pengurus DKM akan otomatis muncul di sini."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
              <div className="divide-y divide-slate-100">
                {paginatedDonors.map((donor, idx) => {
                  const rank = (safePage - 1) * pageSize + idx + 1;
                  const isRankOne = rank === 1 && !search;
                  return (
                    <Link
                      key={donor.id}
                      href={`/donatur/${donor.id}`}
                      className="group flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-slate-50/70 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        {/* Badge Nomor Urut */}
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-transform group-hover:scale-105 ${isRankOne
                            ? "border border-[#b8860b]/50 text-[#b8860b] bg-[#b8860b]/10 shadow-xs"
                            : "border border-slate-200 text-slate-600 bg-slate-50"
                            }`}
                        >
                          #{rank}
                        </div>

                        {/* Nama Donatur */}
                        <div className="min-w-0">
                          <div className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                            {donor.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                              <UserCheck className="h-3 w-3 text-emerald-700" />
                              {donor.donationCount} infaq terverifikasi
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nominal Uang di Sisi Kanan (Tabular Nums) + Chevron */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-sm sm:text-lg font-bold text-slate-900 tabular-nums group-hover:text-emerald-800 transition-colors">
                          {formatRupiah(donor.totalContribution)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-800 group-hover:translate-x-1 transition-transform duration-150" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination Controls Footer */}
              <div className="px-4 py-2.5 bg-surface-container/40 border-t border-outline-variant/60">
                <PaginationControls
                  currentPage={safePage}
                  totalItems={filteredDonors.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 25, 50]}
                  itemLabel="donatur"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
