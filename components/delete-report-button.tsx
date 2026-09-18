"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Hapus laporan ini secara permanen?\n\nSemua lampiran (gambar, PDF, Excel) akan ikut terhapus dari storage dan tidak bisa dikembalikan."
    );
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Gagal menghapus laporan. Silakan coba lagi.");
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      className="w-full"
      disabled={loading}
      onClick={handleDelete}
    >
      <Trash2 size={15} />
      {loading ? "Menghapus..." : "Hapus Laporan"}
    </Button>
  );
}
