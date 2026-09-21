import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/:id/transactions
// - Ada sesi (bendahara): tampilkan semua transaksi (verified & unverified) untuk keperluan review
// - Tanpa sesi (publik): hanya tampilkan transaksi yang isVerified = true
//   → transaksi draft/belum dikonfirmasi tidak bocor ke publik
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return NextResponse.json(
      { error: "Laporan tidak ditemukan" },
      { status: 404 }
    );
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      reportId: id,
      // Publik hanya boleh lihat transaksi yang sudah diverifikasi
      ...(session ? {} : { isVerified: true }),
    },
    include: {
      verifiedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [
      // Unverified muncul pertama agar mudah ditinjau (hanya relevan untuk sesi bendahara)
      { isVerified: "asc" },
      { transactionDate: "asc" },
    ],
  });

  return NextResponse.json({ data: transactions });
}

