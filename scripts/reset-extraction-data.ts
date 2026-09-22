import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import * as readline from "readline";

const prisma = new PrismaClient();

function askConfirmation(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function main() {
  console.log("\n==================================================");
  console.log("  SCRIPT RESET DATA EKSTRAKSI LAMA (ONE-TIME)     ");
  console.log("==================================================\n");
  console.log("Memeriksa database saat ini...\n");

  // 1. Hitung jumlah data transaksi
  const txTotal = await prisma.transaction.count();
  const txVerified = await prisma.transaction.count({ where: { isVerified: true } });
  const txUnverified = await prisma.transaction.count({ where: { isVerified: false } });

  // 2. Hitung jumlah attachment yang telah diekstrak atau pernah diproses
  const attTotal = await prisma.attachment.count();
  const attExtracted = await prisma.attachment.count({
    where: {
      OR: [
        { extractionStatus: { not: "not_extracted" } },
        { extractionModel: { not: null } },
        { extractedAt: { not: null } },
      ],
    },
  });

  // 3. Hitung jumlah report yang memiliki data saldo
  const reportTotal = await prisma.report.count();
  const reportWithBalance = await prisma.report.count({
    where: {
      OR: [
        { initialBalance: { not: null } },
        { finalBalance: { not: null } },
      ],
    },
  });

  // Tampilkan ringkasan COUNT kepada pengguna
  console.log("┌─────────────────────────────────────────────────────────────────┐");
  console.log("│                    RINGKASAN DATA TERDAMPAK                     │");
  console.log("├─────────────────────────────────────────────────────────────────┤");
  console.log(`│ 1. Tabel Transaction (AKAN DIHAPUS TOTAL):                      │`);
  console.log(`│    • Total Transaksi   : ${txTotal.toString().padEnd(38)} │`);
  console.log(`│      - Terverifikasi   : ${txVerified.toString().padEnd(38)} │`);
  console.log(`│      - Belum Verifikasi: ${txUnverified.toString().padEnd(38)} │`);
  console.log(`│                                                                 │`);
  console.log(`│ 2. Tabel Attachment (AKAN DI-RESET KE 'not_extracted'):         │`);
  console.log(`│    • Total Attachment  : ${attTotal.toString().padEnd(38)} │`);
  console.log(`│    • Attachment Aktif  : ${attExtracted.toString().padEnd(38)} │`);
  console.log(`│                                                                 │`);
  console.log(`│ 3. Tabel Report (SALDO AKAN DI-RESET JADI NULL):                │`);
  console.log(`│    • Total Laporan     : ${reportTotal.toString().padEnd(38)} │`);
  console.log(`│    • Laporan Bersaldo  : ${reportWithBalance.toString().padEnd(38)} │`);
  console.log("└─────────────────────────────────────────────────────────────────┘");
  console.log("\nCATATAN KEAMANAN:");
  console.log("• File foto/PDF fisik di Supabase Storage TIDAK AKAN DIHAPUS.");
  console.log("• Data akun pengguna (User) & akun pengurus tetap aman.");
  console.log("• Laporan fisik (Report & Attachment record) tetap ada, hanya status ekstraksinya yang kembali ke awal.");

  if (txTotal === 0 && attExtracted === 0 && reportWithBalance === 0) {
    console.log("\n[INFO] Database sudah bersih dari data ekstraksi. Tidak ada perubahan yang perlu dilakukan.\n");
    return;
  }

  console.log("");
  const input = await askConfirmation("Ketik 'RESET' (huruf besar) untuk melanjutkan eksekusi: ");

  if (input.trim() !== "RESET") {
    console.log("\n[DIBATALKAN] Konfirmasi tidak sesuai ('RESET'). Tidak ada data yang diubah.\n");
    return;
  }

  console.log("\nMengeksekusi reset database dalam transaksi atomik...");

  const result = await prisma.$transaction(async (tx) => {
    // 1. Hapus semua baris di tabel Transaction
    const deletedTransactions = await tx.transaction.deleteMany({});

    // 2. Reset semua data ekstraksi pada Attachment
    const updatedAttachments = await tx.attachment.updateMany({
      data: {
        extractionStatus: "not_extracted",
        extractionModel: null,
        extractionRawResponse: Prisma.DbNull,
        extractionError: null,
        extractedAt: null,
      },
    });

    // 3. Reset saldo pada Report
    const updatedReports = await tx.report.updateMany({
      data: {
        initialBalance: null,
        finalBalance: null,
      },
    });

    return {
      deletedTransactionsCount: deletedTransactions.count,
      updatedAttachmentsCount: updatedAttachments.count,
      updatedReportsCount: updatedReports.count,
    };
  });

  console.log("\n==================================================");
  console.log("  EKSEKUSI SELESAI DENGAN SUKSES!                 ");
  console.log("==================================================");
  console.log(`✓ Transaksi dihapus : ${result.deletedTransactionsCount} baris`);
  console.log(`✓ Lampiran di-reset : ${result.updatedAttachmentsCount} baris`);
  console.log(`✓ Laporan di-reset  : ${result.updatedReportsCount} baris`);
  console.log("\nDatabase kini siap untuk integrasi V5 (skema donatur baru & re-ekstraksi).\n");
}

main()
  .catch((err) => {
    console.error("\n[ERROR] Gagal mengeksekusi reset:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
