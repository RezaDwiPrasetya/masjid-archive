import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  };

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
