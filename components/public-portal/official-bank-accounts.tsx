"use client";

import * as React from "react";
import { Check, Copy, QrCode, ShieldCheck, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  category: string;
  description: string;
}

const OFFICIAL_ACCOUNTS: BankAccount[] = [
  {
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123456789",
    accountHolder: "DKM MASJID AL-LUQMAN",
    category: "Kas Operasional & Kemakmuran",
    description: "Untuk operasional rutin, listrik/air, honor marbot & imam, dan kegiatan taklim.",
  },
  {
    bankName: "Bank Muamalat",
    accountNumber: "1230098765",
    accountHolder: "DKM MASJID AL-LUQMAN",
    category: "Kas Pembangunan & Sarana",
    description: "Khusus pembebasan lahan, renovasi fisik, pengadaan sarana & prasarana masjid.",
  },
];

export function OfficialBankAccounts() {
  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null);

  const handleCopy = (accNumber: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedAccount(accNumber);
    setTimeout(() => {
      setCopiedAccount(null);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Kartu Daftar Rekening Resmi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OFFICIAL_ACCOUNTS.map((acc) => {
          const isCopied = copiedAccount === acc.accountNumber;
          return (
            <div
              key={acc.accountNumber}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-emerald-600/40 transition-colors shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-emerald-800" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      {acc.bankName}
                    </span>
                  </div>
                  <Badge variant="outline" size="sm" className="font-medium text-[10px] border-slate-200 bg-slate-50 text-slate-600">
                    {acc.category}
                  </Badge>
                </div>

                <div className="pt-1">
                  <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                    {acc.accountNumber}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>a.n.</span>
                    <strong className="text-slate-700">{acc.accountHolder}</strong>
                    <span title="Rekening resmi terverifikasi" className="inline-flex items-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  {acc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Salin nomor untuk transfer
                </span>
                <Button
                  type="button"
                  size="xs"
                  onClick={() => handleCopy(acc.accountNumber)}
                  className={`gap-1.5 text-xs font-semibold rounded-xl h-8 px-3 transition-colors ${
                    isCopied
                      ? "bg-[#0e3824] hover:bg-[#144731] text-white shadow-xs"
                      : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Nomor Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin Rekening</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info QRIS & Keamanan Infaq */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-900 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
            <QrCode className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-sm">
              Infaq Cepat Melalui QRIS Resmi Masjid Al-Luqman
            </span>
            <span className="text-slate-600 text-xs block mt-0.5 leading-relaxed">
              Tersedia stiker QRIS resmi di area pintu utama masjid atau dapat diminta langsung ke bendahara DKM. Pastikan nama penerima tertulis <strong>DKM MASJID AL-LUQMAN</strong>.
            </span>
          </div>
        </div>
        <div className="self-end sm:self-auto shrink-0">
          <Badge variant="success" size="sm" className="font-semibold">
            Bebas Biaya Admin
          </Badge>
        </div>
      </div>
    </div>
  );
}
