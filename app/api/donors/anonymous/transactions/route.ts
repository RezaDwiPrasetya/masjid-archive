import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/donors/anonymous/transactions
 * Rincian riwayat transaksi infaq anonim terverifikasi (F-018, Issue #054)
 *
 * Aturan Bisnis & Keamanan:
 * - Akses publik (jemaah tidak perlu login)
 * - MUTLAK hanya mengembalikan transaksi yang:
 *   1. isVerified = true (data unverified/draft TIDAK BOLEH bocor)
 *   2. type = "pemasukan"
 *   3. donorId = null (transaksi tanpa identitas donatur perorangan/usaha)
 * - Diurutkan dari transaksi paling mutakhir (DESC)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "100", 10), 1),
      200
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const whereClause = {
      isVerified: true,
      type: "pemasukan" as const,
      donorId: null,
    };

    // 1. Ambil agregat total & count (selalu klop dengan kartu KPI di /donatur)
    const aggregate = await prisma.transaction.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
    });

    // 2. Ambil daftar transaksi dengan relasi report untuk navigasi ke laporan fisik
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
      orderBy: [
        { transactionDate: "desc" },
        { id: "desc" },
      ],
      take: limit,
      skip: offset,
    });

    const formattedTransactions = transactions.map((t) => {
      const rawDate = t.transactionDate ?? t.report.reportDate;
      const formattedDate = rawDate
        ? rawDate.toISOString().split("T")[0]
        : null;

      return {
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        transactionDate: formattedDate,
        rawTransactionDate: rawDate ? rawDate.toISOString() : null,
        reportId: t.reportId,
        reportDate: t.report.reportDate.toISOString().split("T")[0],
        reportPeriod: `Pekan ${t.report.weekOfMonth}, ${t.report.month}/${t.report.year}`,
      };
    });

    return NextResponse.json({
      data: {
        totalContribution: Number(aggregate._sum.amount ?? 0),
        donationCount: aggregate._count.id,
        transactions: formattedTransactions,
      },
    });
  } catch (error) {
    console.error("[Anonymous Transactions API] Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi anonim" },
      { status: 500 }
    );
  }
}
