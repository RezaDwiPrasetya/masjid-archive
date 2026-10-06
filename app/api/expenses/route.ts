import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

export const dynamic = "force-dynamic";

/**
 * GET /api/expenses
 * Agregasi total pengeluaran per kategori (V7 — F-023)
 *
 * Aturan Bisnis & Keamanan:
 * - Akses publik (tidak perlu login)
 * - MUTLAK hanya mengembalikan transaksi isVerified = true & type = "pengeluaran"
 * - Mengembalikan breakdown per kategori + total keseluruhan
 */
export async function GET() {
  try {
    const whereBase = {
      isVerified: true,
      type: "pengeluaran" as const,
    };

    // 1. Total agregat keseluruhan pengeluaran
    const totalAgg = await prisma.transaction.aggregate({
      where: whereBase,
      _sum: { amount: true },
      _count: { id: true },
    });

    // 2. Breakdown per kategori (groupBy)
    const byCategory = await prisma.transaction.groupBy({
      by: ["category"],
      where: whereBase,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    // 3. Bangun response dengan label dari EXPENSE_CATEGORIES
    // Pastikan semua kategori dikenal tampil, bahkan jika 0 (opsional)
    const categoryBreakdown = byCategory.map((row) => ({
      category: row.category,
      label: row.category
        ? (EXPENSE_CATEGORIES.find((c) => c.value === row.category)?.label ??
          row.category)
        : "Tidak Dikategorikan",
      totalAmount: Number(row._sum.amount ?? 0),
      transactionCount: row._count.id,
    }));

    return NextResponse.json({
      data: {
        totalAmount: Number(totalAgg._sum.amount ?? 0),
        transactionCount: totalAgg._count.id,
        breakdown: categoryBreakdown,
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
