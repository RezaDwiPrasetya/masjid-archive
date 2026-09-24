"use client";

import { useState } from "react";
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
  User,
  UserCheck,
  UserPlus,
  UserX,
  AlertTriangle,
  RotateCcw,
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
import { normalizeDonorName, isAnonymousDonor } from "@/lib/donor-matching";

interface Transaction {
  id: string;
  type: string;
  amount: string | number;
  description: string | null;
  transactionDate: string | null;
  donorNameRaw?: string | null;
  donorId?: string | null;
  donor?: { id: string; name: string } | null;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy?: { id: string; name: string | null; email: string | null } | null;
  matchingFeedback?: {
    status: "existing" | "created" | "anonymous" | "none";
    donorName: string | null;
  } | null;
}

interface TransactionReviewPanelProps {
  transactions: Transaction[];
  hasSession: boolean;
  allVerifiedTransactions?: Transaction[];
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
  onUpdateDonor,
  onUnverify,
  duplicateWarning,
}: {
  tx: Transaction;
  hasSession: boolean;
  onConfirm: (id: string, donorNameRaw?: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, data: Partial<Transaction>) => Promise<void>;
  onUpdateDonor: (id: string, donorNameRaw: string | null) => Promise<void>;
  onUnverify?: (id: string) => Promise<void>;
  duplicateWarning?: {
    transactionDate: string | null;
    description: string | null;
  } | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unverifyLoading, setUnverifyLoading] = useState(false);
  const [unverifyOpen, setUnverifyOpen] = useState(false);
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

  // Field nama donatur untuk baris belum diverifikasi
  const [donorName, setDonorName] = useState(tx.donorNameRaw ?? "");
  const [editDonorName, setEditDonorName] = useState(tx.donorNameRaw ?? "");
  const [prevDonorNameRaw, setPrevDonorNameRaw] = useState(tx.donorNameRaw);

  // Field & state edit khusus donatur pada baris SUDAH diverifikasi
  const [isEditingDonor, setIsEditingDonor] = useState(false);
  const [editDonorInput, setEditDonorInput] = useState(
    tx.donorNameRaw ?? tx.donor?.name ?? ""
  );
  const [editDonorLoading, setEditDonorLoading] = useState(false);

  if (tx.donorNameRaw !== prevDonorNameRaw) {
    setPrevDonorNameRaw(tx.donorNameRaw);
    setDonorName(tx.donorNameRaw ?? "");
    setEditDonorName(tx.donorNameRaw ?? "");
    setEditDonorInput(tx.donorNameRaw ?? tx.donor?.name ?? "");
  }

  const isIncome = tx.type === "pemasukan";

  async function handleConfirm() {
    setConfirmLoading(true);
    try {
      await onConfirm(tx.id, isIncome ? donorName.trim() || null : null);
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

  async function confirmUnverify() {
    if (!onUnverify) return;
    setUnverifyLoading(true);
    try {
      await onUnverify(tx.id);
      setUnverifyOpen(false);
    } finally {
      setUnverifyLoading(false);
    }
  }

  async function handleSaveVerifiedDonor() {
    setEditDonorLoading(true);
    try {
      await onUpdateDonor(tx.id, editDonorInput.trim() || null);
      setIsEditingDonor(false);
    } finally {
      setEditDonorLoading(false);
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
        donorNameRaw:
          editType === "pemasukan" ? editDonorName.trim() || null : null,
      });
      setIsEditing(false);
    } finally {
      setSaveLoading(false);
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-surface-container-high p-4 space-y-3">
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
            <Select
              value={editType}
              onValueChange={(v) => {
                if (v !== null) setEditType(v);
              }}
            >
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
            <label className="text-xs text-muted-foreground font-medium">
              Nominal (Rp)
            </label>
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
            <label className="text-xs text-muted-foreground font-medium">
              Keterangan
            </label>
            <Input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Keterangan transaksi"
            />
          </div>
          {/* Tanggal */}
          <div className="col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground font-medium">
              Tanggal (opsional)
            </label>
            <Input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </div>
          {/* Nama Donatur (khusus pemasukan) */}
          {editType === "pemasukan" && (
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <User size={12} className="text-muted-foreground" />
                Nama Donatur (opsional)
              </label>
              <Input
                value={editDonorName}
                onChange={(e) => setEditDonorName(e.target.value)}
                placeholder="Nama donatur (kosongkan jika tanpa donatur)"
                className="text-xs"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={saveLoading}
            onClick={handleSave}
            className="gap-1.5"
          >
            {saveLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            Simpan
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={saveLoading}
            onClick={() => {
              setIsEditing(false);
              setEditError(null);
              setEditDonorName(tx.donorNameRaw ?? "");
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
      className={`group relative rounded-xl border p-4 transition-all duration-200 ${
        tx.isVerified
          ? "border-outline-variant bg-surface-container-high"
          : "border-amber-300/80 bg-surface-container-high hover:border-amber-400"
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

        {/* Actions — khusus transaksi terverifikasi: Batalkan Verifikasi */}
        {hasSession && tx.isVerified && onUnverify && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100/70 hover:bg-amber-200/80 border border-amber-300/70 transition-colors disabled:opacity-50"
              title="Batalkan Verifikasi transaksi ini"
              onClick={() => setUnverifyOpen(true)}
              disabled={unverifyLoading}
            >
              {unverifyLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RotateCcw size={12} />
              )}
              <span>Batalkan Verifikasi</span>
            </button>
          </div>
        )}
      </div>

      {/* Peringatan Visual Duplikat (khusus baris belum diverifikasi) */}
      {!tx.isVerified && duplicateWarning && (
        <div className="mb-2.5 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-300/80 p-2.5 text-xs text-amber-900 font-medium">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-800">
              ⚠️ Kemungkinan duplikat dari transaksi terverifikasi
            </p>
            <p className="text-[11px] text-amber-900/80 font-normal">
              Ditemukan transaksi terverifikasi dengan nominal sama ({formatRupiah(tx.amount)})
              {duplicateWarning.transactionDate
                ? ` pada tanggal ${formatDate(duplicateWarning.transactionDate)}`
                : " (tanpa tanggal)"}
              {duplicateWarning.description ? ` — "${duplicateWarning.description}"` : ""}.
            </p>
          </div>
        </div>
      )}

      {/* Nominal & keterangan */}
      <div className="flex items-baseline gap-3 mb-1">
        <span
          className={`text-lg font-bold tabular-nums ${
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

      {/* Donatur tertaut — untuk transaksi yang SUDAH diverifikasi */}
      {tx.isVerified && isIncome && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {!isEditingDonor ? (
            <>
              {tx.donor ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-100/80 border border-emerald-200/60 rounded-md px-2 py-0.5">
                  <User size={11} className="text-emerald-700" />
                  Donatur: <strong className="font-semibold">{tx.donor.name}</strong>
                </span>
              ) : isAnonymousDonor(normalizeDonorName(tx.donorNameRaw)) ? (
                <span className="inline-flex items-center gap-1 text-xs text-stone-600 italic bg-stone-100 border border-stone-200/60 rounded-md px-2 py-0.5">
                  <UserX size={11} className="text-stone-500" />
                  Tercatat sebagai donasi anonim
                </span>
              ) : tx.donorNameRaw ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-stone-100 border border-stone-200/60 rounded-md px-2 py-0.5">
                  <User size={11} />
                  {tx.donorNameRaw}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-stone-100/80 border border-dashed border-stone-300 rounded-md px-2 py-0.5">
                  <User size={11} className="text-stone-400" />
                  Tanpa donatur
                </span>
              )}

              {/* Ikon edit kecil di sebelah badge donatur untuk transaksi terverifikasi */}
              {hasSession && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDonor(true);
                    setEditDonorInput(tx.donorNameRaw ?? tx.donor?.name ?? "");
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-emerald-800 hover:bg-emerald-100/80 transition-colors"
                  title="Edit nama donatur"
                >
                  <Pencil size={12} />
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 w-full max-w-sm mt-1 animate-in fade-in duration-150">
              <Input
                value={editDonorInput}
                onChange={(e) => setEditDonorInput(e.target.value)}
                placeholder="Nama donatur (kosongkan jika tanpa donatur)"
                className="h-7 text-xs bg-white border-emerald-300 focus-visible:ring-emerald-500"
                disabled={editDonorLoading}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveVerifiedDonor();
                  } else if (e.key === "Escape") {
                    setIsEditingDonor(false);
                    setEditDonorInput(tx.donorNameRaw ?? tx.donor?.name ?? "");
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1"
                disabled={editDonorLoading}
                onClick={handleSaveVerifiedDonor}
                title="Simpan nama donatur"
              >
                {editDonorLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                disabled={editDonorLoading}
                onClick={() => {
                  setIsEditingDonor(false);
                  setEditDonorInput(tx.donorNameRaw ?? tx.donor?.name ?? "");
                }}
                title="Batal"
              >
                <X size={12} />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Feedback hasil matching langsung di kartu (setelah aksi konfirmasi) */}
      {tx.matchingFeedback && (
        <div
          className={`mt-2.5 flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium border animate-in fade-in duration-200 ${
            tx.matchingFeedback.status === "existing"
              ? "bg-emerald-100/90 text-emerald-900 border-emerald-300"
              : tx.matchingFeedback.status === "created"
              ? "bg-sky-50 text-sky-900 border-sky-200"
              : tx.matchingFeedback.status === "anonymous"
              ? "bg-stone-100 text-stone-700 border-stone-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {tx.matchingFeedback.status === "existing" && (
            <UserCheck size={14} className="shrink-0 text-emerald-700" />
          )}
          {tx.matchingFeedback.status === "created" && (
            <UserPlus size={14} className="shrink-0 text-sky-700" />
          )}
          {tx.matchingFeedback.status === "anonymous" && (
            <UserX size={14} className="shrink-0 text-stone-600" />
          )}
          {tx.matchingFeedback.status === "none" && (
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
          )}
          <span>
            {tx.matchingFeedback.status === "existing" &&
              `Ditautkan ke donatur: ${tx.matchingFeedback.donorName}`}
            {tx.matchingFeedback.status === "created" &&
              `Donatur baru dibuat: ${tx.matchingFeedback.donorName}`}
            {tx.matchingFeedback.status === "anonymous" &&
              "Tercatat sebagai donasi anonim"}
            {tx.matchingFeedback.status === "none" &&
              "Transaksi berhasil dikonfirmasi"}
          </span>
        </div>
      )}

      {/* Verified by */}
      {tx.isVerified && tx.verifiedBy && (
        <p className="mt-2 text-xs text-muted-foreground">
          Dikonfirmasi oleh {tx.verifiedBy.name ?? tx.verifiedBy.email} ·{" "}
          {formatDate(tx.verifiedAt)}
        </p>
      )}

      {/* Input Nama Donatur — hanya untuk pemasukan & unverified */}
      {!tx.isVerified && isIncome && (
        <div className="mt-3 pt-2.5 border-t border-amber-200/50 space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor={`donor-input-${tx.id}`}
              className="text-xs font-medium text-amber-900/80 flex items-center gap-1.5"
            >
              <User size={12} className="text-amber-700" />
              Nama Donatur
              <span className="text-[10px] text-muted-foreground font-normal">
                (opsional)
              </span>
            </label>
            {donorName && (
              <button
                type="button"
                onClick={() => setDonorName("")}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-medium"
                title="Kosongkan nama donatur"
              >
                Kosongkan
              </button>
            )}
          </div>
          <Input
            id={`donor-input-${tx.id}`}
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="Contoh: H. Kosasih (kosongkan jika tanpa donatur)"
            className="h-8 text-xs bg-white/90 border-amber-200 focus-visible:ring-emerald-500 placeholder:text-muted-foreground/60"
            disabled={confirmLoading || !hasSession}
          />
        </div>
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
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(v) => {
          if (!deleteLoading) setDeleteOpen(v);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <div>
                <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                <span className="text-xs text-muted-foreground">
                  {isIncome ? "Pemasukan" : "Pengeluaran"} •{" "}
                  {formatRupiah(tx.amount)}
                </span>
              </div>
            </div>
            <AlertDialogDescription className="pt-2">
              Baris transaksi hasil ekstraksi ini akan dihapus secara permanen.
              Tindakan ini cocok jika AI salah mengenali coretan atau baris yang
              bukan transaksi kas.
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

      {/* Dialog Konfirmasi Batalkan Verifikasi Transaksi */}
      <AlertDialog
        open={unverifyOpen}
        onOpenChange={(v) => {
          if (!unverifyLoading) setUnverifyOpen(v);
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <RotateCcw className="size-5" />
              </div>
              <div>
                <AlertDialogTitle>Batalkan Verifikasi Transaksi?</AlertDialogTitle>
                <span className="text-xs text-muted-foreground">
                  {isIncome ? "Pemasukan" : "Pengeluaran"} • {formatRupiah(tx.amount)}
                </span>
              </div>
            </div>
            <AlertDialogDescription className="pt-2 text-stone-600">
              Transaksi ini akan dianggap <strong>belum resmi lagi</strong> dan{" "}
              <strong>tidak dihitung di dashboard publik</strong> sampai dikonfirmasi ulang.
              <br />
              <br />
              Status transaksi akan kembali ke <strong>&quot;Menunggu Verifikasi&quot;</strong>{" "}
              sehingga Anda dapat mengoreksi data atau menghapusnya jika baris ini merupakan duplikat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={unverifyLoading}
              onClick={() => setUnverifyOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={unverifyLoading}
              onClick={confirmUnverify}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {unverifyLoading && <Loader2 className="size-3.5 animate-spin" />}
              {unverifyLoading ? "Membatalkan..." : "Ya, Batalkan Verifikasi"}
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
  allVerifiedTransactions,
}: TransactionReviewPanelProps) {
  const router = useRouter();
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [prevInitialTransactions, setPrevInitialTransactions] =
    useState(initialTransactions);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [confirmNotification, setConfirmNotification] = useState<{
    id: string;
    type: "existing" | "created" | "anonymous" | "none";
    message: string;
  } | null>(null);

  if (initialTransactions !== prevInitialTransactions) {
    setPrevInitialTransactions(initialTransactions);
    setTransactions(initialTransactions);
  }

  const unverified = transactions.filter((t) => !t.isVerified);
  const verified = transactions.filter((t) => t.isVerified);

  async function handleConfirm(id: string, donorNameRaw?: string | null) {
    setGlobalError(null);
    try {
      const res = await fetch(`/api/transactions/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorNameRaw: donorNameRaw ?? null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGlobalError(data.error ?? "Gagal mengonfirmasi transaksi.");
        return;
      }
      const json = await res.json();
      const confirmedData = json.data;

      // Update state lokal HANYA setelah server sukses memproses konfirmasi
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                isVerified: true,
                verifiedAt:
                  confirmedData?.verifiedAt ?? new Date().toISOString(),
                verifiedBy: confirmedData?.verifiedBy
                  ? { id: "", name: confirmedData.verifiedBy, email: null }
                  : t.verifiedBy,
                donorId: confirmedData?.donorId ?? null,
                donorNameRaw: confirmedData?.donorNameRaw ?? null,
                donor: confirmedData?.donor ?? null,
                matchingFeedback: confirmedData?.matchingResult ?? null,
              }
            : t
        )
      );

      // Tampilkan notifikasi tingkat panel
      if (confirmedData?.matchingResult) {
        const { status, donorName } = confirmedData.matchingResult;
        if (status === "existing") {
          setConfirmNotification({
            id,
            type: "existing",
            message: `Ditautkan ke donatur: ${donorName}`,
          });
        } else if (status === "created") {
          setConfirmNotification({
            id,
            type: "created",
            message: `Donatur baru dibuat: ${donorName}`,
          });
        } else if (status === "anonymous") {
          setConfirmNotification({
            id,
            type: "anonymous",
            message: "Tercatat sebagai donasi anonim",
          });
        } else {
          setConfirmNotification({
            id,
            type: "none",
            message: "Transaksi berhasil dikonfirmasi",
          });
        }
      } else {
        setConfirmNotification({
          id,
          type: "none",
          message: "Transaksi berhasil dikonfirmasi",
        });
      }

      router.refresh();
    } catch {
      setGlobalError(
        "Tidak dapat terhubung ke server saat mengonfirmasi transaksi."
      );
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
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.transactionDate !== undefined && {
            transactionDate: data.transactionDate,
          }),
          ...(data.donorNameRaw !== undefined && {
            donorNameRaw: data.donorNameRaw,
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
                donorNameRaw:
                  json.data?.donorNameRaw !== undefined
                    ? json.data?.donorNameRaw
                    : t.donorNameRaw,
              }
            : t
        )
      );
    } catch {
      setGlobalError(
        "Tidak dapat terhubung ke server saat menyimpan perubahan."
      );
    }
  }

  async function handleUpdateDonor(
    id: string,
    donorNameRaw: string | null
  ) {
    setGlobalError(null);
    try {
      const res = await fetch(`/api/transactions/${id}/donor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorNameRaw }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setGlobalError(json.error ?? "Gagal mengupdate nama donatur.");
        return;
      }
      const json = await res.json();
      const updatedData = json.data;

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                donorId: updatedData?.donorId ?? null,
                donorNameRaw: updatedData?.donorNameRaw ?? null,
                donor: updatedData?.donor ?? null,
                matchingFeedback: updatedData?.matchingResult ?? null,
              }
            : t
        )
      );

      if (updatedData?.matchingResult) {
        const { status, donorName } = updatedData.matchingResult;
        if (status === "existing") {
          setConfirmNotification({
            id,
            type: "existing",
            message: `Ditautkan ke donatur: ${donorName}`,
          });
        } else if (status === "created") {
          setConfirmNotification({
            id,
            type: "created",
            message: `Donatur baru dibuat: ${donorName}`,
          });
        } else if (status === "anonymous") {
          setConfirmNotification({
            id,
            type: "anonymous",
            message: "Tercatat sebagai donasi anonim",
          });
        } else {
          setConfirmNotification({
            id,
            type: "none",
            message: "Nama donatur diperbarui",
          });
        }
      }
      router.refresh();
    } catch {
      setGlobalError(
        "Tidak dapat terhubung ke server saat mengupdate nama donatur."
      );
    }
  }

  async function handleUnverify(id: string) {
    setGlobalError(null);
    try {
      const res = await fetch(`/api/transactions/${id}/unverify`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setGlobalError(json.error ?? "Gagal membatalkan verifikasi transaksi.");
        return;
      }
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                isVerified: false,
                verifiedAt: null,
                verifiedBy: null,
                matchingFeedback: null,
              }
            : t
        )
      );
      setConfirmNotification({
        id,
        type: "none",
        message:
          "Verifikasi transaksi berhasil dibatalkan. Baris dikembalikan ke status 'Menunggu Verifikasi'.",
      });
      router.refresh();
    } catch {
      setGlobalError(
        "Tidak dapat terhubung ke server saat membatalkan verifikasi."
      );
    }
  }

  // Pool transaksi terverifikasi untuk deteksi duplikat (lintas attachment jika ada, atau dalam panel ini)
  const verifiedPool = allVerifiedTransactions ?? verified;

  function getDuplicateWarning(tx: Transaction) {
    const txAmount =
      typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
    const txDate = tx.transactionDate ? tx.transactionDate.slice(0, 10) : null;

    const match = verifiedPool.find((v) => {
      if (v.id === tx.id) return false;
      const vAmount =
        typeof v.amount === "string" ? parseFloat(v.amount) : v.amount;
      const vDate = v.transactionDate ? v.transactionDate.slice(0, 10) : null;
      return (
        v.isVerified &&
        tx.type === v.type &&
        txAmount === vAmount &&
        txDate === vDate
      );
    });

    if (match) {
      return {
        transactionDate: match.transactionDate,
        description: match.description,
      };
    }
    return null;
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

      {/* Pemberitahuan Hasil Konfirmasi / Update Donatur */}
      {confirmNotification && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm border transition-all animate-in fade-in duration-200 ${
            confirmNotification.type === "existing"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : confirmNotification.type === "created"
              ? "bg-sky-50 text-sky-800 border-sky-200"
              : confirmNotification.type === "anonymous"
              ? "bg-stone-100 text-stone-800 border-stone-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {confirmNotification.type === "existing" && (
              <UserCheck size={16} className="text-emerald-600 shrink-0" />
            )}
            {confirmNotification.type === "created" && (
              <UserPlus size={16} className="text-sky-600 shrink-0" />
            )}
            {confirmNotification.type === "anonymous" && (
              <UserX size={16} className="text-stone-600 shrink-0" />
            )}
            {confirmNotification.type === "none" && (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            )}
            <span>
              <strong className="font-semibold">
                {confirmNotification.message}
              </strong>
            </span>
          </div>
          <button
            onClick={() => setConfirmNotification(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            title="Tutup pemberitahuan"
          >
            <X size={14} />
          </button>
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
                onUpdateDonor={handleUpdateDonor}
                onUnverify={handleUnverify}
                duplicateWarning={getDuplicateWarning(tx)}
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
                onUpdateDonor={handleUpdateDonor}
                onUnverify={handleUnverify}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
