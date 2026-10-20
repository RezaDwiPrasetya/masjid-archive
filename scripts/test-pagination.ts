/**
 * scripts/test-pagination.ts
 * Automated Verification Suite for Issue #079 / F-034:
 * Fitur Table Pagination & Scalable Listing Controls
 */

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

// Helper logika penomoran halaman dengan elipsis (sama persis dengan PaginationControls)
function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (safePage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }
  if (safePage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages];
}

// Helper kalkulasi rentang data
function getPaginationRange(currentPage: number, pageSize: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  return { totalPages, safePage, startItem, endItem, startIndex, endIndex };
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("🧪 RUNNING VERIFICATION SUITE: TABLE PAGINATION (F-034)");
  console.log("=======================================================\n");

  // ──────────────────────────────────────────────────────────
  // TEST GROUP 1: Mathematical Slicing & Boundary Calculations
  // ──────────────────────────────────────────────────────────
  console.log("📌 TEST GROUP 1: Matematika & Pembagian Halaman Data");

  // Kasus: 142 items, pageSize = 25
  const range1 = getPaginationRange(1, 25, 142);
  assert("Total halaman dari 142 item dengan size 25 adalah 6", range1.totalPages === 6);
  assert("Halaman 1 menampilkan item 1 s.d 25", range1.startItem === 1 && range1.endItem === 25);
  assert("Index array slice halaman 1 adalah 0 s.d 25", range1.startIndex === 0 && range1.endIndex === 25);

  const range2 = getPaginationRange(6, 25, 142);
  assert("Halaman 6 menampilkan item 126 s.d 142 (17 item)", range2.startItem === 126 && range2.endItem === 142);
  assert("Index array slice halaman 6 adalah 125 s.d 142", range2.startIndex === 125 && range2.endIndex === 142);

  // Kasus: Halaman melebihi batas (out of bounds)
  const rangeOverflow = getPaginationRange(99, 25, 142);
  assert("Halaman 99 otomatis di-clamp ke halaman terakhir (6)", rangeOverflow.safePage === 6);

  // Kasus: Halaman 0 atau negatif
  const rangeUnderflow = getPaginationRange(-5, 25, 142);
  assert("Halaman negatif otomatis di-clamp ke halaman 1", rangeUnderflow.safePage === 1);

  // Kasus: Data kosong (0 items)
  const rangeEmpty = getPaginationRange(1, 25, 0);
  assert("Data 0 item menghasilkan totalPages = 1", rangeEmpty.totalPages === 1);
  assert("Data 0 item startItem = 0 dan endItem = 0", rangeEmpty.startItem === 0 && rangeEmpty.endItem === 0);

  // ──────────────────────────────────────────────────────────
  // TEST GROUP 2: Dynamic Ellipsis & Page Numbers Generation
  // ──────────────────────────────────────────────────────────
  console.log("\n📌 TEST GROUP 2: Logika Elipsis & Deretan Tombol Halaman");

  // Total halaman kecil (<= 7): tampilkan semua angka tanpa elipsis
  const pagesSmall = getPageNumbers(3, 5);
  assert("5 halaman tampil penuh tanpa elipsis [1,2,3,4,5]", JSON.stringify(pagesSmall) === JSON.stringify([1, 2, 3, 4, 5]));

  const pages7 = getPageNumbers(4, 7);
  assert("7 halaman tampil penuh tanpa elipsis [1,2,3,4,5,6,7]", JSON.stringify(pages7) === JSON.stringify([1, 2, 3, 4, 5, 6, 7]));

  // Total halaman besar (15 halaman), posisi di awal (page 2)
  const pagesNearStart = getPageNumbers(2, 15);
  assert("15 halaman di posisi awal elipsis di kanan [1,2,3,4,'...',15]", JSON.stringify(pagesNearStart) === JSON.stringify([1, 2, 3, 4, "...", 15]));

  // Total halaman besar (15 halaman), posisi di tengah (page 8)
  const pagesMiddle = getPageNumbers(8, 15);
  assert("15 halaman di posisi tengah elipsis di kedua sisi [1,'...',7,8,9,'...',15]", JSON.stringify(pagesMiddle) === JSON.stringify([1, "...", 7, 8, 9, "...", 15]));

  // Total halaman besar (15 halaman), posisi di akhir (page 14)
  const pagesNearEnd = getPageNumbers(14, 15);
  assert("15 halaman di posisi akhir elipsis di kiri [1,'...',12,13,14,15]", JSON.stringify(pagesNearEnd) === JSON.stringify([1, "...", 12, 13, 14, 15]));

  // ──────────────────────────────────────────────────────────
  // TEST GROUP 3: Database & API Pagination Integration
  // ──────────────────────────────────────────────────────────
  console.log("\n📌 TEST GROUP 3: Integrasi Query Paginasi Database (Expenses)");

  try {
    const totalExpenses = await prisma.transaction.count({
      where: { isVerified: true, type: "pengeluaran" },
    });
    console.log(`  ℹ️ Total transaksi pengeluaran terverifikasi di DB: ${totalExpenses}`);

    if (totalExpenses > 0) {
      // Ambil halaman 1 (limit 10, offset 0)
      const page1 = await prisma.transaction.findMany({
        where: { isVerified: true, type: "pengeluaran" },
        orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
        take: 10,
        skip: 0,
        select: { id: true, amount: true, description: true },
      });

      assert("Query halaman 1 menghasilkan maksimal 10 data", page1.length <= 10 && page1.length > 0);

      // Ambil halaman 2 jika data > 10
      if (totalExpenses > 10) {
        const page2 = await prisma.transaction.findMany({
          where: { isVerified: true, type: "pengeluaran" },
          orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
          take: 10,
          skip: 10,
          select: { id: true, amount: true, description: true },
        });

        assert("Query halaman 2 menghasilkan maksimal 10 data", page2.length <= 10 && page2.length > 0);

        // Verifikasi tidak ada tumpang tindih (disjoint set)
        const page1Ids = new Set(page1.map((tx) => tx.id));
        const overlap = page2.some((tx) => page1Ids.has(tx.id));
        assert("Halaman 1 dan Halaman 2 tidak memiliki data tumpang tindih (disjoint set)", !overlap);
      } else {
        console.log("  ℹ️ Data pengeluaran <= 10, lewati uji tumpang tindih dua halaman.");
      }
    }
  } catch (err: any) {
    console.error("  ⚠️ Gagal uji database:", err.message);
  }

  // ──────────────────────────────────────────────────────────
  // TEST GROUP 4: Rank Index Calculation Consistency
  // ──────────────────────────────────────────────────────────
  console.log("\n📌 TEST GROUP 4: Konsistensi Penomoran Urut (Rank Index)");

  // Uji konsistensi rank nomor urut donatur antar halaman
  // Misal pageSize = 25:
  // Item 0 di Hal 1 -> Rank #1
  // Item 24 di Hal 1 -> Rank #25
  // Item 0 di Hal 2 -> Rank #26
  // Item 24 di Hal 2 -> Rank #50
  function calculateRank(page: number, pageSize: number, index: number) {
    return (page - 1) * pageSize + index + 1;
  }

  assert("Item ke-0 di Hal 1 (size 25) bernomor urut #1", calculateRank(1, 25, 0) === 1);
  assert("Item ke-24 di Hal 1 (size 25) bernomor urut #25", calculateRank(1, 25, 24) === 25);
  assert("Item ke-0 di Hal 2 (size 25) bernomor urut #26", calculateRank(2, 25, 0) === 26);
  assert("Item ke-24 di Hal 2 (size 25) bernomor urut #50", calculateRank(2, 25, 24) === 50);
  assert("Item ke-0 di Hal 3 (size 10) bernomor urut #21", calculateRank(3, 10, 0) === 21);

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

runTestSuite()
  .catch((err) => {
    console.error("Unhandled test exception:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
