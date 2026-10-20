import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/auth-guard";

/**
 * PATCH /api/transactions/:id/payment-method
 * F-033 (Issue #078): Mengubah kanal kas transaksi ("TUNAI" atau "BANK")
 *
 * Aturan Bisnis:
 * - Memerlukan sesi staf aktif (ADMIN / BENDAHARA)
 * - Hanya menerima nilai "TUNAI" (kas fisik/brankas/tromol) atau "BANK" (rekening bank/QRIS)
 * - Berlaku untuk transaksi draf maupun yang sudah terverifikasi (agar bendahara bisa merevisi kanal kas sewaktu-waktu)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(session)) {
    return NextResponse.json(
      { error: "Forbidden: Hanya staf (Admin atau Bendahara) yang berhak mengubah kanal kas transaksi" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    select: { id: true, paymentMethod: true, isVerified: true, type: true, amount: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  let body: { paymentMethod?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format request body tidak valid (harus JSON)" }, { status: 400 });
  }

  const rawMethod = body.paymentMethod?.trim().toUpperCase();
  if (rawMethod !== "TUNAI" && rawMethod !== "BANK") {
    return NextResponse.json(
      { error: "Kanal kas tidak valid. Gunakan 'TUNAI' (kas fisik) atau 'BANK' (rekening/QRIS)." },
      { status: 400 }
    );
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: { paymentMethod: rawMethod },
    select: {
      id: true,
      paymentMethod: true,
      type: true,
      amount: true,
      description: true,
      transactionDate: true,
      isVerified: true,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Kanal kas berhasil diubah ke ${rawMethod === "TUNAI" ? "Kas Fisik (Tunai)" : "Rekening Bank / QRIS"}.`,
    transaction: updated,
  });
}
