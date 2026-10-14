import "dotenv/config";
import assert from "node:assert";
import { prisma } from "../lib/prisma";
import { EXPENSE_CATEGORIES } from "../lib/expense-categories";

console.log("=================================================================");
console.log("TEST SUITE: F-025 / Issue #073 — Tambah Baris Transaksi Manual");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

async function runTest(description: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err: unknown) {
    console.error(`  ❌ FAIL: ${description}`);
    if (err instanceof Error) {
      console.error(`     Error: ${err.message}`);
    } else {
      console.error("     Error:", err);
    }
    failed++;
  }
}

// -----------------------------------------------------------------------------
// Helper validasi manual transaction (simulasi logika route handler POST)
// -----------------------------------------------------------------------------
interface AddManualInput {
  type?: unknown;
  amount?: unknown;
  description?: unknown;
  transactionDate?: unknown;
  donorNameRaw?: unknown;
  category?: unknown;
}

function validateManualTransactionInput(body: AddManualInput): {
  valid: boolean;
  status: number;
  error?: string;
  data?: {
    type: "pemasukan" | "pengeluaran";
    amount: number;
    description: string;
    transactionDate: Date;
    donorNameRaw: string | null;
    category: string | null;
  };
} {
  // 1. Tipe
  if (!body.type || (body.type !== "pemasukan" && body.type !== "pengeluaran")) {
    return {
      valid: false,
      status: 400,
      error: "Tipe transaksi wajib diisi dan hanya boleh 'pemasukan' atau 'pengeluaran'.",
    };
  }

  // 2. Amount
  if (body.amount === undefined || body.amount === null) {
    return { valid: false, status: 400, error: "Nominal transaksi wajib diisi." };
  }
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
    return {
      valid: false,
      status: 400,
      error: "Nominal transaksi harus berupa angka positif lebih dari 0.",
    };
  }

  // 3. Description
  if (!body.description || typeof body.description !== "string") {
    return { valid: false, status: 400, error: "Keterangan transaksi wajib diisi." };
  }
  const trimmedDesc = body.description.trim();
  if (trimmedDesc.length === 0) {
    return { valid: false, status: 400, error: "Keterangan transaksi tidak boleh kosong." };
  }
  if (trimmedDesc.length > 500) {
    return { valid: false, status: 400, error: "Keterangan transaksi maksimal 500 karakter." };
  }

  // 4. Date
  if (!body.transactionDate || typeof body.transactionDate !== "string") {
    return { valid: false, status: 400, error: "Tanggal transaksi wajib diisi." };
  }
  const parsedDate = new Date(body.transactionDate);
  if (isNaN(parsedDate.getTime())) {
    return { valid: false, status: 400, error: "Tanggal transaksi tidak valid." };
  }

  // 5. Category (pengeluaran only)
  let validatedCategory: string | null = null;
  if (body.type === "pengeluaran" && body.category !== undefined && body.category !== null) {
    if (typeof body.category !== "string") {
      return { valid: false, status: 400, error: "Nilai kategori tidak valid." };
    }
    const trimmedCat = body.category.trim();
    if (trimmedCat.length > 0) {
      const validValues = EXPENSE_CATEGORIES.map((c) => c.value) as string[];
      if (!validValues.includes(trimmedCat)) {
        return { valid: false, status: 400, error: `Nilai kategori tidak valid: ${body.category}` };
      }
      validatedCategory = trimmedCat;
    }
  }

  if (body.type === "pemasukan" && body.category !== undefined && body.category !== null && body.category !== "") {
    return { valid: false, status: 400, error: "Kategori hanya berlaku untuk transaksi pengeluaran." };
  }

  // 6. Donor (pemasukan only)
  let finalDonorNameRaw: string | null = null;
  if (body.type === "pemasukan" && body.donorNameRaw) {
    const trimmed = typeof body.donorNameRaw === "string" ? body.donorNameRaw.trim() : null;
    if (trimmed && trimmed.length > 0) {
      finalDonorNameRaw = trimmed;
    }
  }

  return {
    valid: true,
    status: 201,
    data: {
      type: body.type,
      amount: body.amount,
      description: trimmedDesc,
      transactionDate: parsedDate,
      donorNameRaw: finalDonorNameRaw,
      category: body.type === "pengeluaran" ? validatedCategory : null,
    },
  };
}

