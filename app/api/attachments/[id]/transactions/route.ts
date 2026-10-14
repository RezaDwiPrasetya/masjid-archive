import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/auth-guard";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

const MAX_DESCRIPTION_LENGTH = 500;

// POST /api/attachments/:id/transactions
// F-025: Menambahkan baris transaksi manual pada attachment yang sudah selesai diekstrak.
// Hanya untuk staf (ADMIN/BENDAHARA). Baris ditandai isManual=true, isVerified=false (draf).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Autentikasi & otorisasi
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(session)) {
    return NextResponse.json(
      { error: "Forbidden: Hanya pengurus DKM (Admin atau Bendahara) yang dapat menambahkan transaksi manual" },
      { status: 403 }
    );
  }

  const { id: attachmentId } = await params;

  // 2. Validasi attachment exist & extractionStatus = 'done'
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    return NextResponse.json(
      { error: "Lampiran tidak ditemukan" },
      { status: 404 }
    );
  }

  if (attachment.extractionStatus !== "done") {
    return NextResponse.json(
      {
        error: `Baris manual hanya dapat ditambahkan pada lampiran yang sudah selesai diekstrak. Status saat ini: "${attachment.extractionStatus}".`,
      },
      { status: 409 }
    );
  }

  // 3. Parse & validasi body
  let body: {
    type?: string;
    amount?: number;
    description?: string;
    transactionDate?: string;
    donorNameRaw?: string | null;
    category?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body request harus berupa JSON valid." },
      { status: 400 }
    );
  }

  // type: wajib, enum
  if (!body.type || (body.type !== "pemasukan" && body.type !== "pengeluaran")) {
    return NextResponse.json(
      { error: "Tipe transaksi wajib diisi dan hanya boleh 'pemasukan' atau 'pengeluaran'." },
      { status: 400 }
    );
  }

  // amount: wajib, number finite > 0
  if (body.amount === undefined || body.amount === null) {
    return NextResponse.json(
      { error: "Nominal transaksi wajib diisi." },
      { status: 400 }
    );
  }
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    return NextResponse.json(
      { error: "Nominal transaksi harus berupa angka positif lebih dari 0." },
      { status: 400 }
    );
  }

  // description: wajib, string, trimmed, batas panjang
  if (!body.description || typeof body.description !== "string") {
    return NextResponse.json(
      { error: "Keterangan transaksi wajib diisi." },
      { status: 400 }
    );
  }
  const trimmedDesc = body.description.trim();
  if (trimmedDesc.length === 0) {
    return NextResponse.json(
      { error: "Keterangan transaksi tidak boleh kosong." },
      { status: 400 }
    );
  }
  if (trimmedDesc.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: `Keterangan transaksi maksimal ${MAX_DESCRIPTION_LENGTH} karakter.` },
      { status: 400 }
    );
  }

  // transactionDate: wajib, tanggal valid, diproses UTC konsisten dengan derive-period
  if (!body.transactionDate || typeof body.transactionDate !== "string") {
    return NextResponse.json(
      { error: "Tanggal transaksi wajib diisi." },
      { status: 400 }
    );
  }
  const parsedDate = new Date(body.transactionDate);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { error: "Tanggal transaksi tidak valid." },
      { status: 400 }
    );
  }

  // category: opsional, hanya untuk pengeluaran, harus ada di EXPENSE_CATEGORIES
  let validatedCategory: string | null = null;
  if (body.type === "pengeluaran" && body.category !== undefined && body.category !== null) {
    if (typeof body.category !== "string") {
      return NextResponse.json(
        { error: "Nilai kategori tidak valid." },
        { status: 400 }
      );
    }
    const trimmedCat = body.category.trim();
    if (trimmedCat.length > 0) {
      const validValues = EXPENSE_CATEGORIES.map((c) => c.value) as string[];
      if (!validValues.includes(trimmedCat)) {
        return NextResponse.json(
          { error: `Nilai kategori tidak valid: ${body.category}` },
          { status: 400 }
        );
      }
      validatedCategory = trimmedCat;
    }
  }

  // category pada pemasukan harus null
  if (body.type === "pemasukan" && body.category !== undefined && body.category !== null && body.category !== "") {
    return NextResponse.json(
      { error: "Kategori hanya berlaku untuk transaksi pengeluaran." },
      { status: 400 }
    );
  }

  // donorNameRaw: opsional, hanya untuk pemasukan
  let finalDonorNameRaw: string | null = null;
  if (body.type === "pemasukan" && body.donorNameRaw) {
    const trimmed = typeof body.donorNameRaw === "string" ? body.donorNameRaw.trim() : null;
    if (trimmed && trimmed.length > 0) {
      finalDonorNameRaw = trimmed;
    }
  }

  // 4. Simpan transaksi manual
  const transaction = await prisma.transaction.create({
    data: {
      attachmentId,
      reportId: attachment.reportId,
      type: body.type,
      amount: body.amount,
      description: trimmedDesc,
      transactionDate: parsedDate,
      donorNameRaw: finalDonorNameRaw,
      category: body.type === "pengeluaran" ? validatedCategory : null,
      isVerified: false,
      isManual: true,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(
    {
      data: {
        id: transaction.id,
        attachmentId: transaction.attachmentId,
        reportId: transaction.reportId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        transactionDate: transaction.transactionDate,
        donorNameRaw: transaction.donorNameRaw,
        category: transaction.category,
        isVerified: transaction.isVerified,
        isManual: transaction.isManual,
        createdById: transaction.createdById,
      },
    },
    { status: 201 }
  );
}
