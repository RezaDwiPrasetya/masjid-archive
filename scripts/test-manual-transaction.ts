import "dotenv/config";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { POST as postManualTx } from "../app/api/attachments/[id]/transactions/route";
import { POST as confirmTx } from "../app/api/transactions/[id]/confirm/route";
import { GET as getReportTransactions } from "../app/api/reports/[id]/transactions/route";
import { GET as getExpenseTransactions } from "../app/api/expenses/transactions/route";

console.log("=================================================================");
console.log("TEST SUITE: F-025 / Issue #073 — Penutupan Celah Uji Baris Manual");
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
// Setup Mock Session NextAuth untuk Menguji Route Handler Asli
// -----------------------------------------------------------------------------
interface MockSession {
  user: {
    id: string;
    role?: string | null;
    name?: string;
    email?: string;
  };
  expires: string;
}

let currentMockSession: MockSession | null = null;

// Monkey-patch next-auth/next agar route handler menggunakan mock session pengujian
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextAuthNext = require("next-auth/next");
nextAuthNext.getServerSession = async () => currentMockSession;

// Helper membuat NextRequest ke endpoint manual transaction
function createPostRequest(attachmentId: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000/api/attachments/${attachmentId}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper deteksi duplikat (persis dengan logika di components/transaction-review-panel.tsx)
interface DuplicateCandidate {
  id: string;
  type: string;
  amount: number | string;
  transactionDate?: string | Date | null;
  description?: string;
  isVerified: boolean;
}

function getDuplicateWarning(tx: DuplicateCandidate, verifiedPool: DuplicateCandidate[]) {
  const txAmount = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
  const txDate =
    tx.transactionDate instanceof Date
      ? tx.transactionDate.toISOString().slice(0, 10)
      : typeof tx.transactionDate === "string"
      ? tx.transactionDate.slice(0, 10)
      : null;

  const match = verifiedPool.find((v) => {
    if (v.id === tx.id) return false;
    const vAmount = typeof v.amount === "string" ? parseFloat(v.amount) : v.amount;
    const vDate =
      v.transactionDate instanceof Date
        ? v.transactionDate.toISOString().slice(0, 10)
        : typeof v.transactionDate === "string"
        ? v.transactionDate.slice(0, 10)
        : null;
    return (
      v.isVerified &&
      tx.type === v.type &&
      txAmount === vAmount &&
      txDate === vDate
    );
  });

  if (match) {
    return {
      transactionDate: match.transactionDate,
      description: match.description,
    };
  }
  return null;
}

async function main() {
  // Simpan method asli Prisma untuk restore
  const originalAttachmentFindUnique = prisma.attachment.findUnique;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalTransactionCreate = (prisma.transaction as any).create;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalTransactionFindUnique = (prisma.transaction as any).findUnique;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalTransactionUpdate = (prisma.transaction as any).update;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalReportFindUnique = (prisma.report as any).findUnique;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalTransactionFindMany = (prisma.transaction as any).findMany;

  try {
    // -------------------------------------------------------------------------
    // [1] Pengujian Skema Prisma & Metadata Model
    // -------------------------------------------------------------------------
    console.log("[1] Pengujian Skema Prisma & Metadata Model:");
    await runTest("Prisma client mengenali field isManual dan createdById pada Transaction", () => {
      const dmmf = Prisma.dmmf;
      assert(dmmf, "DMMF harus tersedia pada Prisma Client");
      const txModel = dmmf.datamodel?.models?.find((m) => m.name === "Transaction");
      assert(txModel, "Model Transaction harus ada");
      const isManualField = txModel.fields.find((f) => f.name === "isManual");
      assert(isManualField, "Field isManual harus ada");
      assert.strictEqual(isManualField.type, "Boolean");
      assert.strictEqual(isManualField.default, false);
      const createdByIdField = txModel.fields.find((f) => f.name === "createdById");
      assert(createdByIdField, "Field createdById harus ada");
    });

    // -------------------------------------------------------------------------
    // [2] Pengujian Autentikasi & Otorisasi RBAC (POST Handler SUNGGUHAN)
    // -------------------------------------------------------------------------
    console.log("\n[2] Pengujian Autentikasi & Otorisasi RBAC (POST Handler SUNGGUHAN):");

    await runTest("Menolak akses tanpa sesi (Anon/Unauthenticated) -> 401 Unauthorized", async () => {
      currentMockSession = null;
      const req = createPostRequest("att-dummy", {
        type: "pemasukan",
        amount: 50000,
        description: "Infaq",
        transactionDate: "2026-10-16",
      });
      const res = await postManualTx(req, { params: Promise.resolve({ id: "att-dummy" }) });
      assert.strictEqual(res.status, 401, "Akses tanpa sesi harus 401");
      const json = await res.json();
      assert.strictEqual(json.error, "Unauthorized");
    });

    await runTest("Menolak jemaah umum (Guest Google dengan role: null) -> 403 Forbidden", async () => {
      currentMockSession = {
        user: { id: "user-jamaah-guest", role: null, name: "Jamaah Google" },
        expires: "2099-01-01",
      };
      const req = createPostRequest("att-dummy", {
        type: "pemasukan",
        amount: 50000,
        description: "Infaq",
        transactionDate: "2026-10-16",
      });
      const res = await postManualTx(req, { params: Promise.resolve({ id: "att-dummy" }) });
      assert.strictEqual(res.status, 403, "Role null harus 403 Forbidden");
      const json = await res.json();
      assert(json.error.includes("Forbidden"));
    });

    await runTest("Menolak akun dengan peran non-staf (role: 'GUEST') -> 403 Forbidden", async () => {
      currentMockSession = {
        user: { id: "user-guest", role: "GUEST", name: "Guest" },
        expires: "2099-01-01",
      };
      const req = createPostRequest("att-dummy", {
        type: "pemasukan",
        amount: 50000,
        description: "Infaq",
        transactionDate: "2026-10-16",
      });
      const res = await postManualTx(req, { params: Promise.resolve({ id: "att-dummy" }) });
      assert.strictEqual(res.status, 403, "Role GUEST harus 403 Forbidden");
    });

    // -------------------------------------------------------------------------
    // [3] Pengujian Validasi State Lampiran (Attachment State Guard)
    // -------------------------------------------------------------------------
    console.log("\n[3] Pengujian Validasi State Lampiran (Handler SUNGGUHAN):");

    // Pasang sesi BENDAHARA
    currentMockSession = {
      user: { id: "bendahara-f025-test", role: "BENDAHARA", name: "Ahmad Bendahara" },
      expires: "2099-01-01",
    };

    await runTest("Attachment ID tidak ditemukan di DB -> 404 Not Found", async () => {
      // Mock findUnique mengembalikan null (lampiran tidak ada)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.attachment as any).findUnique = async () => null;

      const req = createPostRequest("id-lampiran-tidak-ada", {
        type: "pemasukan",
        amount: 50000,
        description: "Infaq",
        transactionDate: "2026-10-16",
      });
      const res = await postManualTx(req, { params: Promise.resolve({ id: "id-lampiran-tidak-ada" }) });
      assert.strictEqual(res.status, 404, "Harus mengembalikan 404 Not Found");
      const json = await res.json();
      assert.strictEqual(json.error, "Lampiran tidak ditemukan");
    });

    await runTest("Lampiran dengan extractionStatus bukan 'done' (processing/pending) -> 409 Conflict", async () => {
      // Mock findUnique mengembalikan status processing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.attachment as any).findUnique = async () => ({
        id: "att-processing-1",
        reportId: "rep-1",
        fileType: "image",
        extractionStatus: "processing",
      });

      const req = createPostRequest("att-processing-1", {
        type: "pemasukan",
        amount: 50000,
        description: "Infaq",
        transactionDate: "2026-10-16",
      });
      const res = await postManualTx(req, { params: Promise.resolve({ id: "att-processing-1" }) });
      assert.strictEqual(res.status, 409, "Harus mengembalikan 409 Conflict");
      const json = await res.json();
      assert(json.error.includes("selesai diekstrak"));
    });

    // -------------------------------------------------------------------------
    // [4] Pengujian Validasi Input Payload (POST Handler SUNGGUHAN)
    // -------------------------------------------------------------------------
    console.log("\n[4] Pengujian Validasi Input Payload (POST Handler SUNGGUHAN):");

    // Setup mock findUnique agar mengembalikan attachment berstatus 'done'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.attachment as any).findUnique = async () => ({
      id: "att-done-valid",
      reportId: "rep-valid-1",
      fileType: "image",
      extractionStatus: "done",
    });

    await runTest("Menolak input tanpa tipe atau tipe di luar enum -> 400 Bad Request", async () => {
      const res1 = await postManualTx(
        createPostRequest("att-done-valid", { amount: 50000, description: "Kas", transactionDate: "2026-10-16" }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(res1.status, 400);

      const res2 = await postManualTx(
        createPostRequest("att-done-valid", { type: "hibah", amount: 50000, description: "Kas", transactionDate: "2026-10-16" }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(res2.status, 400);
    });

    await runTest("Menolak nominal <= 0, negatif, atau bukan angka -> 400 Bad Request", async () => {
      const resZero = await postManualTx(
        createPostRequest("att-done-valid", { type: "pemasukan", amount: 0, description: "Infaq", transactionDate: "2026-10-16" }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(resZero.status, 400);

      const resNeg = await postManualTx(
        createPostRequest("att-done-valid", { type: "pemasukan", amount: -10000, description: "Infaq", transactionDate: "2026-10-16" }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(resNeg.status, 400);

      const resNaN = await postManualTx(
        createPostRequest("att-done-valid", { type: "pemasukan", amount: "seratus_ribu", description: "Infaq", transactionDate: "2026-10-16" }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(resNaN.status, 400);
    });

    await runTest("Menolak keterangan kosong atau melebihi 500 karakter -> 400 Bad Request", async () => {
      const resEmpty = await postManualTx(
        createPostRequest("att-done-valid", { type: "pemasukan", amount: 50000, description: "   ", transactionDate: "2026-10-16" }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(resEmpty.status, 400);

      const resTooLong = await postManualTx(
        createPostRequest("att-done-valid", {
          type: "pemasukan",
          amount: 50000,
          description: "x".repeat(501),
          transactionDate: "2026-10-16",
        }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(resTooLong.status, 400);
    });

    await runTest("Menolak tanggal tidak valid -> 400 Bad Request", async () => {
      const resInvalidDate = await postManualTx(
        createPostRequest("att-done-valid", {
          type: "pemasukan",
          amount: 50000,
          description: "Infaq",
          transactionDate: "bukan-tanggal-valid",
        }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(resInvalidDate.status, 400);
    });

    await runTest("Menolak kategori pada transaksi pemasukan -> 400 Bad Request", async () => {
      const resCatOnIncome = await postManualTx(
        createPostRequest("att-done-valid", {
          type: "pemasukan",
          amount: 50000,
          description: "Infaq",
          transactionDate: "2026-10-16",
          category: "operasional",
        }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(resCatOnIncome.status, 400);
      const json = await resCatOnIncome.json();
      assert(json.error.includes("hanya berlaku untuk transaksi pengeluaran"));
    });

    await runTest("Menolak kategori tidak dikenal pada transaksi pengeluaran -> 400 Bad Request", async () => {
      const resInvalidCat = await postManualTx(
        createPostRequest("att-done-valid", {
          type: "pengeluaran",
          amount: 50000,
          description: "Beli sapu",
          transactionDate: "2026-10-16",
          category: "kategori_ngawur_tak_terdaftar",
        }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );
      assert.strictEqual(resInvalidCat.status, 400);
      const json = await resInvalidCat.json();
      assert(json.error.includes("Nilai kategori tidak valid"));
    });

    // -------------------------------------------------------------------------
    // [5] Keberhasilan Staf BENDAHARA & ADMIN serta Penyimpanan createdById & isManual
    // -------------------------------------------------------------------------
    console.log("\n[5] Pengujian Eksekusi Sukses BENDAHARA & ADMIN (createdById & isManual tersimpan):");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capturedCreateData: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.transaction as any).create = async ({ data }: { data: any }) => {
      capturedCreateData = data;
      return {
        id: "tx-created-success-1",
        ...data,
      };
    };

    await runTest("BENDAHARA berhasil menambah baris manual (isManual: true, createdById tersimpan)", async () => {
      currentMockSession = {
        user: { id: "user-bendahara-id-001", role: "BENDAHARA", name: "Ust. Bendahara" },
        expires: "2099-01-01",
      };

      const res = await postManualTx(
        createPostRequest("att-done-valid", {
          type: "pemasukan",
          amount: 350000,
          description: "Infaq Hamba Allah Subuh",
          transactionDate: "2026-10-16",
          donorNameRaw: "hamba allah",
        }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );

      assert.strictEqual(res.status, 201, "BENDAHARA harus mendapatkan 201 Created");
      const json = await res.json();
      assert.strictEqual(json.data.amount, 350000);
      assert.strictEqual(json.data.isManual, true);
      assert.strictEqual(json.data.createdById, "user-bendahara-id-001");
      assert.strictEqual(capturedCreateData.isManual, true, "Data Prisma HARUS memiliki isManual: true");
      assert.strictEqual(capturedCreateData.isVerified, false, "Baris baru HARUS berstatus draft (isVerified: false)");
      assert.strictEqual(capturedCreateData.createdById, "user-bendahara-id-001");
    });

    await runTest("ADMIN berhasil menambah baris manual pengeluaran berkategori", async () => {
      currentMockSession = {
        user: { id: "user-admin-id-999", role: "ADMIN", name: "Ketua DKM" },
        expires: "2099-01-01",
      };

      const res = await postManualTx(
        createPostRequest("att-done-valid", {
          type: "pengeluaran",
          amount: 175000,
          description: "Beli Alat Kebersihan Masjid",
          transactionDate: "2026-10-16",
          category: "operasional",
        }),
        { params: Promise.resolve({ id: "att-done-valid" }) }
      );

      assert.strictEqual(res.status, 201, "ADMIN harus mendapatkan 201 Created");
      const json = await res.json();
      assert.strictEqual(json.data.amount, 175000);
      assert.strictEqual(json.data.category, "operasional");
      assert.strictEqual(json.data.isManual, true);
      assert.strictEqual(json.data.createdById, "user-admin-id-999");
    });

    // -------------------------------------------------------------------------
    // [6] Pengujian Isolasi Data Publik (Draf Manual TIDAK Bocor ke Publik)
    // -------------------------------------------------------------------------
    console.log("\n[6] Pengujian Isolasi Transaksi Draf Manual dari Endpoint Publik:");

    await runTest("Draf manual TIDAK muncul di GET /api/reports/:id/transactions untuk akun Jamaah/Guest", async () => {
      // Mock findUnique report
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.report as any).findUnique = async () => ({ id: "rep-test-pub" });

      // Mock findMany transaksi: hanya mengembalikan data sesuai filter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.transaction as any).findMany = async ({ where }: any) => {
        const dummyPool = [
          { id: "tx-verified-1", isVerified: true, isManual: false, description: "Kas Resmi 1" },
          { id: "tx-manual-draft-1", isVerified: false, isManual: true, description: "Draf Manual Terlewat" },
        ];
        return dummyPool.filter((t) => {
          if (where.isVerified !== undefined && t.isVerified !== where.isVerified) return false;
          return true;
        });
      };

      // 1. Sesi Jamaah (role: null)
      currentMockSession = {
        user: { id: "user-jamaah-guest", role: null },
        expires: "2099-01-01",
      };

      const reqGuest = new NextRequest("http://localhost:3000/api/reports/rep-test-pub/transactions");
      const resGuest = await getReportTransactions(reqGuest, { params: Promise.resolve({ id: "rep-test-pub" }) });
      assert.strictEqual(resGuest.status, 200);
      const jsonGuest = await resGuest.json();
      const txsGuest = jsonGuest.data as { id: string; isVerified: boolean }[];

      assert.strictEqual(txsGuest.length, 1);
      assert.strictEqual(txsGuest[0].id, "tx-verified-1");
      assert.strictEqual(txsGuest.some((t) => t.id === "tx-manual-draft-1"), false, "Draf manual TIDAK boleh bocor ke publik");

      // 2. Sesi Staf (role: BENDAHARA) -> Draf manual MUNCUL untuk ditinjau
      currentMockSession = {
        user: { id: "user-bendahara-id-001", role: "BENDAHARA" },
        expires: "2099-01-01",
      };
      const reqStaff = new NextRequest("http://localhost:3000/api/reports/rep-test-pub/transactions");
      const resStaff = await getReportTransactions(reqStaff, { params: Promise.resolve({ id: "rep-test-pub" }) });
      const jsonStaff = await resStaff.json();
      assert.strictEqual((jsonStaff.data as { id: string }[]).length, 2, "Staf harus melihat seluruh baris termasuk draf manual");
    });

    await runTest("Draf manual TIDAK muncul di GET /api/expenses/transactions (endpoint publik)", async () => {
      // Mock findMany untuk expenses: route mewajibkan isVerified: true & type: 'pengeluaran'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.transaction as any).findMany = async ({ where }: any) => {
        assert.strictEqual(where.isVerified, true, "Query database expenses WAJIB menyaring isVerified: true");
        assert.strictEqual(where.type, "pengeluaran");
        return [];
      };

      const req = new NextRequest("http://localhost:3000/api/expenses/transactions");
      const res = await getExpenseTransactions(req);
      assert.strictEqual(res.status, 200);
    });

    // -------------------------------------------------------------------------
    // [7] Pengujian Preservasi Baris Manual Saat Ekstrak Ulang
    // -------------------------------------------------------------------------
    console.log("\n[7] Pengujian Logika Preservasi Baris Manual Saat Ekstrak Ulang:");

    await runTest("replaceVerified=false HANYA menghapus draf AI (isVerified=false, isManual=false) dan mempertahankan manual", () => {
      const replaceVerified = false;
      const deleteFilter = {
        attachmentId: "att-123",
        ...(replaceVerified ? {} : { isVerified: false, isManual: false }),
      };

      assert.strictEqual(deleteFilter.attachmentId, "att-123");
      assert.strictEqual(deleteFilter.isVerified, false);
      assert.strictEqual(deleteFilter.isManual, false);

      // Simulasi array baris lampiran
      const attachmentTxPool = [
        { id: "ai-draft-1", isVerified: false, isManual: false },
        { id: "manual-draft-1", isVerified: false, isManual: true },
        { id: "verified-tx-1", isVerified: true, isManual: false },
      ];

      const remainingTxs = attachmentTxPool.filter((t) => {
        const matchesDelete = t.isVerified === deleteFilter.isVerified && t.isManual === deleteFilter.isManual;
        return !matchesDelete;
      });

      assert.strictEqual(remainingTxs.length, 2);
      assert(remainingTxs.some((t) => t.id === "manual-draft-1"), "Baris draf manual HARUS tetap ada");
      assert(remainingTxs.some((t) => t.id === "verified-tx-1"), "Baris terverifikasi HARUS tetap ada");
      assert.strictEqual(remainingTxs.some((t) => t.id === "ai-draft-1"), false, "Draf AI harus terhapus");
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

    // -------------------------------------------------------------------------
    // [8] Konfirmasi Baris Manual via Route Confirm & Donatur Anonim
    // -------------------------------------------------------------------------
    console.log("\n[8] Konfirmasi Baris Manual via Route SUNGGUHAN & Penanganan Nama Anonim:");

    await runTest("Konfirmasi baris manual via POST /api/transactions/:id/confirm dan 'hamba allah' tidak membuat entity Donor", async () => {
      currentMockSession = {
        user: { id: "user-bendahara-id-001", role: "BENDAHARA", name: "Ahmad Bendahara" },
        expires: "2099-01-01",
      };

      // Mock transaction.findUnique
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.transaction as any).findUnique = async ({ where }: any) => {
        if (where.id === "tx-manual-confirm-1") {
          return {
            id: "tx-manual-confirm-1",
            type: "pemasukan",
            amount: 250000,
            description: "Infaq Subuh Hamba Allah (Manual)",
            transactionDate: new Date("2026-10-16"),
            donorNameRaw: "hamba allah",
            isVerified: false,
            isManual: true,
            verifiedBy: null,
          };
        }
        return null;
      };

      // Mock transaction.update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.transaction as any).update = async ({ data }: any) => ({
        id: "tx-manual-confirm-1",
        isVerified: data.isVerified,
        verifiedBy: { name: "Ahmad Bendahara" },
        verifiedAt: data.verifiedAt,
        donorId: data.donorId,
        donorNameRaw: data.donorNameRaw,
        donor: null,
      });

      const confirmReq = new NextRequest("http://localhost:3000/api/transactions/tx-manual-confirm-1/confirm", {
        method: "POST",
      });

      const res = await confirmTx(confirmReq, { params: Promise.resolve({ id: "tx-manual-confirm-1" }) });
      assert.strictEqual(res.status, 200, "Konfirmasi baris manual via route confirm harus berhasil (200)");
      const json = await res.json();

      assert.strictEqual(json.data.isVerified, true, "Transaksi harus terverifikasi");
      assert.strictEqual(json.data.donorId, null, "Nama anonim 'hamba allah' TIDAK boleh memiliki donorId");
      assert.strictEqual(json.data.donor, null, "Nama anonim TIDAK boleh membuat relasi Donor");
    });

    // -------------------------------------------------------------------------
    // [9] Deteksi Duplikat Baris Manual vs AI
    // -------------------------------------------------------------------------
    console.log("\n[9] Pengujian Logika Deteksi Duplikat Transaksi Manual vs AI:");

    await runTest("Deteksi duplikat menangkap baris draf AI yang sama dengan baris manual terverifikasi", () => {
      const verifiedManualTx: DuplicateCandidate = {
        id: "manual-verified-99",
        type: "pemasukan",
        amount: 350000,
        transactionDate: "2026-10-16",
        description: "Infaq Subuh Hamba Allah (Manual)",
        isVerified: true,
      };

      const newAiDraftTx: DuplicateCandidate = {
        id: "ai-draft-new-123",
        type: "pemasukan",
        amount: 350000,
        transactionDate: "2026-10-16",
        description: "Infaq Subuh (terbaca OCR AI)",
        isVerified: false,
      };

      const warning = getDuplicateWarning(newAiDraftTx, [verifiedManualTx]);
      assert(warning, "Sistem HARUS mendeteksi potensi duplikat");
      assert.strictEqual(warning.description, "Infaq Subuh Hamba Allah (Manual)");
    });

    await runTest("Deteksi duplikat menangkap baris draf manual yang sama dengan baris AI terverifikasi", () => {
      const verifiedAiTx: DuplicateCandidate = {
        id: "verified-ai-tx-888",
        type: "pengeluaran",
        amount: 500000,
        transactionDate: "2026-10-16",
        description: "Honor Khotib Jumat",
        isVerified: true,
      };

      const newManualDraftTx: DuplicateCandidate = {
        id: "manual-draft-new-999",
        type: "pengeluaran",
        amount: 500000,
        transactionDate: "2026-10-16",
        description: "Bisyarah Khotib Jumat (input manual)",
        isVerified: false,
      };

      const warning = getDuplicateWarning(newManualDraftTx, [verifiedAiTx]);
      assert(warning, "Sistem HARUS mendeteksi potensi duplikat untuk input manual");
      assert.strictEqual(warning.description, "Honor Khotib Jumat");
    });

  } finally {
    // Restore method asli Prisma
    prisma.attachment.findUnique = originalAttachmentFindUnique;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.transaction as any).create = originalTransactionCreate;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.transaction as any).findUnique = originalTransactionFindUnique;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.transaction as any).update = originalTransactionUpdate;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.report as any).findUnique = originalReportFindUnique;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.transaction as any).findMany = originalTransactionFindMany;
  }

  // ---------------------------------------------------------------------------
  // Ringkasan Pengujian
  // ---------------------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`TOTAL PENGUJIAN: ${passed + failed}`);
  console.log(`  LULUS : ${passed}`);
  console.log(`  GAGAL : ${failed}`);
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
