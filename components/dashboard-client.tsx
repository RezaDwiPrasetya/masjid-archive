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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1)} M`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)} jt`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(0)} rb`;
  }
  return val.toString();
}

function formatPeriodLabel(
  dateString: string,
  granularity: "weekly" | "monthly"
): string {
  try {
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) return dateString;

    if (granularity === "monthly") {
      return date.toLocaleDateString("id-ID", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      });
    }

    // Weekly: tampilkan tanggal dan bulan awal pekan
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  } catch {
    return dateString;
  }
}

export function DashboardClient({
  initialFinalBalance,
  latestReportDate,
  latestReportId,
}: DashboardClientProps) {
  const [granularity, setGranularity] = React.useState<"weekly" | "monthly">(
    "weekly"
  );
  const [points, setPoints] = React.useState<TrendPoint[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(
          `/api/dashboard/trend?granularity=${granularity}&periods=12`
        );
        if (!res.ok) {
          throw new Error(`Gagal memuat tren keuangan (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setPoints(json?.data?.points ?? []);
          setError(null);
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

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [granularity]);

  const handleGranularityChange = (newGran: "weekly" | "monthly") => {
    if (newGran === granularity) return;
    setLoading(true);
    setGranularity(newGran);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard/trend?granularity=${granularity}&periods=12`)
      .then((res) => {
        if (!res.ok) throw new Error(`Gagal memuat tren keuangan (${res.status})`);
        return res.json();
      })
      .then((json) => {
        setPoints(json?.data?.points ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setLoading(false);
      });
  };

  // Agregasi untuk periode saat ini
  const totalPemasukan = points.reduce((acc, p) => acc + p.pemasukan, 0);
  const totalPengeluaran = points.reduce((acc, p) => acc + p.pengeluaran, 0);
  const netChange = totalPemasukan - totalPengeluaran;

  const chartData = points.map((p) => ({
    period: p.period,
    label: formatPeriodLabel(p.period, granularity),
    pemasukan: p.pemasukan,
    pengeluaran: p.pengeluaran,
  }));

  return (
    <div className="space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard Keuangan
          </h1>
          <p className="text-muted-foreground mt-1">
            Transparansi pergerakan kas dan tren keuangan kas masjid dari waktu ke waktu.
          </p>
        </div>

        {/* Granularity Toggle */}
        <div className="inline-flex items-center rounded-2xl border border-white/30 bg-card/60 p-1.5 shadow-sm backdrop-blur-md self-start md:self-auto">
          <Button
            size="sm"
            variant={granularity === "weekly" ? "default" : "ghost"}
            onClick={() => handleGranularityChange("weekly")}
            className="rounded-xl px-4 font-medium transition-all"
            disabled={loading}
          >
            Mingguan (12 Pekan)
          </Button>
          <Button
            size="sm"
            variant={granularity === "monthly" ? "default" : "ghost"}
            onClick={() => handleGranularityChange("monthly")}
            className="rounded-xl px-4 font-medium transition-all"
            disabled={loading}
          >
            Bulanan (12 Bulan)
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI UTAMA: Saldo Kas Terkini (Report.finalBalance) */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-emerald-500/10 via-card/70 to-teal-500/5 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5">
              <Wallet className="h-4 w-4" />
              Saldo Kas Terkini
            </CardTitle>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Buku Kas
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {initialFinalBalance !== null
                ? formatRupiah(initialFinalBalance)
                : "Belum Ada"}
            </div>
            {latestReportDate ? (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  Laporan:{" "}
                  {new Date(latestReportDate).toLocaleDateString("id-ID", {
                    dateStyle: "medium",
                  })}
                </span>
                {latestReportId && (
                  <Link
                    href={`/laporan/${latestReportId}`}
                    className="inline-flex items-center text-primary hover:underline ml-auto"
                    title="Lihat Laporan Asal"
                  >
                    <FileText className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Belum ada laporan dengan saldo kas terverifikasi.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Pemasukan Periode */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              Total Pemasukan
            </CardTitle>
            <span className="text-[11px] text-muted-foreground capitalize">
              {granularity === "weekly" ? "12 Pekan" : "12 Bulan"}
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-emerald-700">
                {formatRupiah(totalPemasukan)}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Akumulasi infaq & pemasukan terverifikasi
            </p>
          </CardContent>
        </Card>

        {/* Total Pengeluaran Periode */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
              Total Pengeluaran
            </CardTitle>
            <span className="text-[11px] text-muted-foreground capitalize">
              {granularity === "weekly" ? "12 Pekan" : "12 Bulan"}
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-rose-600">
                {formatRupiah(totalPengeluaran)}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Akumulasi biaya operasional & pengeluaran
            </p>
          </CardContent>
        </Card>

        {/* Arus Kas Bersih (Net Change) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              Arus Kas Bersih
            </CardTitle>
            {netChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div
                className={`text-2xl font-bold ${
                  netChange >= 0 ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {netChange >= 0 ? "+" : ""}
                {formatRupiah(netChange)}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {netChange >= 0
                ? "Surplus kas pada periode ini"
                : "Defisit kas pada periode ini"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafik Tren Keuangan */}
      <Card className="p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tren Pemasukan vs Pengeluaran
            </h2>
            <p className="text-sm text-muted-foreground">
              Perbandingan arus kas masuk dan kas keluar per periode (hanya data terverifikasi).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[hsl(150,65%,40%)]" />
              <span className="font-medium text-muted-foreground">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[hsl(0,72%,56%)]" />
              <span className="font-medium text-muted-foreground">Pengeluaran</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
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
            <Skeleton className="h-[280px] w-full rounded-2xl" />
            <div className="flex justify-between px-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ) : points.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-base font-semibold text-foreground">
              Belum ada data transaksi terverifikasi
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Data grafik tren akan otomatis tampil setelah pengurus memverifikasi transaksi laporan kas mingguan.
            </p>
          </div>
        ) : (
          <div className="w-full pt-2">
            <ChartContainer config={chartConfig} className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted/50"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-xs fill-muted-foreground font-medium"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatShortRupiah}
                    className="text-xs fill-muted-foreground"
                    width={56}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(lbl) => `Periode: ${lbl}`}
                        valueFormatter={(val) => formatRupiah(val)}
                      />
                    }
                  />
                  <Bar
                    dataKey="pemasukan"
                    fill="hsl(150, 65%, 40%)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="pengeluaran"
                    fill="hsl(0, 72%, 56%)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
