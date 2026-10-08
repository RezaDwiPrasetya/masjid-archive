# 15. Release Plan

## Release Strategy

### Milestone 1 — Foundation (V1)
- [x] Repository setup
- [x] Product Wiki lengkap (Technical Spec & API Spec)
- [x] Database Schema dasar (PostgreSQL + Prisma)

### Milestone 2 — Core Feature (V1 & V2)
- [x] Fitur Unggah Laporan (foto + tanggal + multi-file gambar/PDF/Excel)
- [x] Fitur Arsip (pengelompokan otomatis Tahun/Bulan/Minggu)
- [x] Fitur Cari Arsip (kata kunci + filter periode)

### Milestone 3 — Autentikasi & Manajemen Pengguna (V3)
- [x] Google OAuth SSO via NextAuth.js
- [x] Role-Based Access Control (Admin, Bendahara, Jamaah)
- [x] Manajemen Pengguna (`/pengguna`) untuk Administrator

### Milestone 4 — Ekstraksi Cerdas Vision-LLM (V4)
- [x] Integrasi Google Gemini API untuk ekstraksi foto kas tulisan tangan
- [x] Sistem Fallback Model Otomatis jika kuota/rate-limit terlampaui
- [x] Panel Review Transaksi & Rekonsiliasi Saldo Kas (Awal/Akhir)

### Milestone 5 — Financial Intelligence & Dashboard Publik (V5)
- [x] Skema entity `Donor` dan fuzzy matching otomatis
- [x] Dashboard Tren Keuangan Publik (`/dashboard`) berbasis Recharts/shadcn chart
- [x] Pengelompokan mingguan selaras laporan kas fisik hari Jumat
- [x] Rentang dinamis dari data pertama (maksimal 12 periode)
- [x] Halaman Daftar Donatur & Detail Donatur Publik (`/donatur`)
- [x] Fitur Koreksi Nama Donatur Terverifikasi & Pembatalan Verifikasi

### Milestone 6 — Expense Transparency (V7)
- [x] Field `category` di `Transaction` (migration Prisma additive)
- [x] Dropdown kategorisasi pengeluaran di `TransactionReviewPanel`
- [x] Endpoint publik `GET /api/expenses` & `GET /api/expenses/transactions`
- [x] Halaman publik `/pengeluaran` (KPI + breakdown kategori + tabel rincian)

### Milestone 7 — Period Filtering & Financial Analysis (V8, Issue #66)
- [x] Komponen bar filter periode terpadu (`PeriodFilterBar`) dengan selector Tahun, Bulan, dan preset cepat (Semua Waktu, Tahun Ini, Bulan Ini)
- [x] Parameter query `year` dan `month` pada endpoint pengeluaran (`/api/expenses`, `/api/expenses/transactions`)
- [x] Parameter query `year` dan `month` pada endpoint donatur (`/api/donors`, `/api/donors/anonymous/transactions`)
- [x] Reaktivitas penuh kartu KPI, grafik proporsi, dan tabel transaksi di `/pengeluaran`
- [x] Reaktivitas penuh kartu KPI donatur/infaq anonim dan peringkat donatur di `/donatur`

### Milestone 8 — Fiscal Period Filter & Zero-Modal Export (V9, Issue #067)
- [ ] Selector Bulan & Tahun terintegrasi di toolbar dashboard utama
- [ ] Mode Mingguan: 4–5 pekan (Jumat) spesifik bulan & tahun terpilih
- [ ] Mode Tahunan: 12 bulan (Jan–Des) di desktop, toggle Semester 1 & 2 di mobile
- [ ] Ekspor & Cetak terpadu (A4 Mading, PDF, Excel) langsung dari toolbar tanpa modal dialog
- [ ] Penyelarasan kartu KPI dan tabel data dengan periode aktif

## Release Criteria

- [x] Alur inti (unggah, arsip, cari, detail, ekstraksi, verifikasi) berjalan tanpa error
- [x] Isolasi ketat: data belum diverifikasi tidak pernah bocor ke dashboard/donatur publik
- [x] Tidak ada bug kritis
- [x] Dokumentasi (Wiki `/docs`) sudah diperbarui dan selaras dengan implementasi

## Version

