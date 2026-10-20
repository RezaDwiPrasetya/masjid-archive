import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/auth-guard";

/**
 * DELETE /api/treasury/transfers/:id
 * F-033 (Issue #078): Menghapus catatan mutasi internal jika terjadi kekeliruan input
 *
 * Otorisasi: Khusus Staf DKM (ADMIN / BENDAHARA)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(session)) {
    return NextResponse.json(
      { error: "Forbidden: Hanya pengurus DKM (Admin atau Bendahara) yang berhak menghapus catatan mutasi internal" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const existing = await prisma.treasuryTransfer.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Catatan mutasi internal tidak ditemukan" }, { status: 404 });
  }

  await prisma.treasuryTransfer.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: "Catatan mutasi internal kas berhasil dihapus.",
  });
}
