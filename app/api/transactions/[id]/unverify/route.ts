import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/transactions/:id/unverify
// Mengembalikan transaksi dari status isVerified = true ke isVerified = false (Menunggu Verifikasi).
// Menyetel verifiedById = null dan verifiedAt = null.
// Transaksi tidak dihapus, melainkan dikembalikan ke status antrean verifikasi agar bisa dikoreksi/dihapus.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan." },
      { status: 404 }
    );
  }

  if (!transaction.isVerified) {
    return NextResponse.json(
      { error: "Transaksi ini belum diverifikasi." },
      { status: 400 }
    );
  }

  const unverified = await prisma.transaction.update({
    where: { id },
    data: {
      isVerified: false,
      verifiedById: null,
      verifiedAt: null,
    },
    include: {
      donor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    data: {
      id: unverified.id,
      isVerified: unverified.isVerified,
      verifiedById: null,
      verifiedAt: null,
      amount: unverified.amount,
      type: unverified.type,
      description: unverified.description,
      transactionDate: unverified.transactionDate,
      donorNameRaw: unverified.donorNameRaw,
      donorId: unverified.donorId,
      donor: unverified.donor
        ? { id: unverified.donor.id, name: unverified.donor.name }
        : null,
    },
    message: "Verifikasi transaksi berhasil dibatalkan.",
  });
}
