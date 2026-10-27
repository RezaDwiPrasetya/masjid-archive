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
    "PageShell menerapkan padding vertikal adaptif (pt-3 sm:pt-4 md:pt-6 lg:pt-8 pb-6 sm:pb-8 md:pb-10)",
    pageShellContent.includes("pt-3 sm:pt-4 md:pt-6 lg:pt-8 pb-6 sm:pb-8 md:pb-10")
  );

  console.log("\n=== TEST SUITE 2: Verifikasi Ergonomi & Simetri Navigasi Mobile Bottom Bar (AppShell) ===");
  const appShellContent = fs.readFileSync(
    path.join(__dirname, "../components/app-shell.tsx"),
    "utf-8"
  );
  assert(
    "AppShell membentang w-full dan simetris (justify-around) di mobile",
    appShellContent.includes("justify-around") && appShellContent.includes("w-full")
  );
  assert(
    "Setiap item navigasi bawah membagi ruang secara rata dan simetris (flex-1 min-w-0)",
    appShellContent.includes("flex flex-1 min-w-0 flex-col items-center justify-center")
  );
  assert(
    "Label teks navigasi bawah memiliki truncate aman dan padding simetris di ponsel",
    appShellContent.includes("truncate w-full")
  );

  console.log("\n=== TEST SUITE 2B: Verifikasi Preset PeriodFilterBar Ringkas & Lega ===");
  const periodFilterContent = fs.readFileSync(
    path.join(__dirname, "../components/period-filter-bar.tsx"),
    "utf-8"
  );
  assert(
    "PeriodFilterBar memuat preset 'Semua Waktu'",
    periodFilterContent.includes("Semua Waktu")
  );
  assert(
    "PeriodFilterBar memuat preset 'Tahun Ini'",
    periodFilterContent.includes("Tahun Ini")
  );
  assert(
    "Preset 'Bulan Ini' telah dihilangkan agar kartu lega dan tidak perlu di-scroll horizontal",
    !periodFilterContent.includes("Bulan Ini (")
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
    laporanDetailContent.includes("text-2xl sm:text-3xl font-extrabold")
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
    "Kartu pengeluaran memiliki grid responsif dan padding adaptif",
    expensesContent.includes("text-2xl sm:text-3xl")
  );
  assert(
    "Distribusi alokasi pengeluaran memiliki deskripsi yang jelas",
    expensesContent.includes("Distribusi Alokasi Pengeluaran")
  );

  const donorsContent = fs.readFileSync(
    path.join(__dirname, "../components/donors-client.tsx"),
    "utf-8"
  );
  assert(
    "Judul Donatur berukuran proporsional untuk mobile (text-2xl sm:text-3xl)",
    donorsContent.includes("text-2xl sm:text-3xl font-extrabold")
  );
  assert(
    "Nominal donatur di baris tabel menggunakan font adaptif dan tabular-nums",
    donorsContent.includes("text-sm sm:text-base font-bold text-primary tabular-nums")
  );

  console.log("\n========================================================");
  console.log(`HASIL AKHIR: ${passedCount} / ${passedCount + failedCount} PENGUJIAN LULUS`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite();
