"use client";

import { useState } from "react";
import {
  Banknote,
  Building2,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Trash2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/page-shell";
import {
  Dialog,
  DialogPopup,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import { PaginationControls } from "@/components/ui/pagination-controls";

export interface TreasurySummary {
  totalBalance: number;
  cash: {
    balance: number;
    baselineBalance?: number;
    income: number;
    expense: number;
    transfersIn: number;
    transfersOut: number;
  };
  bank: {
    balance: number;
    income: number;
    expense: number;
    transfersIn: number;
    transfersOut: number;
  };
}

export interface TreasuryTransferItem {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  transferDate: string | Date;
  description: string | null;
  createdBy?: {
    name: string | null;
    role: string | null;
  } | null;
}

export interface TreasuryTransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  transactionDate: string | Date | null;
  category: string | null;
  paymentMethod: string;
  donorName?: string | null;
  reportId?: string;
  reportDate?: string | Date;
}

interface TreasuryClientProps {
  initialSummary: TreasurySummary;
  initialBreakdowns: {
    cashExpensesByCategory: Record<string, number>;
    bankExpensesByCategory: Record<string, number>;
  };
  initialTransfers: TreasuryTransferItem[];
  initialTransactions: TreasuryTransactionItem[];
  isStaffUser: boolean;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TreasuryClient({
  initialSummary,
  initialBreakdowns,
  initialTransfers,
  initialTransactions,
  isStaffUser,
}: TreasuryClientProps) {
  const [summary, setSummary] = useState<TreasurySummary>(initialSummary);
  const [breakdowns, setBreakdowns] = useState(initialBreakdowns);
  const [transfers, setTransfers] = useState<TreasuryTransferItem[]>(initialTransfers);
  const [transactions, setTransactions] = useState<TreasuryTransactionItem[]>(initialTransactions);

  const [activeTab, setActiveTab] = useState<"allocation" | "transfers" | "transactions">("allocation");

  // Modal State Mutasi Internal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferType, setTransferType] = useState<"CASH_TO_BANK" | "BANK_TO_CASH">("CASH_TO_BANK");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refresh data function
  const refreshData = async () => {
    try {
      const res = await fetch("/api/treasury");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setBreakdowns(data.breakdowns);
        setTransfers(data.recentTransfers || []);
        setTransactions(data.recentTransactions || []);
      }
    } catch (e) {
      console.error("Gagal refresh data treasury:", e);
    }
  };

  // Paginasi Mutasi Internal
  const [trPage, setTrPage] = useState(1);
  const [trPageSize, setTrPageSize] = useState(10);
  const trTotalPages = Math.max(1, Math.ceil(transfers.length / trPageSize));
  const trSafePage = Math.min(trPage, trTotalPages);
  const paginatedTransfers = transfers.slice((trSafePage - 1) * trPageSize, trSafePage * trPageSize);

  // Paginasi Transaksi per Kanal
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(15);
  const txTotalPages = Math.max(1, Math.ceil(transactions.length / txPageSize));
  const txSafePage = Math.min(txPage, txTotalPages);
  const paginatedTransactions = transactions.slice((txSafePage - 1) * txPageSize, txSafePage * txPageSize);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const amountNum = parseFloat(transferAmount.replace(/[^0-9]/g, ""));
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Nominal mutasi harus lebih besar dari Rp 0.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fromAccount: transferType === "CASH_TO_BANK" ? "TUNAI" : "BANK",
        toAccount: transferType === "CASH_TO_BANK" ? "BANK" : "TUNAI",
        amount: amountNum,
        transferDate: new Date(transferDate).toISOString(),
        description: transferDesc.trim() || undefined,
      };

      const res = await fetch("/api/treasury/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mencatat mutasi internal.");
      }

      setSuccessMessage(json.message);
      setTransferAmount("");
      setTransferDesc("");
      setDialogOpen(false);
      await refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat menyimpan mutasi.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan/menghapus catatan mutasi kas ini?")) {
      return;
    }

    try {
      const res = await fetch(`/api/treasury/transfers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus mutasi.");
      }
    } catch {
      alert("Gagal menghapus mutasi kas internal.");
    }
  };

  // Rasio likuiditas
  const total = Math.max(summary.totalBalance, 1);
  const cashRatio = Math.max(0, Math.min(100, Math.round((summary.cash.balance / total) * 100)));
  const bankRatio = Math.max(0, Math.min(100, Math.round((summary.bank.balance / total) * 100)));

  const heroContent = (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-primary-fixed">
          <Wallet className="h-4 w-4 shrink-0" />
          <span>Posisi Kas Riil & Perbendaharaan • DKM Masjid Al-Luqman</span>
        </div>
        {isStaffUser && (
          <Button
            size="sm"
            onClick={() => {
              setErrorMessage(null);
              setDialogOpen(true);
            }}
            className="h-8 gap-1.5 text-xs font-semibold rounded-lg bg-primary-container border-primary-fixed/30 text-on-primary hover:bg-primary-fixed hover:text-primary transition-colors"
          >
            <ArrowRightLeft size={14} />
            Catat Mutasi Kas Internal
          </Button>
        )}
      </div>

      <div className="mt-3 text-3xl sm:text-5xl md:text-[56px] font-semibold leading-tight md:leading-[64px] tracking-tight tabular-nums text-on-primary">
        {formatRupiah(summary.totalBalance)}
      </div>

      <div className="mt-2 text-xs md:text-sm text-primary-fixed/80">
        Total likuiditas gabungan: kas fisik di brankas ({cashRatio}%) dan rekening bank / QRIS resmi ({bankRatio}%)
      </div>

      {/* Sub-indikator Kas Fisik vs Kas Bank di dalam Hero Band */}
      <div className="mt-6 pt-5 border-t border-primary-container grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-primary-container/40 border border-primary-fixed/15 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-primary-fixed uppercase tracking-wider">
              Kas Fisik (Tunai / Brankas)
            </span>
            <span className="text-[11px] font-bold text-primary-fixed tabular-nums">
              {cashRatio}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-primary tabular-nums">
            {formatRupiah(summary.cash.balance)}
          </div>
          <div className="text-xs text-primary-fixed/70">
            Uang tunai operasional harian DKM
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-primary-container/40 border border-primary-fixed/15 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-primary-fixed uppercase tracking-wider">
              Kas Bank / Digital (QRIS)
            </span>
            <span className="text-[11px] font-bold text-primary-fixed tabular-nums">
              {bankRatio}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-primary tabular-nums">
            {formatRupiah(summary.bank.balance)}
          </div>
          <div className="text-xs text-primary-fixed/70">
            Saldo di rekening BSI, Muamalat & QRIS
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageShell heroBand={heroContent}>
      <div className="space-y-6">
        {/* Banner Notifikasi Sukses / Error */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline ml-4"
            >
              Tutup
            </button>
          </div>
        )}

      {/* Tab Navigasi Konten */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60">
        <button
          onClick={() => setActiveTab("allocation")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "allocation"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="flex items-center gap-2">
            <Layers size={16} />
            Alokasi Pengeluaran (Tunai vs Bank)
          </span>
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "transfers"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="flex items-center gap-2">
            <ArrowRightLeft size={16} />
            Mutasi Internal ({transfers.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "transactions"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="flex items-center gap-2">
            <Calendar size={16} />
            Daftar Transaksi per Kanal
          </span>
        </button>
      </div>

      {/* TAB 1: ALOKASI PENGELUARAN (TUNAI VS BANK) */}
      {activeTab === "allocation" && (
        <div className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            Rincian penggunaan dana kas masjid berdasarkan sumber pembayaran: pos belanja mana yang dibayar dengan uang tunai brankas dan mana yang melalui transfer rekening bank.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom 1: Pengeluaran Kas Fisik (Tunai) */}
            <div className="p-5 rounded-2xl border border-outline-variant/80 bg-surface-container space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-on-surface">
                    Belanja Kas Tunai (Fisik)
                  </h2>
                </div>
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                  Total: {formatRupiah(summary.cash.expense)}
                </Badge>
              </div>

              {Object.keys(breakdowns.cashExpensesByCategory).length === 0 ? (
                <div className="py-8 text-center text-sm text-on-surface-variant">
                  Belum ada catatan pengeluaran kas tunai.
                </div>
              ) : (
                <div className="space-y-3">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const amount = breakdowns.cashExpensesByCategory[cat.value] || 0;
                    if (amount <= 0) return null;
                    const percent = Math.round((amount / Math.max(summary.cash.expense, 1)) * 100);

                    return (
                      <div key={cat.value} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-on-surface flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>{cat.label}</span>
                          </span>
                          <span className="font-bold text-on-surface tabular-nums">
                            {formatRupiah(amount)} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className="h-full rounded-full bg-emerald-600"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Kolom 2: Pengeluaran Kas Bank / QRIS */}
            <div className="p-5 rounded-2xl border border-outline-variant/80 bg-surface-container space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-base font-bold text-on-surface">
                    Belanja Kas Bank / Digital
                  </h2>
                </div>
                <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                  Total: {formatRupiah(summary.bank.expense)}
                </Badge>
              </div>

              {Object.keys(breakdowns.bankExpensesByCategory).length === 0 ? (
                <div className="py-8 text-center text-sm text-on-surface-variant">
                  Belum ada catatan pengeluaran dari rekening bank.
                </div>
              ) : (
                <div className="space-y-3">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const amount = breakdowns.bankExpensesByCategory[cat.value] || 0;
                    if (amount <= 0) return null;
                    const percent = Math.round((amount / Math.max(summary.bank.expense, 1)) * 100);

                    return (
                      <div key={cat.value} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-on-surface flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>{cat.label}</span>
                          </span>
                          <span className="font-bold text-on-surface tabular-nums">
                            {formatRupiah(amount)} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className="h-full rounded-full bg-blue-600"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MUTASI INTERNAL (SETOR / TARIK TUNAI) */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Riwayat pergeseran kas internal antara uang tunai di brankas dengan rekening bank DKM (mis. setor kotak Jum&apos;at atau tarik tunai operasional).
            </p>
          </div>

          {transfers.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-outline-variant text-center space-y-2">
              <ArrowRightLeft className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-on-surface">Belum ada mutasi internal kas</p>
              <p className="text-xs text-on-surface-variant">
                Saat bendahara menyetor uang fisik ke bank atau menarik uang dari bank, catat mutasinya agar saldo brankas dan bank tetap sinkron.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-outline-variant/80 overflow-hidden bg-surface-container shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-high/60 border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Arah Mutasi</th>
                      <th className="px-4 py-3">Nominal</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-4 py-3">Dicatat Oleh</th>
                      {isStaffUser && <th className="px-4 py-3 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {paginatedTransfers.map((tr) => {
                      const isCashToBank = tr.fromAccount === "TUNAI" && tr.toAccount === "BANK";
                      return (
                        <tr key={tr.id} className="hover:bg-surface-container-high/40 transition-colors">
                          <td className="px-4 py-3 text-xs text-on-surface whitespace-nowrap">
                            {formatDate(tr.transferDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isCashToBank ? (
                              <Badge className="bg-blue-100 text-blue-800 border border-blue-200 gap-1 text-[11px] font-semibold">
                                <ArrowUpRight size={13} />
                                Setor Tunai (Tunai ➡️ Bank)
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 gap-1 text-[11px] font-semibold">
                                <ArrowDownLeft size={13} />
                                Tarik Tunai (Bank ➡️ Tunai)
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold tabular-nums text-on-surface whitespace-nowrap">
                            {formatRupiah(tr.amount)}
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant max-w-[280px] truncate">
                            {tr.description || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                            {tr.createdBy?.name || "Staf DKM"}
                          </td>
                          {isStaffUser && (
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleDeleteTransfer(tr.id)}
                                className="text-on-surface-variant hover:text-rose-600 hover:bg-rose-50"
                                title="Hapus mutasi"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer Mutasi Internal */}
              {transfers.length > 10 && (
                <div className="px-4 py-2.5 bg-surface-container/40 border-t border-outline-variant/60">
                  <PaginationControls
                    currentPage={trSafePage}
                    totalItems={transfers.length}
                    pageSize={trPageSize}
                    onPageChange={setTrPage}
                    onPageSizeChange={setTrPageSize}
                    pageSizeOptions={[10, 20, 50]}
                    itemLabel="mutasi"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAFTAR TRANSAKSI PER KANAL */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            Daftar transaksi kas terverifikasi lengkap dengan penanda kanal apakah bersumber dari uang tunai atau rekening bank/QRIS.
          </p>

          <div className="rounded-2xl border border-outline-variant/80 overflow-hidden bg-surface-container shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-high/60 border-b border-outline-variant text-xs font-semibold text-on-surface-variant uppercase">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kanal Kas</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Uraian / Keterangan</th>
                    <th className="px-4 py-3">Kategori / Donatur</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {paginatedTransactions.map((tx) => {
                    const isIncome = tx.type === "pemasukan";
                    const isCash = (tx.paymentMethod ?? "TUNAI").toUpperCase() === "TUNAI";

                    return (
                      <tr key={tx.id} className="hover:bg-surface-container-high/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-on-surface whitespace-nowrap">
                          {formatDate(tx.transactionDate || tx.reportDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isCash ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[11px] gap-1">
                              <Banknote size={12} />
                              Kas Fisik (Tunai)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 text-[11px] gap-1">
                              <Building2 size={12} />
                              Bank / QRIS
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${
                              isIncome ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {isIncome ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface max-w-[260px] truncate">
                          {tx.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                          {tx.category ? (
                            <span className="capitalize">{tx.category}</span>
                          ) : tx.donorName ? (
                            <span>{tx.donorName}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums whitespace-nowrap">
                          <span className={isIncome ? "text-emerald-700" : "text-rose-700"}>
                            {isIncome ? "+" : "-"} {formatRupiah(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer Transaksi per Kanal */}
            <div className="px-4 py-2.5 bg-surface-container/40 border-t border-outline-variant/60">
              <PaginationControls
                currentPage={txSafePage}
                totalItems={transactions.length}
                pageSize={txPageSize}
                onPageChange={setTxPage}
                onPageSizeChange={setTxPageSize}
                pageSizeOptions={[10, 15, 30, 50]}
                itemLabel="transaksi"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: CATAT MUTASI INTERNAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPopup className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowRightLeft className="text-primary" size={20} />
              Catat Mutasi Kas Internal
            </DialogTitle>
            <DialogDescription className="text-xs text-on-surface-variant">
              Gunakan form ini saat memindahkan uang antara kas fisik di brankas dengan rekening bank/QRIS masjid.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateTransfer} className="space-y-4 pt-2">
            {/* Pilihan Arah Mutasi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Arah Pemindahan Kas</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransferType("CASH_TO_BANK")}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    transferType === "CASH_TO_BANK"
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : "border-outline-variant hover:bg-surface-container"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ArrowUpRight size={14} className="text-blue-600" />
                    Setor ke Bank
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Tunai ➡️ Bank
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransferType("BANK_TO_CASH")}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    transferType === "BANK_TO_CASH"
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : "border-outline-variant hover:bg-surface-container"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ArrowDownLeft size={14} className="text-emerald-600" />
                    Tarik Tunai
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Bank ➡️ Tunai
                  </span>
                </button>
              </div>
            </div>

            {/* Nominal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Nominal Pemindahan (Rp)</label>
              <Input
                type="number"
                min="1000"
                step="1000"
                placeholder="mis. 500000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                required
                className="rounded-xl font-bold tabular-nums"
              />
            </div>

            {/* Tanggal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Tanggal Mutasi</label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
                className="rounded-xl text-xs"
              />
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Keterangan / Alasan (Opsional)</label>
              <Input
                type="text"
                maxLength={500}
                placeholder="mis. Setor hasil infak Jum'at ke rekening BSI"
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl text-xs bg-primary text-on-primary hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Mutasi Kas"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </Dialog>
    </div>
  </PageShell>
  );
}
