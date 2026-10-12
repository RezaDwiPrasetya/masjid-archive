import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/auth-guard";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

// PATCH /api/transactions/:id
// Edit field transaksi sebelum dikonfirmasi (hanya jika isVerified = false)
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
      { error: "Forbidden: Hanya pengurus DKM (Admin atau Bendahara) yang dapat mengedit transaksi" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  if (transaction.isVerified) {
    return NextResponse.json(
      {
        error:
          "Transaksi sudah diverifikasi dan tidak bisa diubah lewat alur ini.",
      },
      { status: 409 }
    );
  }

  const body = (await request.json()) as {
    type?: string;
    amount?: number;
    description?: string;
    transactionDate?: string | null;
    donorNameRaw?: string | null;
    category?: string | null;
  };

  // Validasi amount: harus number finite dan > 0
  if (body.amount !== undefined) {
    if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
      return NextResponse.json(
        { error: "Nominal transaksi harus berupa angka positif lebih dari 0." },
        { status: 400 }
      );
    }
  }

  // Validasi type: hanya "pemasukan" atau "pengeluaran"
  if (body.type !== undefined) {
    if (body.type !== "pemasukan" && body.type !== "pengeluaran") {
      return NextResponse.json(
        { error: "Tipe transaksi hanya boleh 'pemasukan' atau 'pengeluaran'." },
        { status: 400 }
      );
    }
  }

  // Validasi category: harus ada di EXPENSE_CATEGORIES jika disediakan
  let validatedCategory: string | null | undefined = undefined;
  if (body.category !== undefined) {
    if (body.category === null || body.category === "") {
      validatedCategory = null;
    } else if (typeof body.category === "string") {
      const trimmedCategory = body.category.trim();
      if (trimmedCategory === "") {
        validatedCategory = null;
      } else {
        const validValues = EXPENSE_CATEGORIES.map((c) => c.value) as string[];
        if (!validValues.includes(trimmedCategory)) {
          return NextResponse.json(
            { error: `Nilai kategori tidak valid: ${body.category}` },
            { status: 400 }
          );
        }
        validatedCategory = trimmedCategory;
      }
    } else {
      return NextResponse.json(
        { error: "Nilai kategori tidak valid." },
        { status: 400 }
      );
    }
  }

  // Hanya izinkan field yang ada di spec — tidak ada mass-assignment
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(body.type !== undefined && { type: body.type }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.transactionDate !== undefined && {
        transactionDate: body.transactionDate
          ? new Date(body.transactionDate)
          : null,
      }),
      ...(body.donorNameRaw !== undefined && {
        donorNameRaw: body.donorNameRaw ? body.donorNameRaw.trim() : null,
      }),
      ...(validatedCategory !== undefined && {
        category: validatedCategory,
      }),
    },
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      type: updated.type,
      amount: updated.amount,
      description: updated.description,
      transactionDate: updated.transactionDate,
      donorNameRaw: updated.donorNameRaw,
      category: updated.category,
    },
  });
}

// DELETE /api/transactions/:id
// Hapus baris transaksi yang tidak valid (hanya jika isVerified = false)
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
      { error: "Forbidden: Hanya pengurus DKM (Admin atau Bendahara) yang dapat menghapus transaksi" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 }
    );
  }

  // Transaksi terverifikasi tidak bisa dihapus lewat alur normal — F-012
  if (transaction.isVerified) {
    return NextResponse.json(
      {
        error:
          "Transaksi yang sudah diverifikasi tidak dapat dihapus lewat alur ini.",
      },
      { status: 403 }
    );
  }

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ data: { id, deleted: true } });
}
