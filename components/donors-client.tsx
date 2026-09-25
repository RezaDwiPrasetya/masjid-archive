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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export function DonorsClient({ donors, anonymous }: DonorsClientProps) {
  const [search, setSearch] = React.useState("");

  // State untuk modal rincian infaq anonim (Issue #054 / F-018)
  const [isAnonModalOpen, setIsAnonModalOpen] = React.useState(false);
  const [anonLoading, setAnonLoading] = React.useState(false);
  const [anonError, setAnonError] = React.useState<string | null>(null);
  const [anonTransactions, setAnonTransactions] = React.useState<AnonymousTransaction[]>([]);
  const [anonSearch, setAnonSearch] = React.useState("");

  // Ambil data transaksi anonim hanya saat modal dibuka pertama kali
  const fetchAnonymousTransactions = React.useCallback(async () => {
    setAnonLoading(true);
    setAnonError(null);
    try {
      const res = await fetch("/api/donors/anonymous/transactions");
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
  }, []);

  const handleOpenAnonModal = () => {
    setIsAnonModalOpen(true);
    if (anonTransactions.length === 0 && !anonLoading) {
      fetchAnonymousTransactions();
    }
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
    if (!search.trim()) return donors;
    const q = search.toLowerCase();
    return donors.filter((d) => d.name.toLowerCase().includes(q));
  }, [donors, search]);

  const totalNamedDonations = donors.reduce(
    (acc, d) => acc + d.totalContribution,
    0
  );

  return (
    <PageShell>
      <div className="space-y-8">
        {/* Page Title Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Daftar Donatur</h1>
          <p className="text-sm text-on-surface-variant">
            Transparansi catatan infaq dan kontribusi para donatur terverifikasi kas masjid.
          </p>
        </div>

        {/* 1. DUA KARTU KPI SIMETRIS (50:50) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Donatur Terdaftar */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container/70 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Donatur Terdata
              </span>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Terverifikasi
              </span>
            </div>
            <div>
              <div className="text-3xl font-bold text-on-surface tabular-nums">
                {donors.length} Donatur
              </div>
              <p className="text-sm text-on-surface-variant mt-1.5">
                Total kontribusi: <span className="font-semibold text-primary tabular-nums">{formatRupiah(totalNamedDonations)}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Infaq Anonim / Tromol dengan Tombol Rincian */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container/70 p-6 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Infaq Anonim (Tromol / Kotak Amal)
                </span>
                <span className="rounded-full bg-surface-container-high border border-outline-variant px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                  Tanpa Profil
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold text-on-surface tabular-nums">
                  {formatRupiah(anonymous.totalContribution)}
                </div>
                <p className="text-sm text-on-surface-variant mt-1.5">
                  Akumulasi dari <span className="font-semibold text-on-surface tabular-nums">{anonymous.donationCount} kali</span> infaq tromol / kotak amal tanpa nama individual.
                </p>
              </div>
            </div>

            {/* Aksi Audit Transparansi (Issue #054) */}
            <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                Riwayat kotak amal & hamba Allah
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAnonModal}
                className="h-8 gap-1.5 text-xs font-semibold rounded-xl border-outline-variant hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span>Lihat Rincian</span>
              </Button>
            </div>
          </div>
        </div>

        {/* DIALOG MODAL RINCIAN INFAQ ANONIM (Issue #054 / F-018) */}
        <Dialog open={isAnonModalOpen} onOpenChange={setIsAnonModalOpen}>
          <DialogPopup className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListOrdered className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle>Rincian Infaq Anonim & Kotak Amal</DialogTitle>
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
                  {formatRupiah(anonymous.totalContribution)}
                </div>
              </div>
              <div className="border-l border-outline-variant/60 pl-3">
                <div className="text-on-surface-variant">Total Transaksi</div>
                <div className="text-base font-bold text-on-surface tabular-nums mt-0.5">
                  {anonymous.donationCount} kali infaq
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
                    onClick={fetchAnonymousTransactions}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-on-surface">
                Daftar Profil Donatur
              </h2>
              <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant border border-outline-variant">
                {filteredDonors.length} Donatur
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Urutan berdasarkan kontribusi infaq tertinggi ke terendah
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant h-4 w-4" />
            <Input
              type="text"
              placeholder="Cari nama donatur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm rounded-xl border-outline-variant bg-surface-container shadow-xs"
            />
          </div>
        </div>

        {/* 3. DAFTAR KARTU LIST PROFIL DONATUR */}
        {filteredDonors.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-outline-variant bg-surface/50">
            <ShieldAlert className="h-10 w-10 text-on-surface-variant/40 mx-auto mb-3" />
            <p className="text-base font-semibold text-on-surface">
              {search ? "Donatur tidak ditemukan" : "Belum ada donatur terdata"}
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              {search
                ? `Tidak ada profil donatur yang cocok dengan kata kunci "${search}".`
                : "Nama donatur yang diverifikasi oleh pengurus DKM akan otomatis muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant bg-surface-container/60 shadow-xs overflow-hidden divide-y divide-outline-variant">
            {filteredDonors.map((donor, idx) => {
              const rank = idx + 1;
              const isRankOne = rank === 1 && !search;
              return (
                <Link
                  key={donor.id}
                  href={`/donatur/${donor.id}`}
                  className="group flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-surface-container-high transition-colors duration-150"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {/* Badge Nomor Urut */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-transform group-hover:scale-105 ${
                        isRankOne
                          ? "border border-amber-500/40 text-amber-800 dark:text-amber-200 bg-amber-500/15"
                          : "border border-outline-variant text-on-surface-variant bg-surface"
                      }`}
                    >
                      #{rank}
                    </div>

                    {/* Nama Donatur */}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors leading-snug">
                        {donor.name}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 border border-outline-variant text-[11px] font-medium">
                          <UserCheck className="h-3 w-3 text-primary" />
                          {donor.donationCount} kali infaq terverifikasi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nominal Uang di Sisi Kanan (Tabular Nums) + Chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base sm:text-lg font-bold text-on-surface tabular-nums group-hover:text-primary transition-colors">
                      {formatRupiah(donor.totalContribution)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-on-surface-variant/60 group-hover:text-primary group-hover:translate-x-1 transition-transform duration-150" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
