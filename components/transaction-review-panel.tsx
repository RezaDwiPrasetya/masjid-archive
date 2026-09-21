"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Trash2,
  Pencil,
  X,
  Check,
  Loader2,
  TrendingUp,
  TrendingDown,
  ClipboardCheck,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface Transaction {
  id: string;
  type: string;
  amount: string | number;
  description: string | null;
  transactionDate: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy?: { id: string; name: string | null; email: string | null } | null;
}

interface TransactionReviewPanelProps {
  transactions: Transaction[];
  hasSession: boolean;
}

function formatRupiah(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TransactionRow({
  tx,
  hasSession,
  onConfirm,
  onDelete,
  onEdit,
}: {
  tx: Transaction;
  hasSession: boolean;
  onConfirm: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, data: Partial<Transaction>) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [editType, setEditType] = useState(tx.type);
  const [editAmount, setEditAmount] = useState(
    typeof tx.amount === "string"
      ? parseFloat(tx.amount).toString()
      : tx.amount.toString()
  );
  const [editDesc, setEditDesc] = useState(tx.description ?? "");
  const [editDate, setEditDate] = useState(
    tx.transactionDate ? tx.transactionDate.slice(0, 10) : ""
  );

  async function handleConfirm() {
    setConfirmLoading(true);
    try {
      await onConfirm(tx.id);
    } finally {
      setConfirmLoading(false);
    }
  }

  async function confirmDelete() {
    setDeleteLoading(true);
    try {
      await onDelete(tx.id);
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSave() {
    setEditError(null);
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      setEditError("Nominal harus berupa angka positif.");
      return;
    }
    setSaveLoading(true);
    try {
      await onEdit(tx.id, {
        type: editType,
        amount,
        description: editDesc || null,
        transactionDate: editDate || null,
      });
      setIsEditing(false);
    } finally {
      setSaveLoading(false);
    }
  }

  const isIncome = tx.type === "pemasukan";

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
          Edit Transaksi
        </p>
        {editError && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle size={12} /> {editError}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {/* Tipe */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Tipe</label>
            <Select value={editType} onValueChange={(v) => { if (v !== null) setEditType(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pemasukan">Pemasukan</SelectItem>
                <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Nominal */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Nominal (Rp)</label>
            <Input
              type="number"
              min="1"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          {/* Keterangan */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Keterangan</label>
            <Input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Keterangan transaksi"
            />
          </div>
          {/* Tanggal */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Tanggal (opsional)</label>
            <Input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={saveLoading}
            onClick={handleSave}
            className="gap-1.5"
          >
            {saveLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Simpan
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={saveLoading}
            onClick={() => {
              setIsEditing(false);
              setEditError(null);
            }}
          >
            <X size={13} />
            Batal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-2xl border p-4 transition-all duration-200 ${
        tx.isVerified
          ? "border-emerald-200/80 bg-emerald-50/60"
          : "border-amber-200/80 bg-amber-50/50 hover:border-amber-300"
      }`}
    >
      {/* Status pill */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tipe badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isIncome
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {isIncome ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {isIncome ? "Pemasukan" : "Pengeluaran"}
          </span>

          {/* Verified badge */}
          {tx.isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
              <ShieldCheck size={11} />
              Terverifikasi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
              <ClipboardCheck size={11} />
              Belum Diverifikasi
            </span>
          )}
        </div>

        {/* Actions — hanya tampil jika ada sesi & belum verified */}
        {hasSession && !tx.isVerified && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit transaksi"
              onClick={() => setIsEditing(true)}
            >
              <Pencil size={14} />
            </button>
            <button
              className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              title="Hapus transaksi"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Nominal & keterangan */}
      <div className="flex items-baseline gap-3 mb-1">
        <span
          className={`text-lg font-bold ${
            isIncome ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {isIncome ? "+" : "-"} {formatRupiah(tx.amount)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDate(tx.transactionDate)}
        </span>
      </div>

      {tx.description && (
        <p className="text-sm text-foreground/80">{tx.description}</p>
      )}

      {/* Verified by */}
      {tx.isVerified && tx.verifiedBy && (
        <p className="mt-2 text-xs text-muted-foreground">
          Dikonfirmasi oleh {tx.verifiedBy.name ?? tx.verifiedBy.email} ·{" "}
          {formatDate(tx.verifiedAt)}
        </p>
      )}

      {/* Tombol Konfirmasi — hanya untuk unverified & ada sesi */}
      {hasSession && !tx.isVerified && (
        <div className="mt-3 pt-3 border-t border-amber-200/60">
          <Button
            size="sm"
            disabled={confirmLoading}
            onClick={handleConfirm}
            className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            {confirmLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Mengonfirmasi…
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                Konfirmasi
              </>
            )}
          </Button>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Transaksi */}
      <AlertDialog open={deleteOpen} onOpenChange={(v) => { if (!deleteLoading) setDeleteOpen(v); }}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <div>
                <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                <span className="text-xs text-muted-foreground">
                  {isIncome ? "Pemasukan" : "Pengeluaran"} • {formatRupiah(tx.amount)}
                </span>
              </div>
            </div>
            <AlertDialogDescription className="pt-2">
              Baris transaksi hasil ekstraksi ini akan dihapus secara permanen. Tindakan ini cocok jika AI salah mengenali coretan atau baris yang bukan transaksi kas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={deleteLoading}
              onClick={() => setDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteLoading}
              onClick={confirmDelete}
              className="gap-1.5"
            >
              {deleteLoading && <Loader2 className="size-3.5 animate-spin" />}
              {deleteLoading ? "Menghapus..." : "Ya, Hapus Transaksi"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}

export function TransactionReviewPanel({
  transactions: initialTransactions,
  hasSession,
}: TransactionReviewPanelProps) {
  const router = useRouter();
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const unverified = transactions.filter((t) => !t.isVerified);
  const verified = transactions.filter((t) => t.isVerified);

  async function handleConfirm(id: string) {
    setGlobalError(null);
    try {
      const res = await fetch(`/api/transactions/${id}/confirm`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGlobalError(data.error ?? "Gagal mengonfirmasi transaksi.");
        return;
      }
      // Update state lokal HANYA setelah server sukses memproses konfirmasi
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                isVerified: true,
                verifiedAt: new Date().toISOString(),
              }
            : t
        )
      );
      router.refresh();
    } catch {
      setGlobalError("Tidak dapat terhubung ke server saat mengonfirmasi transaksi.");
    }
  }

  async function handleDelete(id: string) {
    setGlobalError(null);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGlobalError(data.error ?? "Gagal menghapus transaksi.");
        return;
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch {
      setGlobalError("Tidak dapat terhubung ke server saat menghapus transaksi.");
    }
  }

  async function handleEdit(id: string, data: Partial<Transaction>) {
    setGlobalError(null);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(data.type !== undefined && { type: data.type }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.transactionDate !== undefined && {
            transactionDate: data.transactionDate,
          }),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setGlobalError(json.error ?? "Gagal menyimpan perubahan.");
        return;
      }
      const json = await res.json();
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                type: json.data?.type ?? t.type,
                amount: json.data?.amount ?? t.amount,
                description: json.data?.description ?? t.description,
                transactionDate: json.data?.transactionDate ?? t.transactionDate,
              }
            : t
        )
      );
    } catch {
      setGlobalError("Tidak dapat terhubung ke server saat menyimpan perubahan.");
    }
  }

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Belum ada transaksi yang diekstrak dari lampiran ini.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {globalError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={15} className="shrink-0" />
          {globalError}
        </div>
      )}

      {/* Belum diverifikasi */}
      {unverified.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-amber-700">
              Menunggu Verifikasi
            </p>
            <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold h-5 min-w-5 px-1.5">
              {unverified.length}
            </span>
          </div>
          <div className="space-y-2">
            {unverified.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                hasSession={hasSession}
                onConfirm={handleConfirm}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sudah diverifikasi */}
      {verified.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-emerald-700">
              Sudah Diverifikasi
            </p>
            <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold h-5 min-w-5 px-1.5">
              {verified.length}
            </span>
          </div>
          <div className="space-y-2">
            {verified.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                hasSession={hasSession}
                onConfirm={handleConfirm}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
