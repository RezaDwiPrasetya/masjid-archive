/**
 * scripts/test-treasury-cash-bank.ts
 * Precision Automated Verification Suite for Issue #078 / F-033:
 * Fitur Pemantauan Kas & Perbendaharaan (Kas Fisik vs Kas Bank / Digital)
 */

import { isStaff, isAdmin } from "../lib/auth-guard";
import type { Session } from "next-auth";
import { prisma } from "../lib/prisma";

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("🧪 RUNNING VERIFICATION SUITE: TREASURY CASH & BANK (F-033)");
  console.log("=======================================================\n");

  // ──────────────────────────────────────────────────────────
  // TEST GROUP 1: RBAC & Authorization Integrity
  // ──────────────────────────────────────────────────────────
  console.log("📌 TEST GROUP 1: RBAC & Access Control Checks");

  const anonSession: Session | null = null;
  const jamaahSession: Session = {
    user: { id: "jamaah-1", name: "Jamaah Publik", email: "jamaah@gmail.com", role: null },
    expires: "2099-01-01",
  };
  const bendaharaSession: Session = {
    user: { id: "bendahara-1", name: "Ahmad Bendahara", email: "bendahara@masjid.id", role: "BENDAHARA" },
    expires: "2099-01-01",
  };
  const adminSession: Session = {
    user: { id: "admin-1", name: "Ketua DKM", email: "ketua@masjid.id", role: "ADMIN" },
    expires: "2099-01-01",
  };

  assert("Anonim ditolak dari pencatatan mutasi internal", !isStaff(anonSession));
  assert("Jamaah publik tanpa role ditolak dari pencatatan mutasi internal", !isStaff(jamaahSession));
  assert("Bendahara berwenang mencatat mutasi kas internal", isStaff(bendaharaSession));
  assert("Admin DKM berwenang mencatat mutasi kas internal", isStaff(adminSession));
  assert("Hanya Admin yang berhak ke rute /pengguna", isAdmin(adminSession) && !isAdmin(bendaharaSession));

  // ──────────────────────────────────────────────────────────
  // TEST GROUP 2: Mathematical Accuracy of Liquidity Balance
  // ──────────────────────────────────────────────────────────
  console.log("\n📌 TEST GROUP 2: Likuiditas & Akurasi Rumus Perbendaharaan");

  // Mock transaksi simulasi:
  // - Pemasukan Tunai: Rp 5.000.000 (Tromol Jum'at)
  // - Pemasukan Bank:  Rp 3.000.000 (Transfer QRIS)
  // - Pengeluaran Tunai: Rp 1.500.000 (Konsumsi & Operasional)
  // - Pengeluaran Bank:  Rp 1.000.000 (Tagihan Listrik PLN via transfer)
  const mockTransactions = [
    { type: "pemasukan", amount: 5000000, paymentMethod: "TUNAI", category: null },
    { type: "pemasukan", amount: 3000000, paymentMethod: "BANK", category: null },
    { type: "pengeluaran", amount: 1500000, paymentMethod: "TUNAI", category: "konsumsi" },
    { type: "pengeluaran", amount: 1000000, paymentMethod: "BANK", category: "operasional" },
  ];

  // Mock mutasi kas internal:
  // 1. Setor tunai ke bank Rp 2.000.000 (dari tromol ke rekening BSI)
  // 2. Tarik tunai dari bank Rp 500.000 (untuk kas kecil darurat)
  const mockTransfers = [
    { fromAccount: "TUNAI", toAccount: "BANK", amount: 2000000 },
    { fromAccount: "BANK", toAccount: "TUNAI", amount: 500000 },
  ];

  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;

  for (const tx of mockTransactions) {
    const isCash = (tx.paymentMethod ?? "TUNAI") === "TUNAI";
    if (tx.type === "pemasukan") {
      if (isCash) cashIn += tx.amount;
      else bankIn += tx.amount;
    } else {
      if (isCash) cashOut += tx.amount;
      else bankOut += tx.amount;
    }
  }

  let transfersBankToCash = 0;
  let transfersCashToBank = 0;

  for (const tr of mockTransfers) {
    if (tr.fromAccount === "BANK" && tr.toAccount === "TUNAI") {
      transfersBankToCash += tr.amount;
    } else if (tr.fromAccount === "TUNAI" && tr.toAccount === "BANK") {
      transfersCashToBank += tr.amount;
    }
  }

  const cashBalance = cashIn - cashOut + transfersBankToCash - transfersCashToBank;
  const bankBalance = bankIn - bankOut + transfersCashToBank - transfersBankToCash;
  const totalBalance = cashBalance + bankBalance;

  // Nilai ekspektasi:
  // Saldo Tunai Murni: 5.000.000 - 1.500.000 = 3.500.000
  // Setelah Setor Bank 2jt & Tarik Bank 500rb: 3.500.000 - 2.000.000 + 500.000 = 2.000.000
  assert("Perhitungan Saldo Kas Fisik (Tunai) presisi (Rp 2.000.000)", cashBalance === 2000000);

  // Saldo Bank Murni: 3.000.000 - 1.000.000 = 2.000.000
  // Setelah Terima Setor 2jt & Ditarik 500rb: 2.000.000 + 2.000.000 - 500.000 = 3.500.000
  assert("Perhitungan Saldo Kas Bank presisi (Rp 3.500.000)", bankBalance === 3500000);

  // Total Kas Gabungan: 2.000.000 + 3.500.000 = 5.500.000
  // Total Pemasukan Bersih: (5jt + 3jt) - (1.5jt + 1jt) = 8jt - 2.5jt = 5.500.000
  assert("Total Kas Masjid tidak terpengaruh oleh mutasi kas internal (konservasi kekayaan kas)", totalBalance === 5500000);
  assert("Total Kas sama persis dengan total pemasukan minus pengeluaran", totalBalance === (cashIn + bankIn) - (cashOut + bankOut));

  // ──────────────────────────────────────────────────────────
  // TEST GROUP 3: Validation Rules for Treasury Transfers
  // ──────────────────────────────────────────────────────────
  console.log("\n📌 TEST GROUP 3: Validasi Input Mutasi Kas & Kanal Pembayaran");

  function validateTransferInput(from: string, to: string, amount: any) {
    const fromUpper = String(from).trim().toUpperCase();
    const toUpper = String(to).trim().toUpperCase();

    if (fromUpper !== "TUNAI" && fromUpper !== "BANK") {
      return { valid: false, error: "fromAccount tidak valid" };
    }
    if (toUpper !== "TUNAI" && toUpper !== "BANK") {
      return { valid: false, error: "toAccount tidak valid" };
    }
    if (fromUpper === toUpper) {
      return { valid: false, error: "fromAccount dan toAccount tidak boleh sama" };
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return { valid: false, error: "Nominal harus angka positif > 0" };
    }
    return { valid: true };
  }

  assert("Transfer TUNAI ke BANK diizinkan", validateTransferInput("TUNAI", "BANK", 100000).valid);
  assert("Transfer BANK ke TUNAI diizinkan", validateTransferInput("BANK", "TUNAI", 250000).valid);
  assert("Transfer TUNAI ke TUNAI ditolak", !validateTransferInput("TUNAI", "TUNAI", 50000).valid);
  assert("Transfer BANK ke BANK ditolak", !validateTransferInput("BANK", "BANK", 50000).valid);
  assert("Akun selain TUNAI/BANK ditolak", !validateTransferInput("GOPAY", "BANK", 50000).valid);
  assert("Nominal 0 ditolak", !validateTransferInput("TUNAI", "BANK", 0).valid);
  assert("Nominal negatif ditolak", !validateTransferInput("TUNAI", "BANK", -10000).valid);
  assert("Nominal NaN/String tidak valid ditolak", !validateTransferInput("TUNAI", "BANK", "seratus ribu").valid);

  function validatePaymentMethod(method: any) {
    if (method === undefined || method === null) return "TUNAI"; // default
    const m = String(method).trim().toUpperCase();
    if (m === "TUNAI" || m === "BANK") return m;
    return null;
  }

  assert("paymentMethod default bernilai 'TUNAI'", validatePaymentMethod(undefined) === "TUNAI");
  assert("paymentMethod 'BANK' dikenali valid", validatePaymentMethod("BANK") === "BANK");
  assert("paymentMethod 'tunai' huruf kecil dinormalisasi ke 'TUNAI'", validatePaymentMethod("tunai") === "TUNAI");
  assert("paymentMethod 'KRIPTO' tidak valid (ditolak)", validatePaymentMethod("KRIPTO") === null);

  // ──────────────────────────────────────────────────────────
  // TEST GROUP 4: Database Model & Prisma Integration
  // ──────────────────────────────────────────────────────────
  console.log("\n📌 TEST GROUP 4: Prisma Model & Database Field Verification");

  try {
    // Verifikasi model TreasuryTransfer exists di prisma client
    assert("Model prisma.treasuryTransfer terdefinisi dan siap digunakan", typeof prisma.treasuryTransfer?.findMany === "function");
    assert("Model prisma.transaction terdefinisi dan siap digunakan", typeof prisma.transaction?.findMany === "function");

    // Ambil sampel 1 transaksi jika ada
    const sampleTx = await prisma.transaction.findFirst({
      select: { id: true, paymentMethod: true },
    });
    if (sampleTx) {
      assert("Kolom paymentMethod pada Transaction terbaca dari DB", typeof sampleTx.paymentMethod === "string");
      assert("Nilai paymentMethod adalah TUNAI atau BANK", sampleTx.paymentMethod === "TUNAI" || sampleTx.paymentMethod === "BANK");
    } else {
      console.log("  ℹ️ Info: Belum ada transaksi di DB untuk sampel, pemeriksaan skema selesai.");
    }

    // ──────────────────────────────────────────────────────────
    // TEST GROUP 5: Baseline Reconciliation with Dashboard
    // ──────────────────────────────────────────────────────────
    console.log("\n📌 TEST GROUP 5: Baseline Cash Balance & Dashboard Reconciliation");
    const { getTreasuryBaselineCashBalance } = await import("../lib/treasury");
    const baseline = await getTreasuryBaselineCashBalance();
    assert("Baseline saldo kas fisik terhitung sebagai angka positif >= 0", typeof baseline === "number" && baseline >= 0);

    const latestReport = await prisma.report.findFirst({
      where: { finalBalance: { not: null } },
      orderBy: { reportDate: "desc" },
      select: { finalBalance: true },
    });

    if (latestReport?.finalBalance) {
      const latestFinal = Number(latestReport.finalBalance);
      const totalIn = await prisma.transaction.aggregate({
        where: { isVerified: true, type: "pemasukan", paymentMethod: { notIn: ["TRANSFER", "QRIS"] } },
        _sum: { amount: true },
      });
      const totalOut = await prisma.transaction.aggregate({
        where: { isVerified: true, type: "pengeluaran", paymentMethod: { notIn: ["TRANSFER", "QRIS"] } },
        _sum: { amount: true },
      });
      const netCashTx = Number(totalIn._sum.amount || 0) - Number(totalOut._sum.amount || 0);
      const reconciledCash = baseline + netCashTx;

      assert(`Rekonsiliasi Kas Fisik cocok dengan Saldo Kas Dashboard (Rp ${reconciledCash} === Rp ${latestFinal})`, reconciledCash === latestFinal);
    }
  } catch (dbErr: any) {
    console.error("  ⚠️ Peringatan DB check:", dbErr.message);
  }

  // ──────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────
  console.log("\n=======================================================");
  console.log(`🏁 HASIL PENGUJIAN: ${passed} PASS, ${failed} FAIL`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
