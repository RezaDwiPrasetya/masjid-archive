"use client";

import * as React from "react";
import Link from "next/link";
import { Search, CheckCircle2, FileText, X, HeartHandshake, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik nama Anda atau kata kunci donasi (misal: Fulan, Pembangunan, Subuh)..."
          className="pl-10 pr-9 h-11 text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
            title="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Indikator Status & Keterangan */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          {query ? (
            <>
              Ditemukan <strong className="text-slate-900">{filtered.length}</strong> riwayat infaq
            </>
          ) : (
            <>Menampilkan 6 infaq terverifikasi terbaru</>
          )}
        </span>
        <div className="flex items-center gap-1 text-emerald-800 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Terverifikasi DKM</span>
        </div>
      </div>

      {/* Daftar Hasil (List Bergaya Buku Kas, Bukan Kartu Bertumpuk) */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-2 shadow-2xs">
          <HeartHandshake className="h-10 w-10 text-slate-400 mx-auto mb-1" />
          <p className="text-base font-bold text-slate-900">
            Tidak ditemukan riwayat infaq dengan kata kunci &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Catatan: Sebagian infaq disalurkan secara anonim sebagai <em>Hamba Allah</em>. Jika donasi Anda belum muncul, silakan hubungi bendahara DKM untuk konfirmasi pencatatan.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden divide-y divide-slate-100 shadow-2xs">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">
                    {item.donorName}
                  </span>
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="h-3 w-3" />
                    Sah Masuk Kas
                  </Badge>
                  {item.category && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 font-medium border border-slate-200">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
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
                <span className="text-sm sm:text-base font-bold text-emerald-800 font-sans tabular-nums">
                  {formatRupiah(item.amount)}
                </span>
                <Link
                  href={`/laporan/${item.reportId}`}
                  className="text-xs text-slate-600 hover:text-emerald-800 flex items-center gap-1 border border-slate-200 rounded-xl px-2.5 py-1 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
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
