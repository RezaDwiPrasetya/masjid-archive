"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Clock,
  ArrowLeft,
  LogOut,
  ShieldAlert,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PendingClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function PendingClient({ user }: PendingClientProps) {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Container Utama Berwibawa & Teduh */}
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* Identitas Lembaga */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform hover:scale-[1.02]"
          >
            <Image
              src="/favicon.svg"
              alt="Logo DKM Masjid Al-Luqman"
              width={48}
              height={48}
              priority
              className="h-12 w-12 drop-shadow-sm select-none"
            />
            <div className="text-left">
              <h1 className="text-lg font-bold text-on-surface tracking-tight leading-tight">
                Masjid Al-Luqman
              </h1>
              <p className="text-xs text-on-surface-variant font-medium">
                Kel. Soklat, Kec. Subang, Kab. Subang
              </p>
            </div>
          </Link>
        </div>

        {/* Kartu Status Penjelasan */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container shadow-sm overflow-hidden">
          {/* Header Status */}
          <div className="px-6 py-5 border-b border-outline-variant/60 bg-surface-container-high/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block font-medium">
                  Status Akun
                </span>
                <span className="text-sm font-bold text-on-surface">
                  Menunggu Verifikasi DKM
                </span>
              </div>
            </div>
            <Badge variant="warning" size="sm" className="self-start sm:self-auto font-medium">
              Akses Terbatas
            </Badge>
          </div>

          {/* Profil Pengguna yang Masuk */}
          <div className="px-6 py-5 border-b border-outline-variant/40 bg-surface/50">
            <div className="flex items-center gap-3.5">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name ?? "Avatar"}
                  className="h-11 w-11 rounded-full border border-outline-variant object-cover shrink-0"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base shrink-0">
                  {user.name?.charAt(0) ?? "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-on-surface truncate">
                  {user.name || "Pengguna Google"}
                </h2>
                <p className="text-xs text-on-surface-variant truncate">
                  {user.email || "Email tidak tersedia"}
                </p>
              </div>
            </div>
          </div>

          {/* Penjelasan Transparan */}
          <div className="px-6 py-6 space-y-4 text-sm leading-relaxed text-on-surface">
            <p>
              Akun Google Anda berhasil masuk ke sistem. Namun, akun Anda saat ini
              <strong> belum memiliki hak akses operasional staf DKM</strong> (Bendahara
              atau Administrator).
            </p>
            <p className="text-on-surface-variant text-xs sm:text-sm">
              Demi menjaga amanah dan akuntabilitas pencatatan dana umat, akses untuk
              mengunggah laporan fisik, ekstraksi nota, dan verifikasi mutasi kas hanya
              diberikan kepada pengurus yang telah ditugaskan secara resmi.
            </p>

            {/* Kotak Petunjuk Langkah Selanjutnya */}
            <div className="rounded-xl border border-outline-variant/80 bg-surface-container-high/30 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>Langkah Selanjutnya:</span>
              </div>
              <ul className="text-xs text-on-surface-variant space-y-1.5 pl-6 list-disc">
                <li>
                  <strong>Bagi Pengurus / Bendahara DKM:</strong> Silakan hubungi
                  Administrator sistem untuk mengaktifkan wewenang akun Anda melalui menu
                  manajemen pengguna.
                </li>
                <li>
                  <strong>Bagi Jamaah & Warga Umum:</strong> Seluruh laporan kas, infaq,
                  dan saldo terbuka dapat Anda akses secara bebas di beranda publik tanpa
                  perlu login.
                </li>
              </ul>
            </div>
          </div>

          {/* Aksi Navigasi */}
          <div className="px-6 py-4 bg-surface-container-high/20 border-t border-outline-variant/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full sm:w-auto text-on-surface-variant hover:text-error gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Akun</span>
            </Button>

            <Link href="/" className="w-full sm:w-auto">
              <Button variant="default" size="sm" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Beranda Publik</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Tenang */}
        <p className="text-center text-xs text-on-surface-variant/70">
          Sistem Informasi & Arsip Digital Keuangan Masjid Al-Luqman &bull; Amanah Umat
        </p>
      </div>
    </main>
  );
}
