"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Printer,
  FileSpreadsheet,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export interface TrendPoint {
  period: string;
  pemasukan: number;
  pengeluaran: number;
}

export interface CashflowTrendSectionProps {
  initialYear?: number;
  initialMonth?: number;
  availableYears?: number[];
  showTitle?: boolean;
  className?: string;
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

    if (isMobile) {
      const day = date.getUTCDate();
      const month = date.getUTCMonth() + 1;
      return `${day < 10 ? `0${day}` : day}/${month < 10 ? `0${month}` : month}`;
    }

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
      return date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    }

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

export function CashflowTrendSection({
  initialYear,
  initialMonth,
  availableYears,
  showTitle = true,
  className,
}: CashflowTrendSectionProps) {
  const router = useRouter();

  const now = React.useMemo(() => new Date(), []);
  const defaultYear = initialYear ?? now.getUTCFullYear();
  const defaultMonth = initialMonth ?? now.getUTCMonth() + 1;

  const [granularity, setGranularity] = React.useState<"weekly" | "monthly">("weekly");
  const [selectedYear, setSelectedYear] = React.useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(defaultMonth);
  const [semester, setSemester] = React.useState<"s1" | "s2">(defaultMonth <= 6 ? "s1" : "s2");
  const [isMobile, setIsMobile] = React.useState(false);

  const [trendData, setTrendData] = React.useState<{
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  }>({ weekly: [], monthly: [] });
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSwitching, setIsSwitching] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const yearOptions = React.useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(now.getFullYear());
    yearsSet.add(now.getFullYear() - 1);
    yearsSet.add(selectedYear);
    if (availableYears) {
      availableYears.forEach((y) => yearsSet.add(y));
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [now, selectedYear, availableYears]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const weeklyUrl = `/api/dashboard/trend?granularity=weekly&year=${selectedYear}&month=${selectedMonth}`;
        const monthlyUrl = `/api/dashboard/trend?granularity=monthly&year=${selectedYear}`;

        const [weeklyRes, monthlyRes] = await Promise.all([
          fetch(weeklyUrl),
          fetch(monthlyUrl),
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
          console.error("Error fetching trend:", err);
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth]);

  const handleGranularityChange = (newGran: "weekly" | "monthly") => {
    if (newGran === granularity) return;
    setIsSwitching(true);
    setTimeout(() => {
      setGranularity(newGran);
      setTimeout(() => {
        setIsSwitching(false);
      }, 40);
    }, 120);
  };

  const handleDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const weeklyVisiblePoints = trendData.weekly;
  const monthlyVisiblePoints = React.useMemo(() => {
    if (!isMobile) {
      return trendData.monthly;
    }
    if (semester === "s1") {
      return trendData.monthly.slice(0, 6);
    }
    return trendData.monthly.slice(6, 12);
  }, [trendData.monthly, isMobile, semester]);

  const visiblePoints = granularity === "weekly" ? weeklyVisiblePoints : monthlyVisiblePoints;
  const currentMonthName = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || "";
  const periodCountLabel =
    granularity === "weekly"
      ? `${currentMonthName} ${selectedYear}`
      : `Tahun ${selectedYear}`;

  const kpiPoints = granularity === "weekly" ? trendData.weekly : trendData.monthly;
  const totalPemasukan = kpiPoints.reduce((acc, p) => acc + p.pemasukan, 0);
  const totalPengeluaran = kpiPoints.reduce((acc, p) => acc + p.pengeluaran, 0);
  const netChange = totalPemasukan - totalPengeluaran;

  const chartData = visiblePoints.map((p) => ({
    period: p.period,
    label: formatPeriodLabel(p.period, granularity, isMobile),
    tooltipLabel: formatTooltipPeriod(p.period, granularity),
    pemasukan: p.pemasukan,
    pengeluaran: p.pengeluaran,
  }));

  const renderBarLabel = (props: {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    value?: unknown;
  }) => {
    if (isMobile) return null;
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

  return (
    <section className={cn("space-y-6", className)}>
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {showTitle && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                Ringkasan Kas & Tren
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Pergerakan kas masuk, kas keluar, dan arus kas bersih kas masjid terverifikasi.
              </p>
            </div>
          )}

          {/* Quick Export & Print Actions */}
          <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (granularity === "monthly") {
                  router.push(`/laporan/cetak/tahunan?year=${selectedYear}`);
                } else {
                  router.push(`/laporan/cetak/bulanan?year=${selectedYear}&month=${selectedMonth}`);
                }
              }}
              className="h-8 gap-1.5 text-xs font-semibold px-2.5 border-outline-variant hover:bg-surface-container-high transition-colors"
              title={
                granularity === "monthly"
                  ? `Buka pratinjau cetak laporan kas tahun ${selectedYear} (A4)`
                  : `Buka pratinjau cetak laporan kas bulan ${currentMonthName} ${selectedYear} (A4)`
              }
            >
              <Printer size={13} className="text-primary" />
              <span>Cetak Laporan</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (granularity === "monthly") {
                  handleDownload(`/api/reports/export/yearly/excel?year=${selectedYear}`);
                } else {
                  handleDownload(`/api/reports/export/monthly/excel?year=${selectedYear}&month=${selectedMonth}`);
                }
              }}
              className="h-8 gap-1.5 text-xs font-semibold px-2.5 border-outline-variant hover:bg-surface-container-high text-primary transition-colors"
              title={
                granularity === "monthly"
                  ? `Unduh rekapitulasi Excel tahun ${selectedYear}`
                  : `Unduh rekapitulasi Excel bulan ${currentMonthName} ${selectedYear}`
              }
            >
              <FileSpreadsheet size={13} />
              <span>Excel</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar: Mode Switcher + Periode Dropdowns */}
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-outline-variant/70 bg-surface-container-low p-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Mode: Mingguan vs Tahunan */}
            <div className="inline-flex items-center rounded-lg border border-outline-variant bg-surface p-0.5">
              <Button
                size="sm"
                variant={granularity === "weekly" ? "default" : "ghost"}
                onClick={() => handleGranularityChange("weekly")}
                className="rounded-md px-3 h-7 text-xs font-medium transition-all"
                disabled={loading}
              >
                Mingguan
              </Button>
              <Button
                size="sm"
                variant={granularity === "monthly" ? "default" : "ghost"}
                onClick={() => handleGranularityChange("monthly")}
                className="rounded-md px-3 h-7 text-xs font-medium transition-all"
                disabled={loading}
              >
                Tahunan
              </Button>
            </div>

            {/* Selector Bulan (hanya saat mode Mingguan) */}
            {granularity === "weekly" && (
              <div className="flex items-center gap-1">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="h-7 rounded-lg border border-outline-variant bg-surface px-2.5 text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector Tahun */}
            <div className="flex items-center gap-1">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="h-7 rounded-lg border border-outline-variant bg-surface px-2.5 text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Khusus Mobile pada Mode Tahunan: Selector Semester (Jan-Jun vs Jul-Des) */}
          {granularity === "monthly" && isMobile && (
            <div className="inline-flex items-center rounded-lg border border-outline-variant bg-surface p-0.5 self-end">
              <Button
                size="sm"
                variant={semester === "s1" ? "default" : "ghost"}
                onClick={() => setSemester("s1")}
                className="rounded-md px-2.5 h-6 text-[11px] font-medium"
              >
                Jan - Jun
              </Button>
              <Button
                size="sm"
                variant={semester === "s2" ? "default" : "ghost"}
                onClick={() => setSemester("s2")}
                className="rounded-md px-2.5 h-6 text-[11px] font-medium"
              >
                Jul - Des
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 3 Angka Sekunder Sejajar Horizontal Terpisah Garis Vertikal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant py-4 border-y border-outline-variant">
        {/* Total Pemasukan */}
        <div className="py-3 sm:py-0 sm:px-6 first:sm:pl-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
            <ArrowUpRight className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Total Pemasukan ({periodCountLabel})</span>
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
            <span>Total Pengeluaran ({periodCountLabel})</span>
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
            {netChange >= 0 ? "Surplus kas pada periode ini" : "Defisit kas pada periode ini"}
          </p>
        </div>
      </div>

      {/* Visual Chart Area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
            <TrendingUp size={16} className="text-primary" />
            <span>Pemasukan dan Pengeluaran Kas</span>
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Pemasukan</span>
            </span>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Pengeluaran</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-[360px] w-full flex flex-col justify-end gap-2 pb-8 pt-4">
            <div className="flex items-end justify-between gap-2 h-full px-4">
              <Skeleton className="h-3/4 w-8 bg-surface-container-high" />
              <Skeleton className="h-1/2 w-8 bg-surface-container-high" />
              <Skeleton className="h-2/3 w-8 bg-surface-container-high" />
              <Skeleton className="h-4/5 w-8 bg-surface-container-high" />
            </div>
            <div className="flex justify-between px-4">
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
          <div
            className={cn(
              "w-full pt-2 transition-all duration-300 ease-out",
              isSwitching ? "opacity-20 scale-[0.985] blur-[1px]" : "opacity-100 scale-100 blur-0"
            )}
          >
            <ChartContainer config={chartConfig} className="h-[360px] w-full">
              <BarChart
                key={granularity}
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
                      dataMax > 0 ? Math.ceil((dataMax * 1.15) / 50000) * 50000 : "auto",
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
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  <LabelList dataKey="pemasukan" content={renderBarLabel} />
                </Bar>
                <Bar
                  dataKey="pengeluaran"
                  fill="hsl(0, 72%, 56%)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={isMobile ? 22 : 38}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  <LabelList dataKey="pengeluaran" content={renderBarLabel} />
                </Bar>
              </BarChart>
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
      </div>
    </section>
  );
}
