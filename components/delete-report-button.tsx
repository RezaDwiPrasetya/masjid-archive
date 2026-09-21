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

export function DeleteReportButton({ reportId }: { reportId: string }) {
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
      const url = force ? `/api/reports/${reportId}?force=true` : `/api/reports/${reportId}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setOpen(false);
        router.push("/");
        router.refresh();
        return;
      }

      if (res.status === 409 && data.hasVerifiedTransactions) {
        setVerifiedCount(data.verifiedCount ?? 1);
        setStep("force_warning");
        setLoading(false);
        return;
      }

      setErrorMessage(data.error ?? "Gagal menghapus laporan. Silakan coba lagi.");
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan saat menghapus laporan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="w-full gap-1.5"
        onClick={handleOpenModal}
      >
        <Trash2 size={15} />
        Hapus Laporan
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
                    <AlertDialogTitle>Hapus Laporan?</AlertDialogTitle>
                    <span className="text-xs text-muted-foreground">Tindakan permanen</span>
                  </div>
                </div>
                <AlertDialogDescription className="pt-2">
                  Laporan beserta seluruh lampiran (foto, PDF, spreadsheet) akan dihapus secara permanen dari arsip. File di penyimpanan cloud juga akan dibersihkan.
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
                  {loading ? "Menghapus..." : "Ya, Hapus Laporan"}
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
                      Laporan ini memiliki <strong>{verifiedCount} transaksi</strong> yang sudah diverifikasi (sah masuk pembukuan kas masjid).
                    </p>
                  </div>
                  <AlertDialogDescription>
                    Menghapus laporan ini akan <strong>menghapus permanen</strong> seluruh transaksi resmi tersebut dari kas masjid. Apakah Anda benar-benar yakin ingin melakukan hapus paksa?
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
                  {loading ? "Menghapus Paksa..." : "Hapus Paksa Laporan"}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
