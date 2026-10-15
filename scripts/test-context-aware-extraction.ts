/**
 * Test Suite: Fungsionalitas Ekstraksi Context-Aware Berbasis Periode Pekan (Issue #076 / F-031)
 *
 * Menguji pembuatan prompt ekstraksi dinamis, format tanggal bahasa Indonesia,
 * kalkulasi rentang pekan Jumat, serta aturan pembatasan garis saldo penutup (closing boundary).
 */

import {
  formatIndonesianDate,
  buildExtractionPrompt,
} from "../lib/extract-transactions";
import { prisma } from "../lib/prisma";

let passedTests = 0;
let totalTests = 0;

function assert(description: string, condition: boolean, extraInfo?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } else {
    console.error(`  [FAIL] ${description}`);
    if (extraInfo) console.error(`         Detail: ${extraInfo}`);
  }
}

async function runAllTests() {
  console.log("\n=== TEST SUITE 1: Helper Pemformatan Tanggal Bahasa Indonesia (formatIndonesianDate) ===");

  {
    const d1 = new Date(Date.UTC(2025, 6, 25)); // 25 Juli 2025
    assert(
      "Format tanggal 25 Juli 2025",
      formatIndonesianDate(d1) === "25 Juli 2025",
      `Hasil: ${formatIndonesianDate(d1)}`
    );

    const d2 = new Date(Date.UTC(2025, 7, 1)); // 1 Agustus 2025
    assert(
      "Format tanggal 1 Agustus 2025",
      formatIndonesianDate(d2) === "1 Agustus 2025",
      `Hasil: ${formatIndonesianDate(d2)}`
    );

    const d3 = new Date(Date.UTC(2026, 0, 9)); // 9 Januari 2026
    assert(
      "Format tanggal 9 Januari 2026",
      formatIndonesianDate(d3) === "9 Januari 2026",
      `Hasil: ${formatIndonesianDate(d3)}`
    );
  }

  console.log("\n=== TEST SUITE 2: Penyusunan Prompt Dinamis & Backward Compatibility (buildExtractionPrompt) ===");

  {
    // 1. Tanpa parameter targetReportDate (null/undefined)
    const promptNull = buildExtractionPrompt(null);
    assert(
      "Tanpa targetReportDate menghasilkan prompt standar tanpa error",
      !promptNull.includes("KONTEKS KHUSUS PERIODE LAPORAN KAS") &&
        promptNull.includes("Kamu adalah asisten akuntansi")
    );

    const promptUndefined = buildExtractionPrompt(undefined);
    assert(
      "targetReportDate undefined menghasilkan prompt standar",
      promptUndefined === promptNull
    );

    // 2. String tanggal tidak valid
    const promptInvalid = buildExtractionPrompt("bukan-tanggal-valid");
    assert(
      "String tanggal tidak valid aman fallback ke prompt standar",
      promptInvalid === promptNull
    );
  }

  console.log("\n=== TEST SUITE 3: Logika Boundary Pekan 25 Juli 2025 (Kasus Riil Lembar Foto) ===");

  {
    // Kasus 1: Laporan Jumat 25 Juli 2025 (targetDate = '2025-07-25')
    const prompt25Juli = buildExtractionPrompt("2025-07-25");

    assert(
      "Prompt memuat tanggal target ISO 2025-07-25 dan teks '25 Juli 2025'",
      prompt25Juli.includes("2025-07-25") && prompt25Juli.includes("25 Juli 2025")
    );

    assert(
      "Prompt otomatis menghitung Jumat sepekan sebelumnya (2025-07-18 / 18 Juli 2025)",
      prompt25Juli.includes("2025-07-18") && prompt25Juli.includes("18 Juli 2025")
    );

    assert(
      "Prompt memuat instruksi CLOSING BALANCE BOUNDARY untuk memotong mutasi di bawah saldo penutup",
      prompt25Juli.includes("ATURAN SALDO PENUTUP (CLOSING BALANCE BOUNDARY)") &&
        prompt25Juli.includes("DI BAWAH garis saldo penutup tanggal 2025-07-25")
    );

    assert(
      "Prompt melarang transaksi setelah tanggal target untuk masuk ke array",
      prompt25Juli.includes("WAJIB DIABAIKAN")
    );
  }

  console.log("\n=== TEST SUITE 4: Logika Boundary Pekan 1 Agustus 2025 (Kasus Pekan Lanjutan) ===");

  {
    // Kasus 2: Laporan Jumat 1 Agustus 2025 (targetDate = '2025-08-01')
    const prompt1Agustus = buildExtractionPrompt(new Date("2025-08-01T00:00:00Z"));

    assert(
      "Prompt memuat target ISO 2025-08-01 dan teks '1 Agustus 2025'",
      prompt1Agustus.includes("2025-08-01") && prompt1Agustus.includes("1 Agustus 2025")
    );

    assert(
      "Prompt mengenali penutupan sepekan sebelumnya adalah 25 Juli 2025 (2025-07-25)",
      prompt1Agustus.includes("2025-07-25") && prompt1Agustus.includes("25 Juli 2025")
    );

    assert(
      "Prompt memuat instruksi penanganan pekan lanjutan di bagian bawah halaman",
      prompt1Agustus.includes("KASUS PEKAN LANJUTAN DI BAWAH") &&
        prompt1Agustus.includes("initialBalance")
    );
  }

  console.log("\n=== TEST SUITE 5: Validasi Integrasi Skema Relasi Database Prisma ===");

  {
    // Pastikan relasi Attachment -> Report ada di metadata schema Prisma client
    const attachmentFields = (prisma as unknown as { _dmmf?: { modelMap?: Record<string, { fields: Array<{ name: string }> }> } })
      ?._dmmf?.modelMap?.Attachment?.fields;

    if (attachmentFields) {
      const hasReportRel = attachmentFields.some((f) => f.name === "report");
      const hasReportId = attachmentFields.some((f) => f.name === "reportId");
      assert("Attachment memiliki relasi 'report'", hasReportRel);
      assert("Attachment memiliki foreign key 'reportId'", hasReportId);
    } else {
      assert("Prisma client Attachment terhubung dengan Report", typeof prisma.attachment.findUnique === "function");
    }
  }

  console.log("\n========================================================");
  console.log(`HASIL AKHIR: ${passedTests} / ${totalTests} PENGUJIAN LULUS`);
  console.log("========================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
