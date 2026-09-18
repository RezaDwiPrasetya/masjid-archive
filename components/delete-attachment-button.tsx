"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteAttachmentButton({ attachmentId }: { attachmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Yakin ingin menghapus lampiran ini? Tindakan ini tidak dapat dibatalkan."
    );
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Gagal menghapus lampiran. Silakan coba lagi.");
    }
  }

  return (
    <Button
      variant="destructive"
      size="icon"
      className="h-8 w-8 shrink-0 rounded-lg"
      disabled={loading}
      onClick={handleDelete}
      title="Hapus Lampiran"
    >
      <Trash2 size={14} />
    </Button>
  );
}
