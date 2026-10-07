import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import {
  parsePeriodParams,
  buildReportRelationFilter,
} from "@/lib/period-filter";

export const dynamic = "force-dynamic";

/**
 * GET /api/expenses/transactions
 * Daftar rincian transaksi pengeluaran terverifikasi (V7 — F-023, Diperluas V8 — Issue #66)
 *
 * Query params:
 * - year: filter tahun pengeluaran (opsional)
 * - month: filter bulan pengeluaran (opsional)
 * - category: filter per kategori (opsional). Gunakan "null" untuk transaksi tanpa kategori.
 * - limit: maks item per halaman (default 100, maks 200)
 * - offset: skip items untuk paginasi (default 0)
 *
 * Aturan Bisnis & Keamanan:
 * - Akses publik (tidak perlu login)
 * - MUTLAK hanya mengembalikan transaksi isVerified = true & type = "pengeluaran"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Filter periode waktu (V8)
    const period = parsePeriodParams(searchParams);
    const reportFilter = buildReportRelationFilter(period);

    // Paginasi
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "100", 10), 1),
      200
    );
    const offset = Math.max(
      parseInt(searchParams.get("offset") || "0", 10),
      0
    );

    // Filter kategori — "null" sebagai string berarti filter transaksi tanpa kategori
    const categoryParam = searchParams.get("category");
    let categoryFilter: string | null | undefined = undefined; // undefined = tidak difilter

    if (categoryParam !== null) {
      if (categoryParam === "null" || categoryParam === "") {
        categoryFilter = null; // filter NULL di database
      } else {
        // Validasi nilai kategori
        const validValues = EXPENSE_CATEGORIES.map((c) => c.value);
        if (validValues.includes(categoryParam as (typeof EXPENSE_CATEGORIES)[number]["value"])) {
          categoryFilter = categoryParam;
        }
        // Jika tidak valid, abaikan filter (kembalikan semua)
      }
    }

    const whereClause = {
      isVerified: true,
      type: "pengeluaran" as const,
      ...(categoryFilter !== undefined
        ? { category: categoryFilter }
        : {}),
      ...(reportFilter ? { report: reportFilter } : {}),
    };

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        report: {
          select: {
            id: true,
            reportDate: true,
            year: true,
            month: true,
            weekOfMonth: true,
          },
        },
      },
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      take: limit,
      skip: offset,
    });

    const total = await prisma.transaction.count({ where: whereClause });

    const formatted = transactions.map((t) => {
      const rawDate = t.transactionDate ?? t.report.reportDate;
      return {
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        transactionDate: rawDate
          ? rawDate.toISOString().split("T")[0]
          : null,
        category: t.category,
        reportId: t.reportId,
        reportDate: t.report.reportDate.toISOString().split("T")[0],
        reportPeriod: `Pekan ${t.report.weekOfMonth}, ${t.report.month}/${t.report.year}`,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: formatted,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("[Expenses Transactions API] Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data rincian pengeluaran" },
      { status: 500 }
    );
  }
}
