import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import {
  parsePeriodParams,
  buildReportRelationFilter,
  getAvailableYears,
} from "@/lib/period-filter";

export const dynamic = "force-dynamic";

/**
 * GET /api/expenses
 * Agregasi total pengeluaran per kategori (V7 — F-023, Diperluas V8 — Issue #66)
 *
 * Query params (opsional):
 * - year: filter tahun laporan (contoh: 2026)
 * - month: filter bulan laporan (1-12)
 *
 * Aturan Bisnis & Keamanan:
 * - Akses publik (tidak perlu login)
 * - MUTLAK hanya mengembalikan transaksi isVerified = true & type = "pengeluaran"
 * - Mengembalikan breakdown per kategori + total keseluruhan + metadata periode
 */
export async function GET(request?: NextRequest) {
  try {
    const searchParams = request ? request.nextUrl.searchParams : new URLSearchParams();
    const period = parsePeriodParams(searchParams);
    const reportFilter = buildReportRelationFilter(period);

    const whereBase = {
      isVerified: true,
      type: "pengeluaran" as const,
      ...(reportFilter ? { report: reportFilter } : {}),
    };

    // 1. Total agregat keseluruhan pengeluaran pada periode terpilih
    const [totalAgg, byCategory, availableYears] = await Promise.all([
      prisma.transaction.aggregate({
        where: whereBase,
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 2. Breakdown per kategori (groupBy)
      prisma.transaction.groupBy({
        by: ["category"],
        where: whereBase,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
      // 3. Daftar tahun dinamis dari database
      getAvailableYears(),
    ]);

    const totalAmount = Number(totalAgg._sum.amount ?? 0);

    // 4. Bangun response dengan label dari EXPENSE_CATEGORIES dan persentase
    const categoryBreakdown = byCategory.map((row) => {
      const amount = Number(row._sum.amount ?? 0);
      const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
      return {
        category: row.category,
        label: row.category
          ? (EXPENSE_CATEGORIES.find((c) => c.value === row.category)?.label ??
            row.category)
          : "Tidak Dikategorikan",
        totalAmount: amount,
        transactionCount: row._count.id,
        percentage,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalAmount,
        transactionCount: totalAgg._count.id,
        breakdown: categoryBreakdown,
        period: {
          year: period.year,
          month: period.month,
        },
        availableYears,
      },
    });
  } catch (error) {
    console.error("[Expenses API] Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data ringkasan pengeluaran" },
      { status: 500 }
    );
  }
}
