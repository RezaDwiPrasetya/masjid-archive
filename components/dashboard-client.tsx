"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  FileText,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Button } from "@/components/ui/button";
import { MonthlyExportDialog } from "@/components/monthly-export-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/page-shell";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

export interface TrendPoint {
  period: string;
  pemasukan: number;
  pengeluaran: number;
}

interface DashboardClientProps {
  initialFinalBalance: number | null;
  latestReportDate: string | null;
  latestReportId: string | null;
}

const chartConfig = {
  pemasukan: {
    label: "Pemasukan",
    color: "hsl(150, 65%, 40%)",
  },
  pengeluaran: {
    label: "Pengeluaran",
    color: "hsl(0, 72%, 56%)",
  },
} satisfies ChartConfig;

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortRupiah(val: number): string {
  if (val === 0) return "0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";

  const formatWithComma = (num: number) => {
    const fixed = num.toFixed(1);
    const clean = fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
    return clean.replace(".", ",");
  };

  if (abs >= 1_000_000_000) {
    return `${sign}${formatWithComma(abs / 1_000_000_000)} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${formatWithComma(abs / 1_000_000)} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${formatWithComma(abs / 1_000)} rb`;
  }
  return `${sign}${abs}`;
}

function formatPeriodLabel(
  dateString: string,
  granularity: "weekly" | "monthly",
  isMobile: boolean = false
): string {
  try {
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) return dateString;

    if (granularity === "monthly") {
      if (isMobile) {
        return date.toLocaleDateString("id-ID", {
          month: "short",
          timeZone: "UTC",
        });
      }
      return date.toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      });
    }

    // Weekly:
    if (isMobile) {
      // Ringkas: misalnya "14/08" (tgl/bln)
      const day = date.getUTCDate();
      const month = date.getUTCMonth() + 1;
      return `${day < 10 ? `0${day}` : day}/${month < 10 ? `0${month}` : month}`;
    }

    // Weekly Desktop: tampilkan tanggal dan bulan laporan kas (Jumat)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  } catch {
    return dateString;
  }
}

function formatTooltipPeriod(
  dateString: string,
  granularity: "weekly" | "monthly"
): string {
  try {
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) return dateString;

    if (granularity === "monthly") {
      // Format bulanan: "September 2026"
      return date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    }

    // Weekly: period adalah tanggal Jumat laporan.
    // Siklus mingguan mencakup 7 hari (dari 6 hari sebelum Jumat hingga hari Jumat)
    const startDate = new Date(date.getTime());
    startDate.setUTCDate(startDate.getUTCDate() - 6);

    const startDay = startDate.getUTCDate();
    const endDay = date.getUTCDate();
    const startMonth = startDate.toLocaleDateString("id-ID", {
      month: "short",
      timeZone: "UTC",
    });
    const endMonth = date.toLocaleDateString("id-ID", {
      month: "short",
      timeZone: "UTC",
    });
    const startYear = startDate.getUTCFullYear();
    const endYear = date.getUTCFullYear();

    if (startYear !== endYear) {
      return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    }
    if (startMonth !== endMonth) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
    }
    return `${startDay}-${endDay} ${endMonth} ${endYear}`;
  } catch {
    return dateString;
  }
}

// Hook untuk animasi count-up halus (~600ms, easing ease-out cubic)
function useCountUp(target: number, duration: number = 600) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easedProgress * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return count;
}

