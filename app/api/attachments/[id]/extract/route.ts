import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { extractTransactionsFromFile } from "@/lib/extract-transactions";
import { parseTransactionsFromExcel } from "@/lib/parse-excel-transactions";
import { isStaff } from "@/lib/auth-guard";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Validasi sesi & role
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(session)) {
    return NextResponse.json(
      { error: "Forbidden: Hanya pengurus DKM (Admin atau Bendahara) yang dapat menjalankan ekstraksi data" },
      { status: 403 }
    );
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

  if (
    attachment.fileType !== "image" &&
    attachment.fileType !== "pdf" &&
    attachment.fileType !== "excel"
  ) {
    return NextResponse.json(
      { error: "Ekstraksi atau impor data hanya didukung untuk lampiran Gambar, PDF, dan Excel." },
      { status: 400 }
    );
  }

  if (attachment.extractionStatus === "processing") {
    return NextResponse.json(
      { error: "Ekstraksi sedang berjalan untuk lampiran ini. Silakan tunggu." },
      { status: 409 }
    );
  }

  // Parse body opsional: { replaceVerified?: boolean }
  let replaceVerified = false;
  try {
    const text = await _request.text();
    if (text) {
      const json = JSON.parse(text);
      if (json && typeof json.replaceVerified === "boolean") {
        replaceVerified = json.replaceVerified;
      }
    }
  } catch {
    // Body kosong atau bukan JSON valid, gunakan default false
  }

  // 3. Tandai status processing sebelum memproses
  await prisma.attachment.update({
    where: { id },
    data: { extractionStatus: "processing" },
  });

  try {
    // 4. Ekstraksi atau impor data sesuai jenis file
    const { transactions, initialBalance, finalBalance, rawResponse, modelName } =
      attachment.fileType === "excel"
        ? await parseTransactionsFromExcel(attachment.fileUrl)
        : await extractTransactionsFromFile(attachment.fileUrl, attachment.fileType);

    // 5. Simpan hasil secara atomik dalam satu transaksi DB:
    //    - Hapus Transaction lama dari attachment ini (jika replaceVerified = true, hapus semua termasuk verified; jika false, hanya hapus unverified)
    //    - Insert Transaction baru hasil ekstraksi
    //    - Update status & saldo Attachment menjadi "done"
    await prisma.$transaction([
      prisma.transaction.deleteMany({
        where: {
          attachmentId: id,
          ...(replaceVerified ? {} : { isVerified: false }),
        },
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
          donorNameRaw:
            txn.type === "pemasukan" && txn.donorName
              ? txn.donorName.trim() || null
              : null,
          isVerified: false,
        })),
      }),
      // Update metadata attachment (status, model, rawResponse, dll)
      prisma.attachment.update({
        where: { id },
        data: {
          extractionStatus: "done",
          extractionModel: modelName,
          extractionRawResponse: rawResponse as Prisma.InputJsonValue,
          extractionError: null,
          extractedAt: new Date(),
        },
      }),
      // Simpan saldo ke Report induk (bukan Attachment) —
      // saldo kas mingguan adalah properti laporan, bukan file individual.
      // Hanya update jika Gemini berhasil membaca setidaknya satu saldo.
      ...(initialBalance !== null || finalBalance !== null
        ? [
            prisma.report.update({
              where: { id: attachment.reportId },
              data: {
                initialBalance:
                  initialBalance !== null && initialBalance !== undefined
                    ? initialBalance
                    : undefined,
                finalBalance:
                  finalBalance !== null && finalBalance !== undefined
                    ? finalBalance
                    : undefined,
              },
            }),
          ]
        : []),
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
