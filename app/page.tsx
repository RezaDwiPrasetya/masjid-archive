import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTreasuryBaselineCashBalance } from "@/lib/treasury";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickInfaqSearch, type VerifiedDonation } from "@/components/public-portal/quick-infaq-search";
import { OfficialBankAccounts } from "@/components/public-portal/official-bank-accounts";
import { AuthErrorBanner } from "@/components/auth-error-banner";
import {
  FolderOpen,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Landmark,
  Wallet,
  HeartHandshake,
  FileText,
  ChevronRight,
  Receipt,
  QrCode,
  LayoutDashboard,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portal Transparansi Kas & Amanah Umat | Masjid Al-Luqman",
  description:
    "Portal transparansi keuangan kas, pencarian riwayat infaq, dan arsip digital DKM Masjid Al-Luqman, Subang. Terbuka, amanah, dan akuntabel bagi seluruh umat.",
};

const MONTH_NAMES = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const CATEGORY_STYLES: Record<string, { bg: string; bar: string; badgeLabel: string; name: string }> = {
  operasional: {
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    bar: "bg-blue-600 dark:bg-blue-500",
    badgeLabel: "Operasional Rutin",
    name: "Operasional",
  },
  pembangunan: {
    bg: "bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900",
    bar: "bg-amber-600 dark:bg-amber-500",
    badgeLabel: "Pembangunan & Sarana",
    name: "Pembangunan",
  },
  sosial: {
    bg: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900",
    bar: "bg-emerald-600 dark:bg-emerald-500",
    badgeLabel: "Santunan & Dakwah",
    name: "Sosial & Dakwah",
  },
  honor: {
    bg: "bg-violet-500/10 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-900",
    bar: "bg-violet-600 dark:bg-violet-500",
    badgeLabel: "Honor Petugas & Imam",
    name: "Honor Petugas",
  },
  konsumsi: {
    bg: "bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900",
    bar: "bg-rose-600 dark:bg-rose-500",
    badgeLabel: "Konsumsi & Taklim",
    name: "Konsumsi",
  },
  administrasi: {
    bg: "bg-slate-500/10 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800",
    bar: "bg-slate-600 dark:bg-slate-400",
    badgeLabel: "Administrasi & ATK",
    name: "Administrasi",
  },
  lainnya: {
    bg: "bg-stone-500/10 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800",
    bar: "bg-stone-600 dark:bg-stone-400",
    badgeLabel: "Kebutuhan Lainnya",
    name: "Lainnya",
  },
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  operasional: "Pembayaran listrik PLN, air PDAM, kebersihan, perawatan sound system, dan operasional ibadah harian.",
  pembangunan: "Renovasi fisik sarana masjid, perbaikan tempat wudhu, pengecatan, dan pemeliharaan sarana ibadah.",
  sosial: "Santunan anak yatim piatu, bantuan dhuafa lingkungan masjid, dan program kepedulian sosial umat.",
  honor: "Honorarium marbot masjid, imam rawatib, khatib salat Jumat, muadzin, dan penceramah taklim.",
  konsumsi: "Penyediaan konsumsi buka puasa sunnah, konsumsi gotong royong, dan jamuan takmir pengajian.",
  administrasi: "Pengadaan kertas buletin Jumat, amplop tromol, ATK pembukuan kas, dan operasional kantor DKM.",
  lainnya: "Pengeluaran kas terverifikasi lainnya untuk perlengkapan darurat masjid.",
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface BerandaPortalPublikPageProps {
  searchParams?: Promise<{ error?: string; view?: string; year?: string; month?: string }>;
}

export default async function BerandaPortalPublikPage({ searchParams }: BerandaPortalPublikPageProps = {}) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const authError = resolvedSearchParams?.error;
  const isPublicPreview = resolvedSearchParams?.view === "public";

  // Staf DKM (Bendahara & Admin) yang membuka alamat utama / otomatis dialihkan ke Dashboard analitik
  // kecuali jika staf sengaja mengklik tautan "Lihat Beranda Publik" (?view=public)
  if (isStaff(session) && !isPublicPreview) {
    redirect("/dashboard");
  }

  // 1. Ambil data arsip laporan fisik
  const reports = await prisma.report.findMany({
    orderBy: { reportDate: "desc" },
    select: {
      id: true,
      reportDate: true,
      year: true,
      month: true,
      weekOfMonth: true,
      attachments: {
        select: {
          id: true,
          fileType: true,
          fileUrl: true,
        },
      },
      transactions: {
        where: { isVerified: true },
        select: { type: true, amount: true, category: true },
      },
    },
  });

  // 2. Ambil seluruh transaksi terverifikasi untuk perbendaharaan & riwayat infaq
  const verifiedTransactions = await prisma.transaction.findMany({
    where: { isVerified: true },
    select: {
      id: true,
      type: true,
      amount: true,
      category: true,
      paymentMethod: true,
      description: true,
      transactionDate: true,
      donorNameRaw: true,
      donor: { select: { name: true } },
      reportId: true,
      report: { select: { reportDate: true } },
    },
    orderBy: { transactionDate: "desc" },
  });

  // 3. Ambil mutasi internal perbendaharaan kas vs bank
  const transfers = await prisma.treasuryTransfer.findMany({
    select: { fromAccount: true, toAccount: true, amount: true },
  });

  // 4. Hitung posisi saldo kas fisik vs bank
  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;

  for (const tx of verifiedTransactions) {
    const amount = Number(tx.amount);
    const method = (tx.paymentMethod ?? "TUNAI").toUpperCase();
    const isCash = method === "TUNAI";

    if (tx.type === "pemasukan") {
      if (isCash) cashIn += amount;
      else bankIn += amount;
    } else if (tx.type === "pengeluaran") {
      if (isCash) cashOut += amount;
      else bankOut += amount;
    }
  }

  // Penentuan periode aktif laporan
  const latestReport = reports[0];
  const activeYear = latestReport ? latestReport.year : new Date().getUTCFullYear();
  const activeMonth = latestReport ? latestReport.month : new Date().getUTCMonth() + 1;

  // Mutasi transfer internal
  let transfersBankToCash = 0;
  let transfersCashToBank = 0;
  for (const tr of transfers) {
    const amount = Number(tr.amount);
    if (tr.fromAccount === "BANK" && tr.toAccount === "TUNAI") {
      transfersBankToCash += amount;
    } else if (tr.fromAccount === "TUNAI" && tr.toAccount === "BANK") {
      transfersCashToBank += amount;
    }
  }

  const baselineCash = await getTreasuryBaselineCashBalance();
  const cashBalance = baselineCash + cashIn - cashOut + transfersBankToCash - transfersCashToBank;
  const bankBalance = bankIn - bankOut + transfersCashToBank - transfersBankToCash;
  const totalBalance = cashBalance + bankBalance;

  // 5. Hitung alokasi pengeluaran kas periode aktif untuk disajikan secara ramah jemaah
  const monthExpenses = verifiedTransactions.filter((t) => {
    if (t.type !== "pengeluaran") return false;
    const dateObj = t.transactionDate
      ? new Date(t.transactionDate)
      : t.report?.reportDate
      ? new Date(t.report.reportDate)
      : null;
    if (!dateObj) return false;
    return (
      dateObj.getUTCFullYear() === activeYear &&
      dateObj.getUTCMonth() + 1 === activeMonth
    );
  });

  const totalMonthExpense = monthExpenses.reduce((acc, t) => acc + Number(t.amount), 0);

  const categoryAggregates: Record<string, { total: number; count: number }> = {};
  for (const t of monthExpenses) {
    const cat = t.category || "lainnya";
    if (!categoryAggregates[cat]) {
      categoryAggregates[cat] = { total: 0, count: 0 };
    }
    categoryAggregates[cat].total += Number(t.amount);
    categoryAggregates[cat].count += 1;
  }

  const expenseBreakdown = Object.entries(categoryAggregates)
    .map(([cat, data]) => {
      const percentage = totalMonthExpense > 0 ? (data.total / totalMonthExpense) * 100 : 0;
      const meta = CATEGORY_STYLES[cat] ?? {
        bg: "bg-surface-container text-on-surface border-outline-variant",
        bar: "bg-primary",
        badgeLabel: "Kebutuhan Kas",
        name: cat,
      };
      return {
        category: cat,
        label: meta.name,
        badgeLabel: meta.badgeLabel,
        bg: meta.bg,
        bar: meta.bar,
        totalAmount: data.total,
        percentage,
        transactionCount: data.count,
        description: CATEGORY_DESCRIPTIONS[cat] ?? "Penyaluran kebutuhan operasional dan sarana ibadah DKM.",
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 6. Daftar infaq untuk widget pencarian cepat (50 transaksi pemasukan terverifikasi terbaru)
  const recentDonations: VerifiedDonation[] = verifiedTransactions
    .filter((t) => t.type === "pemasukan")
    .sort((a, b) => {
      const dateA = new Date(a.transactionDate ?? a.report?.reportDate ?? 0).getTime();
      const dateB = new Date(b.transactionDate ?? b.report?.reportDate ?? 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 50)
    .map((t) => {
      const rawDate = t.transactionDate ?? t.report?.reportDate;
      const d = rawDate ? new Date(rawDate) : null;
      const dateStr = d
        ? d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Tercatat di kas";
      return {
        id: t.id,
        donorName: t.donor?.name || t.donorNameRaw || "Hamba Allah",
        amount: Number(t.amount),
        date: dateStr,
        category: t.category,
        reportId: t.reportId,
        description: t.description,
      };
    });

  // Filter arsip pindaian buku kas
  const filterYear = resolvedSearchParams?.year ? parseInt(resolvedSearchParams.year, 10) : undefined;
  const filterMonth = resolvedSearchParams?.month ? parseInt(resolvedSearchParams.month, 10) : undefined;

  const filteredReports = reports.filter((r) => {
    if (filterYear && r.year !== filterYear) return false;
    if (filterMonth && r.month !== filterMonth) return false;
    return true;
  });

  const availableYears = Array.from(new Set(reports.map((r) => r.year))).sort((a, b) => b - a);
  const activeMonthName = MONTH_NAMES[activeMonth] ?? "";

  // Konten Hero Band Bersahabat
  const heroBandContent = (
    <div className="space-y-6">
      {/* Banner Khusus jika Pengurus sedang meninjau Pratinjau Publik */}
      {isPublicPreview && (
        <div className="rounded-xl border border-primary-fixed/40 bg-primary-container/80 p-3 text-xs flex items-center justify-between gap-3 text-primary-fixed">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>
              <strong>Mode Pratinjau Publik:</strong> Anda sedang melihat Beranda sebagaimana disajikan kepada jemaah dan donatur umum.
            </span>
          </div>
          <Link
            href="/dashboard"
            className="font-bold underline hover:no-underline text-on-primary shrink-0"
          >
            Kembali ke Dashboard Pengurus &rarr;
          </Link>
        </div>
      )}

      {/* Identitas DKM Al-Luqman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary-fixed/20 pb-5">
        <div className="flex items-center gap-3.5">
          <Image
            src="/favicon.svg"
            alt="Logo DKM Masjid Al-Luqman"
            width={48}
            height={48}
            priority
            className="h-11 w-11 sm:h-12 sm:w-12 drop-shadow-sm select-none shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-on-primary tracking-tight">
                DKM Masjid Al-Luqman
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 font-semibold">
                Portal Transparansi Kas Umat
              </span>
            </div>
            <p className="text-xs text-primary-fixed/80 font-medium mt-0.5">
              Kel. Soklat, Kec. Subang, Kab. Subang &bull; Akuntabilitas Terbuka &amp; Terpercaya
            </p>
          </div>
        </div>

        {/* Akses Cepat Anchor Menu */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
          <a
            href="#alokasi-belanja"
            className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 transition-colors"
          >
            Alokasi Belanja
          </a>
          <a
            href="#cek-infaq"
            className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 transition-colors"
          >
            Cek Infaq Anda
          </a>
          <a
            href="#rekening-resmi"
            className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 transition-colors"
          >
            Salurkan Infaq
          </a>
          <a
            href="#arsip-laporan"
            className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 transition-colors"
          >
            Arsip Laporan
          </a>
        </div>
      </div>

      {/* Figur Utama Saldo Kas Terkonsolidasi (Angka Tabular Gagah) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary-fixed font-bold">
            <ShieldCheck className="h-4 w-4 text-primary-fixed" />
            <span>Total Saldo Kas Terkonsolidasi (Fisik &amp; Bank)</span>
          </div>
          <div className="text-4xl sm:text-5xl lg:text-6xl font-bold font-sans tracking-tight text-on-primary tabular-nums">
            {formatRupiah(totalBalance)}
          </div>
          <p className="text-xs sm:text-sm text-primary-fixed/90 max-w-xl leading-relaxed pt-1">
            Dana titipan jamaah yang dikelola secara amanah untuk kegiatan ibadah, pemeliharaan sarana, dan program kepedulian sosial umat.
          </p>
        </div>

        {/* Sub-Stat: Kas Fisik vs Bank */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 pt-2 lg:pt-0">
          <div className="rounded-xl border border-primary-container bg-primary-container/40 p-3.5 space-y-1">
            <span className="text-[11px] text-primary-fixed/80 block font-medium">
              Kas Tunai Fisik (Brankas)
            </span>
            <span className="text-base sm:text-lg font-bold text-on-primary tabular-nums block">
              {formatRupiah(cashBalance)}
            </span>
            <span className="text-[10px] text-primary-fixed/60 block">
              Tromol Jumat &amp; Kas Harian
            </span>
          </div>

          <div className="rounded-xl border border-primary-container bg-primary-container/40 p-3.5 space-y-1">
            <span className="text-[11px] text-primary-fixed/80 block font-medium">
              Kas Bank &amp; QRIS Resmi
            </span>
            <span className="text-base sm:text-lg font-bold text-on-primary tabular-nums block">
              {formatRupiah(bankBalance)}
            </span>
            <span className="text-[10px] text-primary-fixed/60 block">
              Rekening DKM di BSI &amp; Muamalat
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell active="/">
      <PageShell heroBand={heroBandContent}>
        <div className="space-y-12">
          {/* Banner Notifikasi Akses Ditolak (jika dialihkan dari rute berwenang staf) */}
          <AuthErrorBanner authError={authError} />

          {/* SECTION 1: Alokasi Belanja Umat Bulan Berjalan (Human-Centric & Ramah Jemaah) */}
          <section id="alokasi-belanja" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-outline-variant pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-on-surface">
                    Distribusi Penyaluran Kas Umat
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                  Transparansi penggunaan dana kas pada periode pembukuan {activeMonthName} {activeYear} untuk kemakmuran ibadah dan kemaslahatan jemaah.
                </p>
              </div>
              <Link
                href="/pengeluaran"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                <span>Buka Rincian Seluruh Nota Belanja</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {expenseBreakdown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container/40 p-8 text-center">
                <p className="text-sm font-medium text-on-surface-variant">
                  Belum ada transaksi pengeluaran tercatat pada periode {activeMonthName} {activeYear}.
                </p>
                <p className="text-xs text-on-surface-variant/70 mt-1">
                  Buka halaman pengeluaran untuk menelusuri data pembukuan bulan-bulan sebelumnya.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {expenseBreakdown.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-2xl border border-outline-variant bg-surface-container/70 hover:bg-surface-container p-5 flex flex-col justify-between space-y-4 transition-all duration-150 hover:shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${item.bg}`}>
                          {item.badgeLabel}
                        </span>
                        <span className="text-xs font-bold text-on-surface-variant tabular-nums">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-on-surface">
                        {item.label}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-outline-variant/60">
                      {/* Bar visual proporsi alokasi */}
                      <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.bar}`}
                          style={{ width: `${Math.min(Math.max(item.percentage, 4), 100)}%` }}
                        />
                      </div>

                      <div className="flex items-end justify-between gap-2 pt-1">
                        <div>
                          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">
                            Total Penyaluran:
                          </span>
                          <span className="text-lg font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                            {formatRupiah(item.totalAmount)}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant font-medium pb-0.5">
                          {item.transactionCount} transaksi
                        </span>
                      </div>

                      <Link
                        href={`/pengeluaran?year=${activeYear}&month=${activeMonth}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline pt-1"
                      >
                        <span>Lihat Rincian Nota</span>
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: Widget Interaktif Cek Riwayat Infaq */}
          <section id="cek-infaq" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-outline-variant pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-on-surface">
                    Cek Riwayat Infaq Anda
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Pencarian mandiri untuk memastikan dana infaq yang Anda salurkan telah sah tercatat dalam pembukuan DKM.
                </p>
              </div>
              <Link
                href="/donatur"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                <span>Lihat Seluruh Daftar Donatur</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <QuickInfaqSearch initialDonations={recentDonations} />
          </section>

          {/* SECTION 3: Kanal Rekening Resmi & QRIS Masjid */}
          <section id="rekening-resmi" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-outline-variant pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-on-surface">
                    Salurkan Infaq &amp; Sedekah Resmi
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Salurkan amanah infaq Anda melalui rekening perbankan syariah resmi atas nama DKM Masjid Al-Luqman.
                </p>
              </div>
            </div>

            <OfficialBankAccounts />
          </section>

          {/* SECTION 4: Arsip Buku Kas Fisik & Laporan Berkala */}
          <section id="arsip-laporan" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant pb-3">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-on-surface">
                    Arsip Buku Kas Fisik &amp; Laporan Berkala
                  </h2>
                  <Badge variant="secondary" size="sm">
                    {reports.length} Laporan
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  Dokumentasi otentik pindaian buku kas mingguan yang diunggah dan diverifikasi oleh DKM.
                </p>
              </div>

              {/* Filter Arsip */}
              <div className="flex items-center gap-2 flex-wrap">
                {availableYears.map((year) => (
                  <Link
                    key={year}
                    href={filterYear === year ? "/" : `/?year=${year}#arsip-laporan`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      filterYear === year
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant"
                    }`}
                  >
                    Tahun {year}
                  </Link>
                ))}
              </div>
            </div>

            {/* Grid Kartu Laporan */}
            {filteredReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container/30 p-12 text-center">
                <FolderOpen className="h-10 w-10 text-on-surface-variant/40 mx-auto mb-3" />
                <p className="text-base font-semibold text-on-surface">Belum ada dokumen laporan kas</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Dokumen pindaian buku kas akan tampil setelah pengurus mengunggah arsip mingguan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => {
                  const date = new Date(report.reportDate);
                  const formattedDate = date.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                  const verifiedCount = report.transactions.length;

                  return (
                    <Link
                      key={report.id}
                      href={`/laporan/${report.id}`}
                      className="group block rounded-2xl border border-outline-variant bg-surface-container/60 hover:bg-surface-container p-5 transition-all duration-200 hover:shadow-sm hover:border-primary/40 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-primary block uppercase tracking-wider">
                            Pekan {report.weekOfMonth ?? 1} &bull; {MONTH_NAMES[report.month]} {report.year}
                          </span>
                          <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                            {formattedDate}
                          </h4>
                        </div>
                        <span className="p-2 rounded-xl bg-surface-container-high group-hover:bg-primary/10 text-on-surface-variant group-hover:text-primary transition-colors">
                          <ChevronRight size={16} />
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-outline-variant/60 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{verifiedCount} mutasi kas</span>
                        </span>
                        <span>&bull;</span>
                        <span>{report.attachments.length} berkas fisik</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </PageShell>
    </AppShell>
  );
}