export function DashboardClient({
  initialFinalBalance,
  latestReportDate,
  latestReportId,
}: DashboardClientProps) {
  const [granularity, setGranularity] = React.useState<"weekly" | "monthly">("weekly");
  const animatedBalance = useCountUp(initialFinalBalance ?? 0, 600);
  const [trendData, setTrendData] = React.useState<{
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  }>({ weekly: [], monthly: [] });
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Deteksi viewport mobile (< 768px, di bawah breakpoint md)
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 1. Variabel penentu jumlah periode: HP (< md) = 6, Desktop = 12
  const maxPeriods = isMobile ? 6 : 12;

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [weeklyRes, monthlyRes] = await Promise.all([
          fetch("/api/dashboard/trend?granularity=weekly&periods=12"),
          fetch("/api/dashboard/trend?granularity=monthly&periods=12"),
        ]);

        if (!weeklyRes.ok || !monthlyRes.ok) {
          throw new Error("Gagal memuat tren keuangan");
        }

        const [weeklyJson, monthlyJson] = await Promise.all([
          weeklyRes.json(),
          monthlyRes.json(),
        ]);

        if (!cancelled) {
          setTrendData({
            weekly: weeklyJson?.data?.points ?? [],
            monthly: monthlyJson?.data?.points ?? [],
          });
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching dashboard trend:", err);
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGranularityChange = (newGran: "weekly" | "monthly") => {
    if (newGran === granularity) return;
    setGranularity(newGran);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/dashboard/trend?granularity=weekly&periods=12"),
      fetch("/api/dashboard/trend?granularity=monthly&periods=12"),
    ])
      .then(async ([weeklyRes, monthlyRes]) => {
        if (!weeklyRes.ok || !monthlyRes.ok) {
          throw new Error("Gagal memuat tren keuangan");
        }
        const [weeklyJson, monthlyJson] = await Promise.all([
          weeklyRes.json(),
          monthlyRes.json(),
        ]);
        setTrendData({
          weekly: weeklyJson?.data?.points ?? [],
          monthly: monthlyJson?.data?.points ?? [],
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard trend:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setLoading(false);
      });
  };

  // Titik yang benar-benar tampil untuk masing-masing tab (dipotong sesuai maxPeriods)
  const weeklyVisiblePoints = React.useMemo(
    () => trendData.weekly.slice(-maxPeriods),
    [trendData.weekly, maxPeriods]
  );
  const monthlyVisiblePoints = React.useMemo(
    () => trendData.monthly.slice(-maxPeriods),
    [trendData.monthly, maxPeriods]
  );

  // Titik aktif yang mengontrol grafik & KPI
  const visiblePoints = granularity === "weekly" ? weeklyVisiblePoints : monthlyVisiblePoints;

  // 2. Label dinamis
  const weeklyTabLabel =
    weeklyVisiblePoints.length > 0
      ? `Mingguan (${weeklyVisiblePoints.length} Pekan)`
      : "Mingguan";
  const monthlyTabLabel =
    monthlyVisiblePoints.length > 0
      ? `Bulanan (${monthlyVisiblePoints.length} Bulan)`
      : "Bulanan";

  const currentUnit = granularity === "weekly" ? "Pekan" : "Bulan";
  const periodCountLabel = `${visiblePoints.length} ${currentUnit}`;

  // Perhitungan KPI dikontrol oleh variabel visiblePoints yang sama
  const totalPemasukan = visiblePoints.reduce((acc, p) => acc + p.pemasukan, 0);
  const totalPengeluaran = visiblePoints.reduce((acc, p) => acc + p.pengeluaran, 0);
  const netChange = totalPemasukan - totalPengeluaran;

  const chartData = visiblePoints.map((p) => ({
    period: p.period,
    label: formatPeriodLabel(p.period, granularity, isMobile),
    tooltipLabel: formatTooltipPeriod(p.period, granularity),
    pemasukan: p.pemasukan,
    pengeluaran: p.pengeluaran,
  }));

  // 3. Render label bar: di HP (< md) sembunyikan angka di atas batang
  // Pada desktop: putar label vertikal (-90 derajat) di atas batang agar tidak saling menimpa
  const renderBarLabel = (props: {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    value?: unknown;
  }) => {
    if (isMobile) {
      return null;
    }
    const { x, y, width, value } = props;
    const num = Number(value);
    if (!num || num <= 0) return null;

    const cx = Number(x || 0) + Number(width || 0) / 2;
    const cy = Number(y || 0) - 8;

    return (
      <text
        x={cx}
        y={cy}
        transform={`rotate(-90 ${cx} ${cy})`}
        textAnchor="start"
        dominantBaseline="central"
        fontSize={11}
        className="fill-muted-foreground text-[11px] font-medium select-none"
      >
        {formatShortRupiah(num)}
      </text>
    );
  };

  const heroContent = (
    <div>
      <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-primary-fixed">
        <Wallet className="h-4 w-4 shrink-0" />
        <span>Saldo Kas Terkini • Buku Kas Terverifikasi</span>
      </div>

      <div className="mt-3 text-4xl sm:text-5xl md:text-[56px] font-semibold leading-tight md:leading-[64px] tracking-tight tabular-nums text-on-primary">
        {initialFinalBalance !== null
          ? formatRupiah(animatedBalance)
          : "Belum Ada"}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs md:text-sm text-primary-fixed/80">
        {latestReportDate ? (
          <>
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              Laporan terakhir:{" "}
              {new Date(latestReportDate).toLocaleDateString("id-ID", {
                dateStyle: "medium",
              })}
            </span>
            {latestReportId && (
              <Link
                href={`/laporan/${latestReportId}`}
                className="inline-flex items-center gap-1 text-primary-fixed hover:underline ml-1"
              >
                <span>(Lihat Dokumen)</span>
                <FileText className="h-3 w-3" />
              </Link>
            )}
          </>
        ) : (
          <span>Belum ada laporan dengan saldo kas terverifikasi.</span>
        )}
      </div>
    </div>
  );

  return (
    <PageShell heroBand={heroContent}>
      <div className="space-y-8">
        {/* Banner Status Pengumpulan Data */}
        <Alert
          variant="info"
          className="flex items-center gap-2.5 py-2.5 px-4 text-xs rounded-lg shadow-none"
        >
          <Info className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-xs text-emerald-950 dark:text-emerald-100 font-medium leading-none">
            Data masih dalam tahap pengumpulan awal — sebagian periode mungkin belum lengkap.
          </AlertDescription>
        </Alert>

        {/* Header Section & Toggle Granularity */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Ringkasan Kas & Tren
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Pergerakan kas masuk, kas keluar, dan arus kas bersih kas masjid.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
            <MonthlyExportDialog />
            <div className="inline-flex items-center rounded-lg border border-outline-variant bg-surface-container p-1">
              <Button
                size="sm"
                variant={granularity === "weekly" ? "default" : "ghost"}
                onClick={() => handleGranularityChange("weekly")}
                className="rounded-md px-3.5 text-xs font-medium transition-all"
                disabled={loading}
              >
                {weeklyTabLabel}
              </Button>
              <Button
                size="sm"
                variant={granularity === "monthly" ? "default" : "ghost"}
                onClick={() => handleGranularityChange("monthly")}
                className="rounded-md px-3.5 text-xs font-medium transition-all"
                disabled={loading}
              >
                {monthlyTabLabel}
              </Button>
            </div>
          </div>
        </div>

        {/* 3 Angka Sekunder Sejajar Horizontal Terpisah Garis Vertikal (BUKAN KOTAK KARTU) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant py-4 border-y border-outline-variant">
          {/* Total Pemasukan */}
          <div className="py-3 sm:py-0 sm:px-6 first:sm:pl-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <ArrowUpRight className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Total Pemasukan ({periodCountLabel})
              </span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-2 rounded bg-surface-container-high" />
            ) : (
              <div className="mt-1 text-2xl font-semibold text-emerald-700 tabular-nums">
                {formatRupiah(totalPemasukan)}
              </div>
            )}
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Akumulasi infaq & pemasukan terverifikasi
            </p>
          </div>

          {/* Total Pengeluaran */}
          <div className="py-3 sm:py-0 sm:px-6">
            <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <ArrowDownRight className="h-4 w-4 text-rose-500 shrink-0" />
              <span>
                Total Pengeluaran ({periodCountLabel})
              </span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-2 rounded bg-surface-container-high" />
            ) : (
              <div className="mt-1 text-2xl font-semibold text-rose-600 tabular-nums">
                {formatRupiah(totalPengeluaran)}
              </div>
            )}
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Akumulasi biaya operasional & pengeluaran
            </p>
          </div>

          {/* Arus Kas Bersih */}
          <div className="py-3 sm:py-0 sm:px-6 last:sm:pr-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <Scale className="h-4 w-4 shrink-0" />
              <span>Arus Kas Bersih ({periodCountLabel})</span>
              {netChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 ml-auto" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-500 ml-auto" />
              )}
            </div>
            {loading ? (
              <Skeleton className="h-8 w-32 mt-2 rounded bg-surface-container-high" />
            ) : (
              <div
                className={`mt-1 text-2xl font-semibold tabular-nums ${
                  netChange >= 0 ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {netChange >= 0 ? "+" : ""}
                {formatRupiah(netChange)}
              </div>
            )}
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {netChange >= 0
                ? "Surplus kas pada periode ini"
                : "Defisit kas pada periode ini"}
            </p>
          </div>
        </div>

        {/* 3. GRAFIK TREN KEUANGAN: Menyatu dengan latar halaman (Tanpa Kartu/Border/Shadow) */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Pemasukan dan Pengeluaran Kas
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Perbandingan uang masuk dan uang keluar kas masjid dalam rupiah (hanya transaksi terverifikasi).
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant/80">
                {granularity === "weekly"
                  ? "Setiap titik mewakili total transaksi terverifikasi dalam satu periode mingguan (laporan kas Jumat)."
                  : "Setiap titik mewakili total transaksi terverifikasi dalam satu periode bulanan."}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-600" />
                <span className="text-on-surface">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-on-surface">Pengeluaran</span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-destructive/40 bg-surface/50">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="mt-4"
              >
                Coba Lagi
              </Button>
            </div>
          ) : loading ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-[280px] w-full rounded-lg bg-surface-container-high" />
              <div className="flex justify-between px-4">
                <Skeleton className="h-4 w-12 bg-surface-container-high" />
                <Skeleton className="h-4 w-12 bg-surface-container-high" />
                <Skeleton className="h-4 w-12 bg-surface-container-high" />
                <Skeleton className="h-4 w-12 bg-surface-container-high" />
                <Skeleton className="h-4 w-12 bg-surface-container-high" />
                <Skeleton className="h-4 w-12 bg-surface-container-high" />
              </div>
            </div>
          ) : visiblePoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-outline-variant bg-surface/50">
              <Wallet className="h-12 w-12 text-on-surface-variant/40 mb-3" />
              <p className="text-base font-semibold text-on-surface">
                Belum ada data transaksi terverifikasi untuk ditampilkan
              </p>
              <p className="text-sm text-on-surface-variant max-w-sm mt-1">
                Data grafik tren akan otomatis tampil setelah pengurus memverifikasi transaksi laporan kas mingguan.
              </p>
            </div>
          ) : (
            <div className="w-full pt-2">
              <ChartContainer config={chartConfig} className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: isMobile ? 12 : 36,
                      right: isMobile ? 8 : 16,
                      left: isMobile ? -6 : 8,
                      bottom: isMobile ? 8 : 20,
                    }}
                    barGap={isMobile ? 3 : 6}
                    barCategoryGap={isMobile ? "18%" : "22%"}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-outline-variant/60"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={isMobile ? 6 : 10}
                      interval={0}
                      className="text-[10px] sm:text-xs fill-on-surface-variant font-medium"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={isMobile ? 4 : 8}
                      tickFormatter={formatShortRupiah}
                      domain={[
                        0,
                        (dataMax: number) =>
                          dataMax > 0
                            ? Math.ceil((dataMax * 1.15) / 50000) * 50000
                            : "auto",
                      ]}
                      className="text-[10px] sm:text-xs fill-on-surface-variant"
                      width={isMobile ? 56 : 70}
                    />
                    <ChartTooltip
                      cursor={{ fill: "currentColor", opacity: 0.08 }}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const item = payload?.[0]?.payload as
                              | { tooltipLabel?: string }
                              | undefined;
                            return `Periode: ${item?.tooltipLabel || ""}`;
                          }}
                          valueFormatter={(val) => formatRupiah(val)}
                        />
                      }
                    />
                    <Bar
                      dataKey="pemasukan"
                      fill="hsl(150, 65%, 40%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 22 : 38}
                    >
                      <LabelList
                        dataKey="pemasukan"
                        content={renderBarLabel}
                      />
                    </Bar>
                    <Bar
                      dataKey="pengeluaran"
                      fill="hsl(0, 72%, 56%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isMobile ? 22 : 38}
                    >
                      <LabelList
                        dataKey="pengeluaran"
                        content={renderBarLabel}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <p className="mt-3 text-center text-xs text-on-surface-variant">
                Hijau menunjukkan uang masuk, merah menunjukkan uang keluar.
                {isMobile && (
                  <span className="block mt-1 text-[11px] text-on-surface-variant/80">
                    💡 Sentuh batang grafik untuk melihat rincian kas
                  </span>
                )}
              </p>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
