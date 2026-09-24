"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  UserCheck,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";

export interface DonorItem {
  id: string;
  name: string;
  totalContribution: number;
  donationCount: number;
}

export interface AnonymousAggregate {
  totalContribution: number;
  donationCount: number;
}

interface DonorsClientProps {
  donors: DonorItem[];
  anonymous: AnonymousAggregate;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DonorsClient({ donors, anonymous }: DonorsClientProps) {
  const [search, setSearch] = React.useState("");

  // Live filter real-time saat mengetik
  const filteredDonors = React.useMemo(() => {
    if (!search.trim()) return donors;
    const q = search.toLowerCase();
    return donors.filter((d) => d.name.toLowerCase().includes(q));
  }, [donors, search]);

  const totalNamedDonations = donors.reduce(
    (acc, d) => acc + d.totalContribution,
    0
  );

  return (
    <PageShell>
      <div className="space-y-8">
        {/* Page Title Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Daftar Donatur</h1>
          <p className="text-sm text-on-surface-variant">
            Transparansi catatan infaq dan kontribusi para donatur terverifikasi kas masjid.
          </p>
        </div>

        {/* 1. DUA KARTU KPI SIMETRIS (50:50) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Donatur Terdaftar */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container/70 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Donatur Terdata
              </span>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Terverifikasi
              </span>
            </div>
            <div>
              <div className="text-3xl font-bold text-on-surface tabular-nums">
                {donors.length} Donatur
              </div>
              <p className="text-sm text-on-surface-variant mt-1.5">
                Total kontribusi: <span className="font-semibold text-primary tabular-nums">{formatRupiah(totalNamedDonations)}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Infaq Anonim / Tromol */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container/70 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Infaq Anonim (Tromol / Kotak Amal)
              </span>
              <span className="rounded-full bg-surface-container-high border border-outline-variant px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                Tanpa Profil
              </span>
            </div>
            <div>
              <div className="text-3xl font-bold text-on-surface tabular-nums">
                {formatRupiah(anonymous.totalContribution)}
              </div>
              <p className="text-sm text-on-surface-variant mt-1.5">
                Akumulasi dari <span className="font-semibold text-on-surface tabular-nums">{anonymous.donationCount} kali</span> infaq tromol / kotak amal tanpa nama individual.
              </p>
            </div>
          </div>
        </div>

        {/* 2. HEADER DAFTAR & SEARCH BAR */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-on-surface">
                Daftar Profil Donatur
              </h2>
              <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant border border-outline-variant">
                {filteredDonors.length} Donatur
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Urutan berdasarkan kontribusi infaq tertinggi ke terendah
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant h-4 w-4" />
            <Input
              type="text"
              placeholder="Cari nama donatur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm rounded-xl border-outline-variant bg-surface-container shadow-xs"
            />
          </div>
        </div>

        {/* 3. DAFTAR KARTU LIST PROFIL DONATUR */}
        {filteredDonors.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-outline-variant bg-surface/50">
            <ShieldAlert className="h-10 w-10 text-on-surface-variant/40 mx-auto mb-3" />
            <p className="text-base font-semibold text-on-surface">
              {search ? "Donatur tidak ditemukan" : "Belum ada donatur terdata"}
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              {search
                ? `Tidak ada profil donatur yang cocok dengan kata kunci "${search}".`
                : "Nama donatur yang diverifikasi oleh pengurus DKM akan otomatis muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant bg-surface-container/60 shadow-xs overflow-hidden divide-y divide-outline-variant">
            {filteredDonors.map((donor, idx) => {
              const rank = idx + 1;
              const isRankOne = rank === 1 && !search;
              return (
                <Link
                  key={donor.id}
                  href={`/donatur/${donor.id}`}
                  className="group flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-surface-container-high transition-colors duration-150"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {/* Badge Nomor Urut */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-transform group-hover:scale-105 ${
                        isRankOne
                          ? "border border-amber-500/40 text-amber-800 dark:text-amber-200 bg-amber-500/15"
                          : "border border-outline-variant text-on-surface-variant bg-surface"
                      }`}
                    >
                      #{rank}
                    </div>

                    {/* Nama Donatur */}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors leading-snug">
                        {donor.name}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 border border-outline-variant text-[11px] font-medium">
                          <UserCheck className="h-3 w-3 text-primary" />
                          {donor.donationCount} kali infaq terverifikasi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nominal Uang di Sisi Kanan (Tabular Nums) + Chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base sm:text-lg font-bold text-on-surface tabular-nums group-hover:text-primary transition-colors">
                      {formatRupiah(donor.totalContribution)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-on-surface-variant/60 group-hover:text-primary group-hover:translate-x-1 transition-transform duration-150" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
