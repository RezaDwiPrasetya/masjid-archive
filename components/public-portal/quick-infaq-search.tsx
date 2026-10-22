"use client";

import * as React from "react";
import Link from "next/link";
import { Search, CheckCircle2, FileText, X, HeartHandshake, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface VerifiedDonation {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  category?: string | null;
  reportId: string;
  description?: string | null;
}

interface QuickInfaqSearchProps {
  initialDonations: VerifiedDonation[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QuickInfaqSearch({ initialDonations }: QuickInfaqSearchProps) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialDonations.slice(0, 6);

    return initialDonations.filter((d) => {
      const matchName = d.donorName.toLowerCase().includes(q);
      const matchDesc = d.description ? d.description.toLowerCase().includes(q) : false;
      const matchCat = d.category ? d.category.toLowerCase().includes(q) : false;
      return matchName || matchDesc || matchCat;
    });
  }, [query, initialDonations]);

  return (
    <div className="space-y-4">
      {/* Input Pencarian Cepat */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik nama Anda atau kata kunci donasi (misal: Fulan, Pembangunan, Subuh)..."
          className="pl-10 pr-9 h-11 text-sm bg-surface-container border-outline-variant focus:border-primary focus:ring-primary/20 rounded-xl"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
            title="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Indikator Status & Keterangan */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
        <span>
          {query ? (
            <>
              Ditemukan <strong className="text-on-surface">{filtered.length}</strong> riwayat infaq
            </>
          ) : (
            <>Menampilkan 6 infaq terverifikasi terbaru</>
          )}
        </span>
        <div className="flex items-center gap-1 text-primary font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Terverifikasi DKM</span>
        </div>
      </div>

      {/* Daftar Hasil (List Bergaya Buku Kas, Bukan Kartu Bertumpuk) */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container/50 p-8 text-center space-y-2">
          <HeartHandshake className="h-8 w-8 text-on-surface-variant/60 mx-auto" />
          <p className="text-sm font-semibold text-on-surface">
            Tidak ditemukan riwayat infaq dengan kata kunci &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Catatan: Sebagian infaq disalurkan secara anonim sebagai <em>Hamba Allah</em>. Jika donasi Anda belum muncul, silakan hubungi bendahara DKM untuk konfirmasi pencatatan.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant bg-surface-container overflow-hidden divide-y divide-outline-variant/60">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-surface-container-high/60 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-on-surface">
                    {item.donorName}
                  </span>
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="h-3 w-3" />
                    Sah Masuk Kas
                  </Badge>
                  {item.category && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-medium border border-outline-variant/40">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="text-xs text-on-surface-variant flex items-center gap-2 flex-wrap">
                  <span>{item.date}</span>
                  {item.description && (
                    <>
                      <span>&bull;</span>
                      <span className="truncate max-w-xs">{item.description}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-sm sm:text-base font-bold text-primary font-sans tabular-nums">
                  {formatRupiah(item.amount)}
                </span>
                <Link
                  href={`/laporan/${item.reportId}`}
                  className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1 border border-outline-variant/60 rounded-lg px-2 py-1 bg-surface hover:bg-surface-container-high transition-colors"
                  title="Lihat dokumen buku kas fisik laporan ini"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Bukti Kas</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Catatan Privasi & Keterbukaan */}
      <p className="text-[11px] text-on-surface-variant/80 px-1 leading-relaxed">
        * Seluruh riwayat infaq disajikan secara terbuka untuk menjaga akuntabilitas kas umat. Donatur yang memilih anonim dicatat sebagai <em>Hamba Allah</em> sesuai adab sedekah.
      </p>
    </div>
  );
}
