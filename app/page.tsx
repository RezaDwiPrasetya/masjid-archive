import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getTreasuryBaselineCashBalance } from "@/lib/treasury";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickInfaqSearch, type VerifiedDonation } from "@/components/public-portal/quick-infaq-search";
import { CashflowTrendSection } from "@/components/cashflow-trend-section";
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
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Download,
  FileText,
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

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface BerandaPortalPublikPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function BerandaPortalPublikPage({ searchParams }: BerandaPortalPublikPageProps = {}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const authError = resolvedSearchParams?.error;

  // 1. Ambil data arsip laporan
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

    // Akumulasi Saldo Kas & Bank
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

  // Daftar infaq untuk widget pencarian cepat (50 transaksi pemasukan terverifikasi terbaru)
  // Tanggal diprioritaskan dari transactionDate, dengan fallback ke report.reportDate dari dokumen asli
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

  // Grouping arsip laporan per Tahun > Bulan
  const groupedByYear = new Map<number, Map<number, typeof reports>>();
  for (const report of reports) {
    if (!groupedByYear.has(report.year)) groupedByYear.set(report.year, new Map());
    const yearGroup = groupedByYear.get(report.year)!;
    if (!yearGroup.has(report.month)) yearGroup.set(report.month, []);
    yearGroup.get(report.month)!.push(report);
  }
  const years = [...groupedByYear.keys()].sort((a, b) => b - a);

  // Hero Band Header Publik (Berakar pada identitas masjid, bebas AI clichés)
  const heroBandContent = (
    <div className="space-y-6 sm:space-y-8">
      {/* Baris Identitas Lembaga & Komitmen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary-container pb-5">
        <div className="flex items-center gap-3.5">
          <Image
            src="/favicon.svg"
            alt="Logo DKM Masjid Al-Luqman"
            width={44}
            height={44}
            priority
            className="h-10 w-10 sm:h-11 sm:w-11 drop-shadow-sm select-none shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-on-primary tracking-tight">
                DKM Masjid Al-Luqman
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 font-semibold">
                Portal Transparansi Publik
              </span>
            </div>
            <p className="text-xs text-primary-fixed/80 font-medium">
              Kel. Soklat, Kec. Subang, Kab. Subang &bull; Akuntabilitas Kas Umat
            </p>
          </div>
        </div>

        {/* Akses Cepat Anchor Menu */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
          <a
            href="#tren-kas"
            className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-fixed/20 text-primary-fixed border border-primary-fixed/30 transition-colors"
          >
            Ringkasan &amp; Tren
          </a>
          <a
            href="#alokasi-pengeluaran"
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
          {/* Banner Notifikasi Akses Ditolak (jika dialihkan dari rute operasional berwenang staf) */}
          <AuthErrorBanner authError={authError} />

          {/* SECTION 1: Ringkasan Kas & Tren Interaktif dengan Filter Periode & Cetak Laporan */}
          <section id="tren-kas" className="space-y-4">
            <CashflowTrendSection
              initialYear={activeYear}
              initialMonth={activeMonth}
              availableYears={years}
            />
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
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Lihat Seluruh Daftar Donatur</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <QuickInfaqSearch initialDonations={recentDonations} />
          </section>

          {/* SECTION 4: Arsip Laporan Buku Kas Fisik & Buletin Mingguan */}
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
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl leading-relaxed">
                  Dokumentasi pindaian lembar buku kas fisik yang difoto secara berkala setiap hari Jumat oleh bendahara DKM.
                </p>
              </div>

              {years.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
                  <CalendarDays size={14} className="text-primary" />
                  <span>Periode Arsip:</span>
                  <span className="font-semibold text-on-surface">
                    {years[years.length - 1]} &ndash; {years[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Empty State */}
            {reports.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-outline-variant bg-surface-container/60 p-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FolderOpen size={28} />
                </div>
                <h3 className="mb-1 text-lg font-bold text-on-surface">
                  Belum ada laporan yang diarsipkan
                </h3>
                <p className="max-w-md text-xs text-on-surface-variant">
                  Pindaian buku kas yang diunggah oleh pengurus DKM akan tersusun otomatis di sini per tahun dan bulan.
                </p>
              </div>
            ) : (
              years.map((year) => {
                const yearReportsCount = [...groupedByYear.get(year)!.values()].reduce(
                  (sum, arr) => sum + arr.length,
                  0
                );
                return (
                  <div key={year} className="space-y-5">
                    {/* Year divider */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-primary font-sans tracking-tight shrink-0">
                        Tahun {year}
                      </h3>
                      <span className="text-xs font-semibold text-on-surface-variant/70 shrink-0">
                        ({yearReportsCount} Laporan Tersimpan)
                      </span>
                      <div className="h-px flex-1 bg-outline-variant" />
                    </div>

                    {/* Monthly groups */}
                    <div className="space-y-4">
                      {[...groupedByYear.get(year)!.keys()]
                        .sort((a, b) => b - a)
                        .map((month) => {
                          const monthReports = groupedByYear.get(year)!.get(month)!;
                          const monthMasuk = monthReports.reduce(
                            (sum, r) =>
                              sum +
                              r.transactions
                                .filter((t) => t.type === "pemasukan")
                                .reduce((s, t) => s + Number(t.amount), 0),
                            0
                          );
                          const monthKeluar = monthReports.reduce(
                            (sum, r) =>
                              sum +
                              r.transactions
                                .filter((t) => t.type === "pengeluaran")
                                .reduce((s, t) => s + Number(t.amount), 0),
                            0
                          );
                          const monthNet = monthMasuk - monthKeluar;
                          const totalVerifiedTx = monthReports.reduce(
                            (s, r) => s + r.transactions.length,
                            0
                          );

                          return (
                            <div
                              key={month}
                              className="rounded-2xl border border-outline-variant bg-surface-container overflow-hidden shadow-xs"
                            >
                              {/* Month Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-b border-outline-variant/60 bg-surface-container-high/40">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <CalendarDays size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-on-surface font-sans">
                                      {MONTH_NAMES[month]} {year}
                                    </h4>
                                    <p className="text-xs text-on-surface-variant">
                                      {monthReports.length} laporan pekan &bull; {totalVerifiedTx} transaksi terverifikasi
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                                    +{formatRupiah(monthMasuk)}
                                  </span>
                                  <span className="text-xs text-on-surface-variant">&bull;</span>
                                  <span className="text-xs font-semibold text-rose-700 tabular-nums">
                                    -{formatRupiah(monthKeluar)}
                                  </span>
                                  <span className="text-xs text-on-surface-variant">&bull;</span>
                                  <span className={`text-xs font-bold tabular-nums ${monthNet >= 0 ? "text-primary" : "text-amber-700"}`}>
                                    Net {monthNet >= 0 ? "+" : ""}{formatRupiah(monthNet)}
                                  </span>
                                </div>
                              </div>

                              {/* Grid Laporan Pekanan */}
                              <div className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                                  {monthReports.map((report) => {
                                    const thumb = report.attachments.find((a) => a.fileType === "image");
                                    const repMasuk = report.transactions
                                      .filter((t) => t.type === "pemasukan")
                                      .reduce((s, t) => s + Number(t.amount), 0);
                                    const repKeluar = report.transactions
                                      .filter((t) => t.type === "pengeluaran")
                                      .reduce((s, t) => s + Number(t.amount), 0);

                                    const repDate = new Date(report.reportDate);
                                    const dateFormatted = `${repDate.getUTCDate()} ${MONTH_NAMES[repDate.getUTCMonth() + 1]} ${repDate.getUTCFullYear()}`;

                                    return (
                                      <Link
                                        key={report.id}
                                        href={`/laporan/${report.id}`}
                                        className="group flex flex-col rounded-xl border border-outline-variant bg-surface overflow-hidden transition-all duration-150 hover:border-primary/50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                      >
                                        {/* Thumbnail foto buku kas */}
                                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-high">
                                          {thumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={thumb.fileUrl}
                                              alt={`Buku Kas ${dateFormatted}`}
                                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                            />
                                          ) : (
                                            <div className="h-full w-full flex flex-col items-center justify-center text-on-surface-variant/60 gap-1 p-4 text-center">
                                              <FileText className="h-6 w-6" />
                                              <span className="text-[11px]">Berkas Dokumen</span>
                                            </div>
                                          )}
                                        </div>

                                        <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                                          <div>
                                            <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                                              Jum&apos;at, {dateFormatted}
                                            </div>
                                            <div className="text-[11px] text-on-surface-variant">
                                              Pekan ke-{report.weekOfMonth} &bull; {report.transactions.length} mutasi
                                            </div>
                                          </div>

                                          <div className="pt-2 border-t border-outline-variant/50 flex items-center justify-between text-xs tabular-nums">
                                            <span className="text-emerald-700 font-semibold">
                                              +{formatRupiah(repMasuk)}
                                            </span>
                                            <span className="text-rose-700 font-semibold">
                                              -{formatRupiah(repKeluar)}
                                            </span>
                                          </div>
                                        </div>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </PageShell>
    </AppShell>
  );
}