Current: `0.9.0` (Fase V9: Fiscal Period Filter & Zero-Modal Export — Issue #067)
Next: `1.0.0`

## Changelog

### 0.9.0 (2026-10-08) — Fase V9: Filter Periode Fiskal & Ekspor Terpadu Tanpa Modal (Issue #067)
- **Toolbar Filter Terpadu**: Pemindahan selector Bulan dan Tahun langsung ke dashboard utama di samping toggle mode grafik.
- **Mode Mingguan Presisi**: Grafik mingguan memplot pekan (Jumat) dalam bulan dan tahun yang dipilih, bukan rolling window acak.
- **Mode Tahunan Responsif (Semesteran Mobile)**: Di desktop menampilkan 12 bulan penuh, di mobile menyediakan toggle Semester 1 (Jan–Jun) dan Semester 2 (Jul–Des) agar tetap lega dan proporsional.
- **Zero-Modal Export**: Tombol Cetak A4 Mading, Unduh PDF, dan Unduh Excel terintegrasi langsung di toolbar dashboard tanpa popup dialog.
- **Reaktivitas KPI & API**: Endpoint `GET /api/dashboard/trend` menerima filter `year` dan `month` untuk agregasi presisi.

### 0.8.0 (2026-10-07) — Fase V8: Filter Periode Waktu & Analisis Keuangan Berkala (Issue #66)
- **Komponen Filter Waktu**: Komponen `PeriodFilterBar` dengan selector Tahun dinamis, selector Bulan (Semua Bulan, Jan–Des), dan tombol preset instan (Semua Waktu, Tahun Ini, Bulan Ini).
- **Ekstensi API Pengeluaran**: Endpoint `GET /api/expenses` dan `GET /api/expenses/transactions` menerima parameter filter `year` dan `month`.
- **Ekstensi API Donatur**: Endpoint `GET /api/donors` dan `GET /api/donors/anonymous/transactions` menerima parameter filter `year` dan `month` untuk kalkulasi kontribusi dinamis sesuai periode.
- **UI Reaktif Halaman `/pengeluaran`**: Seluruh metrik KPI, progress bar proporsi, dan tabel mutasi pengeluaran menyesuaikan dengan periode terpilih.
- **UI Reaktif Halaman `/donatur`**: Kartu KPI donatur & infaq anonim serta ranking kontribusi donatur menyesuaikan dengan periode terpilih.
- **Aset & Identitas Brand**: Pembersihan seluruh berkas boilerplate Vercel dan adopsi ikon vektor resmi masjid Al-Luqman (favicon multi-resolusi, PWA manifest, dan Apple touch icon).

### 0.7.0 (2026-10-06) — Fase V7: Rekap & Transparansi Pengeluaran Per Kategori (Issue #059)
- **Model & Database**: Penambahan kolom `category String?` pada model `Transaction` di `schema.prisma` secara additive/nullable dan eksekusi migrasi Prisma `20261006095151_add_expense_category`.
- **Shared Library Kategori**: Modul terpusat `lib/expense-categories.ts` dengan enum tetap pos kas (`operasional`, `honor`, `sosial`, `pembangunan`, `konsumsi`, `administrasi`, `lainnya`, dan `null` untuk "Tidak Dikategorikan") beserta sistem warna badge seragam.
- **API Agregasi & Rincian**: Endpoint publik `GET /api/expenses` (agregat total & breakdown per kategori) dan `GET /api/expenses/transactions` (rincian transaksi terverifikasi dengan filter kategori & paginasi).
- **Mutasi Kategori**: Endpoint terproteksi sesi `PATCH /api/transactions/:id/category` untuk mengubah kategori pengeluaran tanpa menyentuh angka kas atau status verifikasi.
- **Review Panel**: Dropdown pemilihan kategori langsung di `TransactionReviewPanel` bagi bendahara login (sebelum maupun sesudah verifikasi) serta badge bagi publik.
- **Halaman Publik `/pengeluaran`**: Dashboard publik pengeluaran dengan 3 kartu KPI, visual multi-colored progress bar, interactive category filter chips, search bar real-time, sorting nominal/tanggal, dan tautan laporan kas asal.
- **Navigasi Global**: Penambahan menu "Pengeluaran" berikon `Receipt` pada sidebar desktop dan bottom bar mobile di `components/app-shell.tsx`.
- **Perbaikan UI & Kompatibilitas**:
  - Penyelarasan layout halaman `/pengeluaran` menjadi full-width konsisten dengan halaman Donatur/Dashboard.
  - Perbaikan label dropdown pilihan `null` menjadi "Tidak Dikategorikan" menggantikan string internal `__null__`.
  - Wrapper async `context.params` Promise pada route handler NextAuth (`app/api/auth/[...nextauth]/route.ts`) untuk kompatibilitas penuh Next.js 16 App Router.
- Ekstraksi multimodal PDF & parser Excel deterministik langsung ke draf transaksi.
- Dialog konfirmasi proteksi Ekstrak Ulang (`AlertDialog`) untuk mencegah duplikasi nilai kas, dengan opsi *Reset & Ekstrak Ulang* atau *Simpan Lama & Tambah Draf*.
- Mekanisme pengurutan cerdas di halaman Cari Arsip (`/cari`) berbasis aktivitas terbaru (`terbaru_aktivitas`) dengan opsi filter pengurutan.
- Ekspor rekapitulasi kas ke format Excel dan cetak ramah printer / PDF.
- Modal rincian transaksi Infaq Anonim di halaman Donatur.
- Dokumen Panduan Pengguna komprehensif (`PANDUAN-PENGGUNA.md`) dan diagram UML sistem.

### 0.5.0 (2026-09-23) — Fase V5: Financial Intelligence & Dashboard Publik
- Implementasi dashboard tren pemasukan & pengeluaran publik (`/dashboard`).
- Pengelompokan mingguan berbasis `Report.reportDate` (hari Jumat) dan rentang dinamis data.
- Halaman publik Daftar Donatur & Profil Donatur dengan agregat Infaq Anonim terpisah.
- Fitur koreksi nama donatur pada transaksi terverifikasi dan pembatalan verifikasi (unverify).
- Banner status tahap pengumpulan awal data kas.

### 0.4.0 (2026-09-22) — Fase V4: Ekstraksi Data (Vision-LLM)
- Ekstraksi transaksi dari foto laporan tulisan tangan menggunakan Google Gemini API.
- Panel verifikasi transaksi kas dan deteksi kecocokan saldo fisik.

### 0.3.0 (2026-09-15) — Fase V3: Autentikasi SSO & Manajemen Pengguna
- Migrasi ke NextAuth.js dengan Google Provider.
- Halaman kelola role pengguna untuk administrator.

### 0.2.0 (2026-09-08) — Fase V2: Multi-Format File
- Dukungan lampiran kombinasi gambar, PDF, dan Excel per laporan mingguan.

### 0.1.0 (2026-08-19) — Fase V1: MVP Arsip Digital
- Product Wiki awal, repositori, dan arsitektur dasar.
