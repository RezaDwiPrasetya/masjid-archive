import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/transactions/:id/confirm
// Mengonfirmasi satu baris transaksi sebagai data resmi (isVerified = true)
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
    include: { verifiedBy: { select: { name: true } } },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  if (transaction.isVerified) {
    return NextResponse.json(
      { error: "Transaksi ini sudah dikonfirmasi sebelumnya." },
      { status: 409 }
    );
  }

  const confirmed = await prisma.transaction.update({
    where: { id },
    data: {
      isVerified: true,
      verifiedById: session.user.id,
      verifiedAt: new Date(),
    },
    include: { verifiedBy: { select: { name: true } } },
  });

  return NextResponse.json({
    data: {
      id: confirmed.id,
      isVerified: confirmed.isVerified,
      verifiedBy: confirmed.verifiedBy?.name ?? null,
      verifiedAt: confirmed.verifiedAt,
    },
  });
}
