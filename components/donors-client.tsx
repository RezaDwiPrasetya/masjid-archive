"use client";

import * as React from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Search,
  UserCheck,
  ChevronRight,
  Trophy,
  ShieldAlert,
  Sparkles,
  HandCoins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Daftar Donatur
        </h1>
        <p className="text-muted-foreground mt-1">
          Transparansi catatan infaq dan kontribusi para donatur terverifikasi kas masjid.
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Donatur Terdaftar */}
        <Card className="border-primary/20 bg-gradient-to-br from-emerald-500/10 via-card/70 to-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5">
              <UserCheck className="h-4 w-4" />
              Donatur Terdata
            </CardTitle>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Terverifikasi
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {donors.length} Donatur
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Total kontribusi: {formatRupiah(totalNamedDonations)}
            </p>
          </CardContent>
        </Card>

        {/* KARTU TERPISAH: Infaq Anonim (Hamba Allah) */}
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card/70 to-card/50 shadow-sm sm:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Infaq Anonim (Hamba Allah)
            </CardTitle>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Tanpa Profil
            </span>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {formatRupiah(anonymous.totalContribution)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <HandCoins className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  Akumulasi dari <strong>{anonymous.donationCount} kali</strong> sedekah tanpa nama atau atas nama &quot;Hamba Allah&quot;.
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground max-w-xs">
              Mencakup seluruh infaq tromol/kotak amal yang tidak mencantumkan nama individual.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donor List Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              Daftar Profil Donatur
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              ({filteredDonors.length} orang/lembaga)
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Cari nama donatur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm rounded-xl bg-card/60 backdrop-blur-md"
            />
          </div>
        </div>

        {/* List Cards */}
        {filteredDonors.length === 0 ? (
          <Card className="p-8 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-base font-semibold text-foreground">
              {search ? "Donatur tidak ditemukan" : "Belum ada donatur terdata"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? `Tidak ada donatur dengan kata kunci "${search}".`
                : "Nama donatur yang diverifikasi oleh pengurus akan otomatis muncul di sini."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDonors.map((donor, idx) => {
              const isTopThree = idx < 3 && !search;
              return (
                <Link
                  key={donor.id}
                  href={`/donatur/${donor.id}`}
                  className="group block"
                >
                  <Card className="h-full border-white/20 bg-card/60 transition-all duration-300 hover:-translate-y-1 hover:bg-card/90 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank or Avatar Badge */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold text-sm ${
                            isTopThree
                              ? idx === 0
                                ? "bg-amber-100 text-amber-800 shadow-sm"
                                : idx === 1
                                ? "bg-slate-200 text-slate-800"
                                : "bg-orange-100 text-orange-800"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isTopThree ? (
                            <Trophy className="h-4 w-4" />
                          ) : (
                            <span>#{idx + 1}</span>
                          )}
                        </div>

                        {/* Name & Details */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {donor.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-primary">
                              {formatRupiah(donor.totalContribution)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              • {donor.donationCount}x donasi
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
