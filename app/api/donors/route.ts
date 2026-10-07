import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePeriodParams,
  buildReportRelationFilter,
  getAvailableYears,
} from "@/lib/period-filter";

export const dynamic = "force-dynamic";

/**
 * GET /api/donors
 * Daftar seluruh donatur beserta total kontribusi terverifikasi & agregat anonim (F-015, Diperluas V8 — Issue #66)
 *
 * Query params (opsional):
 * - year: filter tahun transaksi (contoh: 2026)
 * - month: filter bulan transaksi (1-12)
 *
 * Akses publik — TANPA sesi NextAuth, tapi WAJIB memfilter isVerified: true
 */
export async function GET(request?: NextRequest) {
  try {
    const searchParams = request ? request.nextUrl.searchParams : new URLSearchParams();
    const period = parsePeriodParams(searchParams);
    const reportFilter = buildReportRelationFilter(period);

    // 1. Agregasi donasi per donatur terdaftar (hanya transaksi terverifikasi & pemasukan pada periode terpilih)
    const [donorsWithVerifiedTransactions, anonymousAgg, availableYears] =
      await Promise.all([
        prisma.donor.findMany({
          select: {
            id: true,
            name: true,
            transactions: {
              where: {
                isVerified: true,
                type: "pemasukan",
                ...(reportFilter ? { report: reportFilter } : {}),
              },
              select: {
                amount: true,
              },
            },
          },
        }),
        // 2. Agregasi donasi anonim (donorId = null, isVerified = true, type = "pemasukan" pada periode terpilih)
        prisma.transaction.aggregate({
          where: {
            isVerified: true,
            type: "pemasukan",
            donorId: null,
            ...(reportFilter ? { report: reportFilter } : {}),
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        // 3. Daftar tahun dinamis
        getAvailableYears(),
      ]);

    // Hitung total kontribusi & jumlah donasi per donatur pada periode terpilih
    const donors = donorsWithVerifiedTransactions
      .map((d) => {
        const total = d.transactions.reduce(
          (sum, t) => sum + Number(t.amount),
          0
        );
        return {
          id: d.id,
          name: d.name,
          totalContribution: total,
          donationCount: d.transactions.length,
        };
      })
      // Tampilkan donatur yang memiliki transaksi terverifikasi pada periode ini dan urutkan kontribusi terbesar
      .filter((d) => d.donationCount > 0)
      .sort(
        (a, b) =>
          b.totalContribution - a.totalContribution ||
          a.name.localeCompare(b.name)
      );

    const anonymous = {
      totalContribution: Number(anonymousAgg._sum.amount ?? 0),
      donationCount: anonymousAgg._count.id,
    };

    return NextResponse.json({
      success: true,
      data: {
        donors,
        anonymous,
        period: {
          year: period.year,
          month: period.month,
        },
        availableYears,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/donors:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat mengambil data donatur." },
      { status: 500 }
    );
  }
}
