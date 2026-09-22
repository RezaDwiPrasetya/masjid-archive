import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/donors/:id
// Riwayat transaksi terverifikasi milik satu donatur tertentu (F-015)
// Akses publik — TANPA sesi NextAuth, tapi WAJIB memfilter isVerified: true
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const donor = await prisma.donor.findUnique({
      where: { id },
      include: {
        transactions: {
          where: {
            isVerified: true,
            type: "pemasukan",
          },
          include: {
            report: {
              select: {
                reportDate: true,
              },
            },
          },
          orderBy: [
            { transactionDate: "desc" },
            { id: "desc" },
          ],
        },
      },
    });

    if (!donor) {
      return NextResponse.json(
        { error: "Donatur tidak ditemukan" },
        { status: 404 }
      );
    }

    const totalContribution = donor.transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    const history = donor.transactions.map((t) => {
      // Gunakan transactionDate jika ada, fallback ke reportDate
      const rawDate = t.transactionDate ?? t.report.reportDate;
      const formattedDate = rawDate
        ? rawDate.toISOString().split("T")[0]
        : null;

      return {
        transactionId: t.id,
        amount: Number(t.amount),
        transactionDate: formattedDate,
        reportId: t.reportId,
      };
    });

    return NextResponse.json({
      data: {
        donor: {
          id: donor.id,
          name: donor.name,
          totalContribution,
        },
        history,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/donors/:id:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat mengambil detail donatur." },
      { status: 500 }
    );
  }
}
