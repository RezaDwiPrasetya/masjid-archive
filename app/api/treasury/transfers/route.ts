import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/auth-guard";

/**
 * POST /api/treasury/transfers
 * F-033 (Issue #078): Mencatat mutasi internal kas masjid (mis. setor uang tunai ke bank atau tarik tunai dari bank).
 * Mutasi internal tidak mengubah total kekayaan kas masjid, melainkan memindahkan saldo antara brankas dan rekening bank.
 *
 * Otorisasi: Khusus Staf DKM (ADMIN / BENDAHARA)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(session)) {
    return NextResponse.json(
      { error: "Forbidden: Hanya pengurus DKM (Admin atau Bendahara) yang berhak mencatat mutasi kas internal" },
      { status: 403 }
    );
  }

  let body: {
    fromAccount?: string;
    toAccount?: string;
    amount?: number;
    transferDate?: string;
    description?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request harus berupa JSON valid." }, { status: 400 });
  }

  const from = body.fromAccount?.trim().toUpperCase();
  const to = body.toAccount?.trim().toUpperCase();

  if (from !== "TUNAI" && from !== "BANK") {
    return NextResponse.json(
      { error: "Akun asal (fromAccount) harus 'TUNAI' atau 'BANK'." },
      { status: 400 }
    );
  }

  if (to !== "TUNAI" && to !== "BANK") {
    return NextResponse.json(
      { error: "Akun tujuan (toAccount) harus 'TUNAI' atau 'BANK'." },
      { status: 400 }
    );
  }

  if (from === to) {
    return NextResponse.json(
      { error: "Akun asal dan akun tujuan tidak boleh sama." },
      { status: 400 }
    );
  }

  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    return NextResponse.json(
      { error: "Nominal mutasi harus berupa angka positif lebih dari 0." },
      { status: 400 }
    );
  }

  let parsedDate = new Date();
  if (body.transferDate) {
    const d = new Date(body.transferDate);
    if (!isNaN(d.getTime())) {
      parsedDate = d;
    }
  }

  const desc = body.description ? body.description.trim().slice(0, 500) : null;

  const transfer = await prisma.treasuryTransfer.create({
    data: {
      fromAccount: from,
      toAccount: to,
      amount: body.amount,
      transferDate: parsedDate,
      description: desc,
      createdById: session.user.id,
    },
    select: {
      id: true,
      fromAccount: true,
      toAccount: true,
      amount: true,
      transferDate: true,
      description: true,
      createdAt: true,
      createdBy: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: `Mutasi kas internal dari ${from} ke ${to} senilai Rp ${body.amount.toLocaleString("id-ID")} berhasil dicatat.`,
      data: {
        ...transfer,
        amount: Number(transfer.amount),
      },
    },
    { status: 201 }
  );
}
