"use client";

import * as React from "react";
import { Check, Copy, QrCode, ShieldCheck, Building2, Landmark, HelpCircle } from "lucide-react";
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
              className="rounded-2xl border border-outline-variant bg-surface-container p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {acc.bankName}
                    </span>
                  </div>
                  <Badge variant="outline" size="sm" className="font-medium text-[10px]">
                    {acc.category}
                  </Badge>
                </div>

                <div className="pt-1">
                  <div className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-on-surface tabular-nums">
                    {acc.accountNumber}
                  </div>
                  <div className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                    <span>a.n.</span>
                    <span title="Rekening resmi terverifikasi" className="inline-flex items-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    </span>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                  {acc.description}
                </p>
              </div>

              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant/80">
                  Salin nomor untuk transfer
                </span>
                <Button
                  type="button"
                  variant={isCopied ? "default" : "outline"}
                  size="xs"
                  onClick={() => handleCopy(acc.accountNumber)}
                  className="gap-1.5 text-xs font-medium"
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
      <div className="rounded-xl border border-emerald-900/10 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-on-surface">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-on-surface block">
              Infaq Cepat Melalui QRIS Resmi Masjid Al-Luqman
            </span>
            <span className="text-on-surface-variant text-[11px] block mt-0.5">
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
