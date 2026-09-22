import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/donors
// Daftar seluruh donatur beserta total kontribusi terverifikasi & agregat anonim (F-015)
// Akses publik — TANPA sesi NextAuth, tapi WAJIB memfilter isVerified: true
export async function GET() {
  try {
    // 1. Agregasi donasi per donatur terdaftar (hanya transaksi terverifikasi & pemasukan)
    const donorsWithVerifiedTransactions = await prisma.donor.findMany({
      select: {
        id: true,
        name: true,
        transactions: {
          where: {
            isVerified: true,
            type: "pemasukan",
          },
          select: {
            amount: true,
          },
        },
      },
    });

    // Hitung total kontribusi & jumlah donasi per donatur
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
      // Tampilkan donatur yang memiliki transaksi terverifikasi dan urutkan kontribusi terbesar, lalu nama alfabetis
      .filter((d) => d.donationCount > 0)
      .sort(
        (a, b) =>
          b.totalContribution - a.totalContribution ||
          a.name.localeCompare(b.name)
      );

    // 2. Agregasi donasi anonim (donorId = null, isVerified = true, type = "pemasukan")
    const anonymousAgg = await prisma.transaction.aggregate({
      where: {
        isVerified: true,
        type: "pemasukan",
        donorId: null,
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const anonymous = {
      totalContribution: Number(anonymousAgg._sum.amount ?? 0),
      donationCount: anonymousAgg._count.id,
    };

    return NextResponse.json({
      data: {
        donors,
        anonymous,
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