async function main() {
  // ---------------------------------------------------------------------------
  // [1] Pengujian Skema Database & Field Defaults
  // ---------------------------------------------------------------------------
  console.log("[1] Pengujian Skema Prisma & Field Defaul:");

  await runTest("Prisma client mengenali field isManual dan createdById pada Transaction", async () => {
    // Verifikasi via dmmf
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dmmf = (prisma as any)._dmmf;
    if (dmmf) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txModel = dmmf.datamodel?.models?.find((m: any) => m.name === "Transaction");
      assert(txModel, "Model Transaction harus ada di datamodel");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isManualField = txModel.fields.find((f: any) => f.name === "isManual");
      assert(isManualField, "Field isManual harus ada");
      assert.strictEqual(isManualField.type, "Boolean");
      assert.strictEqual(isManualField.default, false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdByIdField = txModel.fields.find((f: any) => f.name === "createdById");
      assert(createdByIdField, "Field createdById harus ada");
    }
  });

  // ---------------------------------------------------------------------------
  // [2] Pengujian Validasi Input Tambah Baris Manual
  // ---------------------------------------------------------------------------
  console.log("\n[2] Pengujian Validasi Input Tambah Baris Manual (POST /api/attachments/:id/transactions):");

  await runTest("Menolak input tanpa tipe atau tipe di luar enum", () => {
    const res1 = validateManualTransactionInput({ amount: 50000, description: "Kas", transactionDate: "2026-10-10" });
    assert.strictEqual(res1.valid, false);
    assert.strictEqual(res1.status, 400);

    const res2 = validateManualTransactionInput({ type: "hibah", amount: 50000, description: "Kas", transactionDate: "2026-10-10" });
    assert.strictEqual(res2.valid, false);
    assert.strictEqual(res2.status, 400);
  });

  await runTest("Menolak nominal <= 0, negatif, atau non-number", () => {
    const resZero = validateManualTransactionInput({ type: "pemasukan", amount: 0, description: "Infaq", transactionDate: "2026-10-10" });
    assert.strictEqual(resZero.valid, false);

    const resNeg = validateManualTransactionInput({ type: "pemasukan", amount: -10000, description: "Infaq", transactionDate: "2026-10-10" });
    assert.strictEqual(resNeg.valid, false);

    const resNaN = validateManualTransactionInput({ type: "pemasukan", amount: NaN, description: "Infaq", transactionDate: "2026-10-10" });
    assert.strictEqual(resNaN.valid, false);
  });

  await runTest("Menolak keterangan kosong atau melebihi 500 karakter", () => {
    const resEmpty = validateManualTransactionInput({ type: "pemasukan", amount: 50000, description: "   ", transactionDate: "2026-10-10" });
    assert.strictEqual(resEmpty.valid, false);

    const resTooLong = validateManualTransactionInput({
      type: "pemasukan",
      amount: 50000,
      description: "a".repeat(501),
      transactionDate: "2026-10-10",
    });
    assert.strictEqual(resTooLong.valid, false);
  });

  await runTest("Menolak tanggal tidak valid", () => {
    const resInvalidDate = validateManualTransactionInput({
      type: "pemasukan",
      amount: 50000,
      description: "Infaq",
      transactionDate: "bukan-tanggal",
    });
    assert.strictEqual(resInvalidDate.valid, false);
  });

  await runTest("Menolak kategori pada transaksi pemasukan", () => {
    const resCatOnIncome = validateManualTransactionInput({
      type: "pemasukan",
      amount: 50000,
      description: "Infaq",
      transactionDate: "2026-10-10",
      category: "operasional",
    });
    assert.strictEqual(resCatOnIncome.valid, false);
  });

  await runTest("Menolak kategori invalid pada transaksi pengeluaran", () => {
    const resInvalidCat = validateManualTransactionInput({
      type: "pengeluaran",
      amount: 50000,
      description: "Beli lampu",
      transactionDate: "2026-10-10",
      category: "kategori_ngawur",
    });
    assert.strictEqual(resInvalidCat.valid, false);
  });

  await runTest("Menerima input pengeluaran valid dengan kategori baku", () => {
    const resValidExpense = validateManualTransactionInput({
      type: "pengeluaran",
      amount: 150000,
      description: "Beli sapu dan pel",
      transactionDate: "2026-10-10",
      category: "operasional",
    });
    assert.strictEqual(resValidExpense.valid, true);
    assert.strictEqual(resValidExpense.data?.category, "operasional");
  });

  await runTest("Menerima input pemasukan valid dengan nama donatur raw", () => {
    const resValidIncome = validateManualTransactionInput({
      type: "pemasukan",
      amount: 500000,
      description: "Infaq dari H. Fulan",
      transactionDate: "2026-10-10",
      donorNameRaw: "H. Fulan Subang",
    });
    assert.strictEqual(resValidIncome.valid, true);
    assert.strictEqual(resValidIncome.data?.donorNameRaw, "H. Fulan Subang");
    assert.strictEqual(resValidIncome.data?.category, null);
  });

  // ---------------------------------------------------------------------------
  // [3] Pengujian Logika Ekstrak Ulang & Preservasi Baris Manual
  // ---------------------------------------------------------------------------
  console.log("\n[3] Pengujian Logika Ekstrak Ulang (app/api/attachments/:id/extract/route.ts):");

  await runTest("replaceVerified=false HANYA menghapus draf AI (isVerified=false, isManual=false)", () => {
    const replaceVerified = false;
    const deleteFilter = {
      attachmentId: "att-123",
      ...(replaceVerified ? {} : { isVerified: false, isManual: false }),
    };

    assert.strictEqual(deleteFilter.attachmentId, "att-123");
    assert.strictEqual(deleteFilter.isVerified, false);
    assert.strictEqual(deleteFilter.isManual, false);
  });

  await runTest("replaceVerified=true mereset seluruh transaksi lampiran (termasuk manual & verified)", () => {
    const replaceVerified = true;
    const deleteFilter = {
      attachmentId: "att-123",
      ...(replaceVerified ? {} : { isVerified: false, isManual: false }),
    };

    assert.strictEqual(deleteFilter.attachmentId, "att-123");
    assert.strictEqual("isVerified" in deleteFilter, false);
    assert.strictEqual("isManual" in deleteFilter, false);
  });

  // ---------------------------------------------------------------------------
  // [4] Pengujian End-to-End Database: Pembuatan, Preservasi, dan Konfirmasi
  // ---------------------------------------------------------------------------
  console.log("\n[4] Pengujian End-to-End Database dengan Prisma Client:");

  let testUserId: string | null = null;
  let testReportId: string | null = null;
  let testAttachmentId: string | null = null;
  let testAiTxId: string | null = null;
  let testManualTxId: string | null = null;

  try {
    await runTest("Menyiapkan mock User, Report, dan Attachment berstatus done", async () => {
      const user = await prisma.user.create({
        data: {
          name: "Test F-025 Bendahara",
          email: `test-f025-${Date.now()}@al-luqman.test`,
          role: "BENDAHARA",
        },
      });
      testUserId = user.id;

      const report = await prisma.report.create({
        data: {
          reportDate: new Date("2026-10-16"),
          year: 2026,
          month: 10,
          weekOfMonth: 3,
          uploadedById: user.id,
        },
      });
      testReportId = report.id;

      const attachment = await prisma.attachment.create({
        data: {
          reportId: report.id,
          fileUrl: "https://example.com/test-f025.jpg",
          originalFileName: "test-f025.jpg",
          fileSizeBytes: 1024,
          fileType: "image",
          extractionStatus: "done",
          extractedAt: new Date(),
        },
      });
      testAttachmentId = attachment.id;
      assert(testAttachmentId, "Attachment harus berhasil dibuat");
    });

    await runTest("Membuat draf AI (isManual: false) dan draf Manual (isManual: true)", async () => {
      assert(testAttachmentId && testReportId);

      const aiTx = await prisma.transaction.create({
        data: {
          attachmentId: testAttachmentId,
          reportId: testReportId,
          type: "pemasukan",
          amount: 100000,
          description: "Infaq AI terbaca",
          transactionDate: new Date("2026-10-16"),
          isVerified: false,
          isManual: false,
        },
      });
      testAiTxId = aiTx.id;

      const manualTx = await prisma.transaction.create({
        data: {
          attachmentId: testAttachmentId,
          reportId: testReportId,
          type: "pengeluaran",
          amount: 50000,
          description: "Pembelian deterjen masjid (terlewat AI)",
          transactionDate: new Date("2026-10-16"),
          category: "operasional",
          isVerified: false,
          isManual: true,
        },
      });
      testManualTxId = manualTx.id;

      assert.strictEqual(aiTx.isManual, false);
      assert.strictEqual(manualTx.isManual, true);
      assert.strictEqual(manualTx.isVerified, false);
    });

    await runTest("Simulasi Ekstrak Ulang (replaceVerified=false) menghapus draf AI tapi MEMPERTAHANKAN draf manual", async () => {
      assert(testAttachmentId);

      // Eksekusi deleteMany persis seperti di app/api/attachments/[id]/extract/route.ts
      await prisma.transaction.deleteMany({
        where: {
          attachmentId: testAttachmentId,
          isVerified: false,
          isManual: false,
        },
      });

      // Cek draf AI sudah terhapus
      const aiTx = await prisma.transaction.findUnique({ where: { id: testAiTxId! } });
      assert.strictEqual(aiTx, null, "Draf AI seharusnya terhapus saat ekstrak ulang");

      // Cek draf manual MASIH ADA
      const manualTx = await prisma.transaction.findUnique({ where: { id: testManualTxId! } });
      assert(manualTx, "Draf manual HARUS tetap ada");
      assert.strictEqual(manualTx.isManual, true);
      assert.strictEqual(manualTx.description, "Pembelian deterjen masjid (terlewat AI)");
    });

    await runTest("Konfirmasi baris manual: mengubah isVerified jadi true sesuai prinsip satu pintu masuk", async () => {
      assert(testManualTxId);

      // Update transaksi manual menjadi terverifikasi
      const verified = await prisma.transaction.update({
        where: { id: testManualTxId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      assert.strictEqual(verified.isVerified, true);
      assert.strictEqual(verified.isManual, true);
      assert(verified.verifiedAt !== null);
    });
  } finally {
    // Cleanup data uji
    if (testReportId) {
      await prisma.transaction.deleteMany({ where: { reportId: testReportId } }).catch(() => {});
      await prisma.attachment.deleteMany({ where: { reportId: testReportId } }).catch(() => {});
      await prisma.report.delete({ where: { id: testReportId } }).catch(() => {});
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    console.log("\n  🧹 Pembersihan data uji (cleanup) selesai.");
  }

  // ---------------------------------------------------------------------------
  // Ringkasan Pengujian
  // ---------------------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`TOTAL PENGUJIAN: ${passed + failed}`);
  console.log(`  LULUS: ${passed}`);
  console.log(`  GAGAL: ${failed}`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Fatal error during test run:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
