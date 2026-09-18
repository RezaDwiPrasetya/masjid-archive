"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddAttachmentButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));

    const res = await fetch(`/api/reports/${reportId}/attachments`, {
      method: "POST",
      body: formData,
    });
    setLoading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error ?? "Gagal menambahkan lampiran. Silakan coba lagi.");
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Mengunggah...
          </>
        ) : (
          <>
            <PlusCircle size={16} className="mr-2" />
            Tambah Lampiran
          </>
        )}
      </Button>
    </div>
  );
}
