import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import { isStaff } from "@/lib/auth-guard";

/**
 * PATCH /api/transactions/:id/category
 * Mengubah kategori pengeluaran pada transaksi (V7 — F-023)
 *
 * Aturan Bisnis:
 * - Memerlukan sesi staf aktif (bendahara/admin)
 * - Hanya bisa digunakan pada transaksi bertipe "pengeluaran"
 * - Mengubah field category saja — isVerified, amount, dan field lain TIDAK berubah
 * - Nilai kategori yang valid: "operasional" | "honor" | "sosial" | "pembangunan" |
 *   "konsumsi" | "administrasi" | "lainnya" | null (null = hapus kategori)
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
      { error: "Forbidden: Hanya pengurus DKM (Admin atau Bendahara) yang dapat mengubah kategori pengeluaran" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    select: { id: true, type: true, isVerified: true, category: true },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  if (transaction.type !== "pengeluaran") {
    return NextResponse.json(
      {
        error:
          "Kategori hanya dapat diatur pada transaksi bertipe pengeluaran.",
      },
      { status: 400 }
    );
  }

  // Parse body
  let category: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body === "object" && "category" in body) {
      const raw = body.category;
      if (raw === null || raw === undefined || raw === "") {
        category = null;
      } else if (typeof raw === "string") {
        const validValues = EXPENSE_CATEGORIES.map((c) => c.value) as string[];
        if (!validValues.includes(raw)) {
          return NextResponse.json(
            { error: `Nilai kategori tidak valid: ${raw}` },
            { status: 400 }
          );
        }
        category = raw;
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid" },
      { status: 400 }
    );
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: { category },
    select: {
      id: true,
      type: true,
      amount: true,
      category: true,
      isVerified: true,
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      type: updated.type,
      amount: Number(updated.amount),
      category: updated.category,
      isVerified: updated.isVerified,
    },
  });
}
