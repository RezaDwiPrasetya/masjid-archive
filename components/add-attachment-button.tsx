"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressFiles } from "@/lib/image-compression";

export function AddAttachmentButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setStatusText("Mengoptimalkan foto...");

    try {
      // Kompresi otomatis foto client-side sebelum diunggah (Issue #075)
      const compressedResults = await compressFiles(
        selectedFiles,
        {},
        (current, total) => {
          setStatusText(`Mengoptimalkan (${current}/${total})...`);
        }
      );

      setStatusText("Mengunggah berkas...");
      const formData = new FormData();
      compressedResults.forEach((res) => formData.append("files", res.file));

      const res = await fetch(`/api/reports/${reportId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Gagal menambahkan lampiran. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("[AddAttachmentButton] Error:", err);
      alert("Terjadi kesalahan saat memproses lampiran.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
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
            {statusText || "Memproses..."}
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
