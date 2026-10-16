/**
 * Automated Test Suite — F-032: Penyelarasan Responsivitas Tampilan Mobile & Ergonomi Layar Sentuh Multi-Perangkat (Issue #75)
 *
 * Menguji kepatuhan token CSS, layout responsif, touch-targets, dan adaptabilitas
 * viewport ponsel pada komponen kunci: PageShell, AppShell, TransactionRow,
 * ExpensesClient, DonorsClient, dan Detail Laporan.
 */

import * as fs from "fs";
import * as path from "path";

let passedCount = 0;
let failedCount = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${description}`);
    failedCount++;
  }
}

function runSuite() {
  console.log("\n=== TEST SUITE 1: Verifikasi Container Padding Adaptif (PageShell) ===");
  const pageShellContent = fs.readFileSync(
    path.join(__dirname, "../components/page-shell.tsx"),
    "utf-8"
  );
  assert(
    "PageShell menerapkan padding horizontal 16px (px-4) pada mobile dan adaptif ke sm/md/lg",
    pageShellContent.includes("px-4 sm:px-6 md:px-8 lg:px-10")
  );
  assert(
    "PageShell menerapkan padding vertikal adaptif (py-5 sm:py-7 md:py-10)",
    pageShellContent.includes("py-5 sm:py-7 md:py-10")
  );

  console.log("\n=== TEST SUITE 2: Verifikasi Ergonomi Navigasi Mobile Bottom Bar (AppShell) ===");
  const appShellContent = fs.readFileSync(
    path.join(__dirname, "../components/app-shell.tsx"),
    "utf-8"
  );
  assert(
    "AppShell mendukung scroll horizontal halus tanpa scrollbar saat item navigasi > 5",
    appShellContent.includes("navItems.length > 5") &&
      appShellContent.includes("overflow-x-auto") &&
      appShellContent.includes("[scrollbar-width:none]")
  );
  assert(
    "Setiap item navigasi bawah memiliki lebar minimum touch target aman di ponsel (min-w-[58px])",
    appShellContent.includes("min-w-[58px]")
  );
  assert(
    "Label teks navigasi bawah memiliki batas truncate aman di layar kecil",
    appShellContent.includes("truncate max-w-[64px]")
  );

  console.log("\n=== TEST SUITE 3: Verifikasi Responsivitas Baris Transaksi (TransactionRow) ===");
  const reviewPanelContent = fs.readFileSync(
    path.join(__dirname, "../components/transaction-review-panel.tsx"),
    "utf-8"
  );
  assert(
    "Header TransactionRow menggunakan flex-wrap sm:flex-nowrap untuk mencegah overflow",
    reviewPanelContent.includes("flex items-start justify-between gap-2 mb-2 flex-wrap sm:flex-nowrap")
  );
  assert(
    "Badge 'Belum Diverifikasi' memiliki alternatif ringkas 'Draf' untuk mobile (< 640px)",
    reviewPanelContent.includes('<span className="hidden sm:inline">Belum Diverifikasi</span>') &&
      reviewPanelContent.includes('<span className="sm:hidden">Draf</span>')
  );
  assert(
    "Tombol 'Batalkan Verifikasi' memiliki alternatif ringkas 'Batal Verifikasi' di mobile",
    reviewPanelContent.includes('<span className="hidden sm:inline">Batalkan Verifikasi</span>') &&
      reviewPanelContent.includes('<span className="sm:hidden">Batal Verifikasi</span>')
  );
  assert(
    "Tombol aksi Edit dan Hapus transaksi memiliki touch area minimal yang ergonomis (min-h-[36px] min-w-[36px])",
    reviewPanelContent.includes("min-h-[36px] min-w-[36px]")
  );

  console.log("\n=== TEST SUITE 4: Verifikasi Adaptabilitas Detail Laporan & Heading ===");
  const laporanDetailContent = fs.readFileSync(
    path.join(__dirname, "../app/laporan/[id]/page.tsx"),
    "utf-8"
  );
  assert(
    "Judul halaman Detail Laporan berukuran proporsional (text-2xl sm:text-3xl)",
    laporanDetailContent.includes("text-2xl sm:text-3xl font-bold tracking-tight text-on-surface")
  );
  assert(
    "Tombol Cetak dan Unduh Excel membagi ruang secara simetris di ponsel (flex-1 sm:flex-initial)",
    laporanDetailContent.includes("flex-1 sm:flex-initial")
  );

  console.log("\n=== TEST SUITE 5: Verifikasi Grid Kategori Pengeluaran & Donatur ===");
  const expensesContent = fs.readFileSync(
    path.join(__dirname, "../components/expenses-client.tsx"),
    "utf-8"
  );
  assert(
    "Kartu kategori pengeluaran memiliki gap adaptif (gap-2 sm:gap-3) dan padding responsif",
    expensesContent.includes("gap-2 sm:gap-3") && expensesContent.includes("p-3 sm:p-3.5")
  );
  assert(
    "Tag nama kategori di kartu pengeluaran terlindungi oleh truncate agar tidak meluap",
    expensesContent.includes("max-w-[95px] sm:max-w-none")
  );

  const donorsContent = fs.readFileSync(
    path.join(__dirname, "../components/donors-client.tsx"),
    "utf-8"
  );
  assert(
    "Judul Donatur berukuran proporsional untuk mobile (text-2xl sm:text-3xl)",
    donorsContent.includes("text-2xl sm:text-3xl font-bold tracking-tight text-on-surface")
  );
  assert(
    "Nominal donatur di baris tabel menggunakan font adaptif (text-sm sm:text-lg)",
    donorsContent.includes("text-sm sm:text-lg font-bold text-on-surface tabular-nums")
  );

  console.log("\n========================================================");
  console.log(`HASIL AKHIR: ${passedCount} / ${passedCount + failedCount} PENGUJIAN LULUS`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite();
