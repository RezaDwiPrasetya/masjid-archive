import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { extractTransactionsFromImage } from "@/lib/extract-transactions";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Validasi sesi
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // 2. Ambil attachment dan validasi
  const attachment = await prisma.attachment.findUnique({ where: { id } });

  if (!attachment) {
    return NextResponse.json(
      { error: "Lampiran tidak ditemukan" },
      { status: 404 }
    );
  }

  if (attachment.fileType !== "image") {
    return NextResponse.json(
      { error: "Ekstraksi hanya didukung untuk lampiran bertipe gambar." },
      { status: 400 }
    );
  }

  if (attachment.extractionStatus === "processing") {
    return NextResponse.json(
      { error: "Ekstraksi sedang berjalan untuk lampiran ini. Silakan tunggu." },
      { status: 409 }
    );
  }

  // 3. Tandai status processing sebelum memanggil API eksternal
  await prisma.attachment.update({
    where: { id },
    data: { extractionStatus: "processing" },
  });

  try {
    // 4. Kirim gambar ke Gemini dan dapatkan hasil ekstraksi
    const { transactions, initialBalance, finalBalance, rawResponse, modelName } =
      await extractTransactionsFromImage(attachment.fileUrl);

    // 5. Simpan hasil secara atomik dalam satu transaksi DB:
    //    - Hapus Transaction lama (unverified) dari attachment ini
    //    - Insert Transaction baru hasil ekstraksi
    //    - Update status & saldo Attachment menjadi "done"
    await prisma.$transaction([
      // Sesuai aturan eksplisit 13-Data-Model.md:
      // Hanya hapus transaksi yang belum diverifikasi (isVerified = false).
      // Transaksi yang sudah isVerified = true TIDAK BOLEH terhapus otomatis oleh proses re-extract.
      prisma.transaction.deleteMany({
        where: { attachmentId: id, isVerified: false },
      }),
      // Insert baris transaksi baru dari hasil ekstraksi
      prisma.transaction.createMany({
        data: transactions.map((txn) => ({
          attachmentId: id,
          reportId: attachment.reportId,
          type: txn.type,
          amount: txn.amount,
          description: txn.description,
          transactionDate: txn.transactionDate
            ? new Date(txn.transactionDate)
            : null,
          isVerified: false,
        })),
      }),
      // Update metadata attachment & saldo tertera di buku
      prisma.attachment.update({
        where: { id },
        data: {
          extractionStatus: "done",
          extractionModel: modelName,
          extractionRawResponse: rawResponse as Prisma.InputJsonValue,
          extractionError: null,
          extractedAt: new Date(),
          initialBalance:
            initialBalance !== null && initialBalance !== undefined
              ? initialBalance
              : null,
          finalBalance:
            finalBalance !== null && finalBalance !== undefined
              ? finalBalance
              : null,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        attachmentId: id,
        extractionStatus: "done",
        transactionsCreated: transactions.length,
        initialBalance,
        finalBalance,
      },
    });
  } catch (err) {
    // Bedakan antara error koneksi Gemini API (502) vs error parsing/isi foto
    // Keduanya dicatat sebagai "failed" di DB, tapi error koneksi dikembalikan
    // sebagai 502 ke client (request tidak diproses penuh oleh server kita)
    const isNetworkError =
      err instanceof TypeError && err.message.includes("fetch");

    const errorMessage =
      err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui";

    // Pesan ramah pengguna — berbeda dari pesan teknis di log
    const friendlyError = isNetworkError
      ? "Tidak bisa terhubung ke layanan AI. Periksa koneksi internet dan coba lagi."
      : "Ekstraksi gagal. Pastikan foto cukup jelas dan coba lagi.";

    console.error("[Extract] Error:", errorMessage);

    // Update attachment ke status "failed"
    await prisma.attachment.update({
      where: { id },
      data: {
        extractionStatus: "failed",
        extractionError: friendlyError,
        extractedAt: new Date(),
      },
    });

    // Koneksi Gemini sama sekali gagal → 502
    if (isNetworkError) {
      return NextResponse.json(
        { error: friendlyError },
        { status: 502 }
      );
    }

    // Gagal parsing/isi foto → tetap 200 dengan extractionStatus: "failed"
    // karena request kita berhasil diproses, hanya hasilnya tidak memuaskan
    return NextResponse.json({
      data: {
        attachmentId: id,
        extractionStatus: "failed",
        extractionError: friendlyError,
      },
    });
  }
}
