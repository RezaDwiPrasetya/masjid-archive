import { prisma } from "@/lib/prisma";

export interface PeriodFilter {
  year: number | null;
  month: number | null;
}

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/**
 * Parsing parameter query `year` dan `month` dari request URL
 */
export function parsePeriodParams(searchParams: URLSearchParams): PeriodFilter {
  const yearStr = searchParams.get("year");
  const monthStr = searchParams.get("month");

  let year: number | null = null;
  let month: number | null = null;

  if (yearStr !== null && yearStr !== "" && yearStr !== "all") {
    const parsedYear = parseInt(yearStr, 10);
    if (!isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100) {
      year = parsedYear;
    }
  }

  if (monthStr !== null && monthStr !== "" && monthStr !== "all") {
    const parsedMonth = parseInt(monthStr, 10);
    if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
      month = parsedMonth;
    }
  }

  return { year, month };
}

/**
 * Bangun kondisi relasi `report` untuk klausa WHERE transaksi di Prisma
 */
export function buildReportRelationFilter(period: PeriodFilter): { year?: number; month?: number } | undefined {
  const filter: { year?: number; month?: number } = {};
  if (period.year !== null) {
    filter.year = period.year;
  }
  if (period.month !== null) {
    filter.month = period.month;
  }
  return Object.keys(filter).length > 0 ? filter : undefined;
}

/**
 * Ambil daftar tahun unik yang tersimpan di arsip laporan kas masjid
 */
export async function getAvailableYears(): Promise<number[]> {
  try {
    const reports = await prisma.report.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    });
    const currentYear = new Date().getFullYear();
    const years = reports.map((r) => r.year);
    if (!years.includes(currentYear)) {
      years.unshift(currentYear);
    }
    return Array.from(new Set(years)).sort((a, b) => b - a);
  } catch {
    return [new Date().getFullYear()];
  }
}
