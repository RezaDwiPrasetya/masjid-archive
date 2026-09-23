import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchAndAssignDonor } from "@/lib/donor-service";

// PATCH /api/transactions/:id/donor
// Mengedit nama donatur khusus pada baris transaksi yang SUDAH diverifikasi (isVerified = true) bertipe pemasukan.
// Field amount, type, description, transactionDate, isVerified, verifiedById, verifiedAt TETAP tidak dapat diubah.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      donor: { select: { id: true, name: true } },
    },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  // Pengecualian sempit: HANYA diizinkan jika isVerified = true DAN type = "pemasukan"
  if (!transaction.isVerified) {
    return NextResponse.json(
      {
        error:
          "Hanya transaksi yang sudah diverifikasi yang dapat diedit donaturnya melalui endpoint ini.",
      },
      { status: 400 }
    );
  }

  if (transaction.type !== "pemasukan") {
    return NextResponse.json(
      {
        error: "Hanya transaksi bertipe pemasukan yang dapat memiliki nama donatur.",
      },
      { status: 400 }
    );
  }

  let donorNameRaw: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body === "object" && "donorNameRaw" in body) {
      donorNameRaw =
        typeof body.donorNameRaw === "string" ? body.donorNameRaw : null;
    }
  } catch {
    // Jika body bukan JSON valid, donorNameRaw tetap null
  }

  // Jalankan ulang proses matching donatur menggunakan shared logic
  const { donorId, finalDonorNameRaw, matchingResult } =
    await matchAndAssignDonor(transaction.type, donorNameRaw);

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      donorId,
      donorNameRaw: finalDonorNameRaw,
    },
    include: {
      donor: { select: { id: true, name: true } },
      verifiedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      isVerified: updated.isVerified,
      type: updated.type,
      amount: updated.amount,
      donorId: updated.donorId,
      donorNameRaw: updated.donorNameRaw,
      donor: updated.donor
        ? { id: updated.donor.id, name: updated.donor.name }
        : null,
      matchingResult,
    },
  });
}
