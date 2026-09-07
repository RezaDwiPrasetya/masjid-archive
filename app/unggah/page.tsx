"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudUpload, ImagePlus, AlertTriangle } from "lucide-react";

type UserOption = { id: string; name: string; role: string };

export default function UnggahLaporanPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState("");
  const [uploadedById, setUploadedById] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((json) => setUsers(json.data ?? []));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file || !reportDate || !uploadedById) {
      setError("Foto, tanggal, dan pengunggah wajib diisi");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("reportDate", reportDate);
    formData.append("uploadedById", uploadedById);

    const res = await fetch("/api/reports", { method: "POST", body: formData });
    setLoading(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
    }
  }

  return (
    <AppShell active="/unggah">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Unggah Laporan Baru</h1>
        <p className="text-muted-foreground">
          Tambahkan dokumen keuangan baru ke arsip komunitas. Pastikan gambar jelas dan terang.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="relative flex h-80 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card text-center hover:border-primary">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <>
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <ImagePlus size={32} />
              </div>
              <h2 className="mb-1 font-semibold text-foreground">Ambil Foto atau Unggah</h2>
              <p className="max-w-xs px-4 text-sm text-muted-foreground">
                Ketuk di sini untuk memilih gambar dari perangkat Anda.
              </p>
            </>
          )}
        </label>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertTriangle className="text-destructive" size={20} />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <h3 className="font-semibold text-foreground">Detail Laporan</h3>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Tanggal Laporan
            </label>
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih tanggal laporan ini dibacakan (biasanya hari Jumat)
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Diunggah oleh
            </label>
            <Select
            items={users.map((u) => ({ label: `${u.name} (${u.role})`, value: u.id }))}
            value={uploadedById}
            onValueChange={(value) => setUploadedById(value ?? "")}
            >    
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih pengurus" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          <CloudUpload size={20} />
          {loading ? "Mengunggah..." : "Simpan ke Arsip"}
        </Button>
      </form>
    </AppShell>
  );
}