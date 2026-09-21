"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

export function DeleteAttachmentButton({ attachmentId }: { attachmentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"initial" | "force_warning">("initial");
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleOpenModal() {
    setStep("initial");
    setErrorMessage(null);
    setOpen(true);
  }

  async function executeDelete(force = false) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const url = force ? `/api/attachments/${attachmentId}?force=true` : `/api/attachments/${attachmentId}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setOpen(false);
        router.refresh();
        return;
      }

      if (res.status === 409 && data.hasVerifiedTransactions) {
        setVerifiedCount(data.verifiedCount ?? 1);
        setStep("force_warning");
        setLoading(false);
        return;
      }

      setErrorMessage(data.error ?? "Gagal menghapus lampiran. Silakan coba lagi.");
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan saat menghapus lampiran.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-lg"
        disabled={loading}
        onClick={handleOpenModal}
        title="Hapus Lampiran"
      >
        <Trash2 size={14} />
      </Button>

      <AlertDialog open={open} onOpenChange={(val) => { if (!loading) setOpen(val); }}>
        <AlertDialogPopup>
          {step === "initial" ? (
            <>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Trash2 className="size-5" />
                  </div>
                  <div>
                    <AlertDialogTitle>Hapus Lampiran Ini?</AlertDialogTitle>
                    <span className="text-xs text-muted-foreground">Tindakan permanen</span>
                  </div>
                </div>
                <AlertDialogDescription className="pt-2">
                  File lampiran akan dihapus secara permanen dari penyimpanan cloud. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <AlertDialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  onClick={() => executeDelete(false)}
                  className="gap-1.5"
                >
                  {loading && <Loader2 className="size-3.5 animate-spin" />}
                  {loading ? "Menghapus..." : "Ya, Hapus Lampiran"}
                </Button>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-amber-700 dark:text-amber-400">
                      Peringatan Transaksi Resmi
                    </AlertDialogTitle>
                    <span className="text-xs text-muted-foreground">Konfirmasi Penghapusan Paksa</span>
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      Lampiran ini memiliki <strong>{verifiedCount} transaksi</strong> yang sudah diverifikasi (sah masuk kas).
                    </p>
                  </div>
                  <AlertDialogDescription>
                    Menghapus lampiran ini akan <strong>menghapus permanen</strong> seluruh transaksi resmi terkait. Apakah Anda yakin ingin melakukan hapus paksa?
                  </AlertDialogDescription>
                </div>
              </AlertDialogHeader>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <AlertDialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                >
                  Batalkan
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  onClick={() => executeDelete(true)}
                  className="gap-1.5 bg-destructive hover:bg-destructive/90"
                >
                  {loading && <Loader2 className="size-3.5 animate-spin" />}
                  {loading ? "Menghapus Paksa..." : "Hapus Paksa Lampiran"}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
