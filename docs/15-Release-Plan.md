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
- [x] Selector Bulan & Tahun terintegrasi di toolbar dashboard utama
- [x] Mode Mingguan: 4–5 pekan (Jumat) spesifik bulan & tahun terpilih
- [x] Mode Tahunan: 12 bulan (Jan–Des) di desktop, toggle Semester 1 & 2 di mobile
- [x] Ekspor & Cetak terpadu (A4 Mading, PDF, Excel) langsung dari toolbar tanpa modal dialog
- [x] Penyelarasan kartu KPI dan tabel data dengan periode aktif

### Milestone 9 — Unified AppShell Navigation & Official Brand Identity (Polish)
- [x] Komponen layout universal `AppShell` (sidebar desktop permanen + mobile bottom navigation)
- [x] Sinkronisasi ikon logo sidebar masjid dengan aset vektor favicon resmi (`/favicon.svg`)
- [x] Standarisasi format judul tab peramban Shopee-style (`Masjid Archive | [Page]`)

### Milestone 10 — Full Annual Report Export & Toolbar Streamlining (V10, Issue #068, #069, #070)
- [x] Hapus tombol redundant "PDF" langsung dari toolbar ringkasan dashboard
- [x] Ganti label dan aksi tombol menjadi "Cetak Laporan" dengan integrasi dinamis (Bulanan vs Tahunan)
- [x] Halaman cetak laporan tahunan penuh (`/laporan/cetak/tahunan?year=YYYY`) dengan rekap 12 bulan dan daftar mutasi kas tahunan
- [x] Endpoint ekspor PDF tahunan resmi (`GET /api/reports/export/yearly/pdf?year=YYYY`)
- [x] Endpoint ekspor Excel tahunan resmi (`GET /api/reports/export/yearly/excel?year=YYYY`)
- [x] Adaptasi tombol ekspor Excel di dashboard agar mengekspor tahunan saat mode tahunan aktif
- [x] Sinkronisasi konten PDF Tahunan: mencakup Rincian Mutasi Transaksi Kas (Bagian II) lengkap dan konsisten dengan halaman pratinjau (Issue #069)
- [x] Pencegahan pengulangan table footer (`<tfoot>` / baris total) di setiap lembar cetak printer multi-halaman (Issue #069)
- [x] Redesain arsitektur dokumen PDF Tahunan: Halaman 1 sebagai Ringkasan Eksekutif Mading (Kop, Kartu Saldo, Rekap 12 Bulan, Tanda Tangan), Halaman 2+ sebagai Lampiran Buku Besar Mutasi Transaksi (Issue #070)
- [x] Penyatuan tombol aksi cetak di `PrintActionBar` menjadi tombol cerdas "Cetak / Unduh PDF Resmi" dengan animasi loading dan notifikasi toast (Issue #070)
- [x] Penyesuaian `<title>` halaman cetak resmi DKM Al-Luqman untuk mengeliminasi label teknis default saat dicetak via browser (Issue #070)
- [x] Refaktor Lampiran PDF Mutasi Kas menjadi multi-halaman dinamis dengan font 8.5pt, baris 20pt, word-wrap tanpa pemotongan "…", header berulang, dan baris total tunggal (Issue #072)
- [x] Perbaikan garis border pemisah baris tabel lampiran PDF (#c2c9bb) langsung pada rectangle agar tidak tertimpa latar belakang zebra striping (Issue #072)

### Milestone 11 — Manual Transaction Addition on Extraction Review (V10.5, Issue #073 / F-028)
- [x] Tombol & Dialog Tambah Baris Transaksi Manual di `TransactionReviewPanel`
- [x] Endpoint `POST /api/attachments/:id/transactions` dengan otorisasi staf DKM & validasi ketat
- [x] Prisma schema additive: `Transaction.isManual` (Boolean) & `Transaction.createdById` (FK User)
- [x] Logika preservasi baris manual saat ekstrak ulang (`POST /api/attachments/:id/extract`)
- [x] Warning alert baris manual pada modal dialog konfirmasi ekstrak ulang (`ExtractButton`)
- [x] Visual badge penanda "Manual" pada tabel review transaksi
- [x] Otomatisasi pengujian komprehensif manual transaction (`scripts/test-manual-transaction.ts` 21/21 lulus)

### Milestone 12 — Role-Based Upload Navigation & Access Denial Alert (V10.6, Issue #074 / F-029)
- [x] Kondisional menu navigasi "Unggah" di sidebar desktop dan bilah navigasi mobile (`components/app-shell.tsx`) khusus staf DKM (`isStaff(session)`)
- [x] Reposisi menu "Unggah" ke urutan teratas (#1) bagi staf dengan tampilan rapi seragam standar
- [x] Smart Redirect pasca-login (`app/auth/post-login/route.ts`) yang otomatis mengarahkan Bendahara & Admin langsung ke `/unggah`
- [x] Penangkapan parameter `?error=forbidden` pada Dashboard (`app/dashboard/page.tsx` & `components/dashboard-client.tsx`)
- [x] Komponen Banner Alert interaktif di Dashboard dengan penjelasan peran Jemaah vs Staf DKM dan tombol tutup (dismiss) dengan sinkronisasi URL tanpa reload

### Milestone 13 — Client-Side Image Compression for Storage Efficiency (V10.7, Issue #075 / F-030)
- [x] Modul utilitas terpusat kompresi gambar client-side (`lib/image-compression.ts`) berbasis HTML5 Canvas API & WebP conversion
- [x] Resizing proporsional (max width/height 1920px) dan kompresi kualitas 82% dengan rasio penghematan 80%–92%
- [x] Passthrough aman untuk berkas non-gambar (PDF, Excel) dan mekanisme fallback otomatis jika terjadi error
- [x] Integrasi otomatis kompresi dan badge transparansi penghematan ukuran pada formulir unggah laporan (`app/unggah/page.tsx`)
- [x] Integrasi kompresi otomatis pada tombol tambah lampiran laporan (`components/add-attachment-button.tsx`)
- [x] Penyelarasan penanganan MIME `image/webp` pada ekstraksi Vision-LLM (`lib/extract-transactions.ts`)
- [x] Pengujian fungsionalitas kompresi dan integrasi alur unggah berkas (`scripts/test-image-compression.ts`)

### Milestone 14 — Context-Aware Extraction & Multi-Week Sheet Boundary (V10.8, Issue #076 / F-031)
- [x] Injeksi parameter `targetReportDate` ke pipeline Vision-LLM pada `POST /api/attachments/:id/extract`
- [x] Penyusunan prompt dinamis berbasis periode pekan berjalan (rentang Jumat target & Jumat sepekan sebelumnya)
- [x] Deteksi batas saldo penutup (*closing balance boundary*) untuk mencegah percampuran mutasi saat satu lembar memuat dua pekan berbeda
- [x] Preservasi backward compatibility untuk dokumen satu pekan tunggal dan berkas non-gambar (Excel)
- [x] Test suite otomatisasi pengujian prompt boundary dan integrasi handler ekstraksi (`scripts/test-context-aware-extraction.ts`)

### Milestone 15 — Mobile Responsiveness & Touch Ergonomics Alignment (V10.9, Issue #75 / F-032)
- [x] Refaktor padding adaptif shell konten utama (`components/page-shell.tsx`)
- [x] Optimalisasi navigasi mobile bar bawah untuk staf & jamaah (`components/app-shell.tsx`)
- [x] Penataan baris review ekstraksi transaksi & touch targets dialog (`components/transaction-review-panel.tsx`)
- [x] Penyesuaian grid ringkasan 4 saldo detail laporan kas (`app/laporan/[id]/page.tsx`)
- [x] Harmonisasi kartu pengeluaran, donatur, dan layout dashboard di perangkat layar sentuh
- [x] Verifikasi regresi nol pada resolusi desktop dan lulus build/linting 100%

## Release Criteria

- [x] Alur inti (unggah, arsip, cari, detail, ekstraksi, verifikasi) berjalan tanpa error
- [x] Isolasi ketat: data belum diverifikasi tidak pernah bocor ke dashboard/donatur publik
- [x] Tidak ada bug kritis
- [x] Dokumentasi (Wiki `/docs`) sudah diperbarui dan selaras dengan implementasi

## Version

Current: `0.12.0` (Fase V12: Kontrol Paginasi Tabel & Skalabilitas Daftar Data Masif — Issue #079 / F-034)
Next: `1.0.0`

## Changelog

### 0.12.0 (2026-10-20) — Fase V12: Kontrol Paginasi Tabel & Skalabilitas Daftar Data Masif (Issue #079 / F-034)
- **Komponen Standar Paginasi (`components/ui/pagination-controls.tsx`)**:
  - Komponen navigasi tabel modular yang dapat dipakai ulang dengan kontrol First Page (`ChevronsLeft`), Previous (`ChevronLeft`), Page Numbers dengan smart ellipsis logic, Next (`ChevronRight`), dan Last Page (`ChevronsRight`).
  - Pemilih ukuran baris (*Items per page selector*): 10, 25, 50, dan 100 baris per halaman.
  - Ringkasan posisi data deskriptif: "Menampilkan X - Y dari Z data" dengan safe handling untuk data kosong (0 dari 0).
  - Desain sepenuhnya responsif: ringkas pada mobile dengan tombol navigasi touch-friendly (≥ 36px), dan lengkap dengan angka halaman pada desktop.
- **Paginasi Transaksi Pengeluaran (`components/expenses-client.tsx`)**:
  - Membatasi rendering baris tabel pengeluaran desktop dan kartu pengeluaran mobile dengan default 25 item per halaman.
  - Logika reset otomatis ke halaman 1 berbasis render-time key check saat kata kunci pencarian, filter kategori pos kas, filter tahun, filter bulan, atau urutan disortir berubah, tanpa memicu cascading render effects.
- **Paginasi Daftar Donatur (`components/donors-client.tsx`)**:
  - Paginasi daftar donatur terverifikasi dengan default 25 item per halaman.
  - Perhitungan nomor urut ranking (`#rank`) global yang kontinu lintas halaman: `(safePage - 1) * pageSize + idx + 1`, menjaga integritas urutan peringkat donatur.
  - Reset otomatis ke halaman 1 saat pencarian nama atau filter periode berubah.
- **Paginasi Perbendaharaan / Treasury (`components/treasury-client.tsx`)**:
  - Paginasi Tab 2: Riwayat Mutasi Internal Kas (Setor Tunai & Tarik Tunai) dengan default 10 baris per halaman.
  - Paginasi Tab 3: Daftar Transaksi per Kanal Kas (Kas Tunai & Kas Bank) dengan default 15 baris per halaman.
  - Derivasi safe page memastikan tidak ada rendering halaman kosong saat filter kanal kas diubah atau catatan mutasi dihapus.
- **Suite Pengujian Otomatis (`scripts/test-pagination.ts`)**:
  - Pengujian matematika pembagian halaman data, index slicing, boundary clamping (halaman negatif & halaman > totalPages), logika elipsis deretan tombol, integrasi query paginasi database, dan konsistensi penomoran urut ranking donatur (22/22 pengujian lulus 100%).

### 0.11.0 (2026-10-20) — Fase V11: Pemantauan Posisi Kas Fisik vs Kas Bank / Digital & Mutasi Internal (Issue #078 / F-033)
- **Model Database & Skema Prisma (`prisma/schema.prisma`)**:
  - Penambahan kolom `paymentMethod` ("TUNAI" | "BANK", default "TUNAI") pada model `Transaction` secara aditif.
  - Penambahan model baru `TreasuryTransfer` untuk mencatat mutasi internal kas masjid (Setor Tunai ke Bank vs Tarik Tunai dari Bank) beserta jejak audit staf `createdById`.
  - Eksekusi migrasi database Prisma `20261020100000_add_treasury_cash_bank`.
- **Backend API Perbendaharaan (`app/api/treasury/`)**:
  - `GET /api/treasury`: Menyajikan data saldo real-time (Total Kas, Kas Fisik, Kas Bank), rasio likuiditas persentase, alokasi pos belanja per kanal kas, serta riwayat transaksi & mutasi.
  - `POST /api/treasury/transfers`: Pencatatan mutasi internal kas antar-kanal (khusus staf DKM `ADMIN` & `BENDAHARA`).
  - `DELETE /api/treasury/transfers/:id`: Pembatalan/penghapusan catatan mutasi internal (khusus staf DKM).
  - `PATCH /api/transactions/:id/payment-method`: Pengubahan kanal kas transaksi (TUNAI ↔ BANK) oleh staf DKM.
- **Halaman Khusus Pemantauan Kas (`/keuangan`)**:
  - Rute publik `/keuangan` (`app/keuangan/page.tsx` & `components/treasury-client.tsx`) dengan SSR initial data.
  - Tiga kartu saldo utama: Total Kas Keseluruhan (dengan dual progress bar proporsi), Kas Fisik (Tunai / Brankas), dan Kas Bank / Digital (QRIS).
  - Tiga tab analitik: Alokasi Pengeluaran per Kanal, Riwayat Mutasi Internal Kas, dan Daftar Transaksi per Kanal.
  - Modal dialog interaktif bagi staf DKM untuk mencatat setor tunai ke bank atau tarik tunai operasional.
- **Pembaruan Panel Review Transaksi (`components/transaction-review-panel.tsx`)**:
  - Indikator badge visual kanal kas (`Banknote` untuk Kas Tunai, `Building2` untuk Bank/QRIS).
  - Tombol mikro cepat `Ubah` bagi staf login untuk membalik kanal kas transaksi secara instan.
  - Pilihan kanal kas saat mengedit transaksi dan saat menambah baris transaksi manual.
- **Integrasi Navigasi & AppShell (`components/app-shell.tsx`)**:
  - Penambahan menu navigasi "Keuangan" berikon `Wallet` di sidebar desktop dan navigasi mobile.
- **Otomatisasi Pengujian Presisi (`scripts/test-treasury-cash-bank.ts`)**:
  - Test suite komprehensif menguji RBAC staf, formulasi matematika likuiditas, validasi input transfer internal, dan integrasi skema database (25/25 lulus 100%).

### 0.10.9 (2026-10-16) — Fase V10.9: Penyelarasan Responsivitas Tampilan Mobile & Ergonomi Layar Sentuh Multi-Perangkat (Issue #75 / F-032)
- **Harmonisasi Layout Shell Adaptif (`components/page-shell.tsx`)**:
  - Penyesuaian padding horizontal container dari statis `px-6` menjadi responsif `px-4 sm:px-6 md:px-8 lg:px-10` dan padding vertikal `py-5 sm:py-7 md:py-10`.
  - Memberikan batas margin layar 16px (standar UI/UX mobile) sehingga konten tidak terasa sesak, terpotong, atau menempel pada tepi layar pada smartphone.
- **Ergonomi Navigasi Ponsel (`components/app-shell.tsx`)**:
  - Penyelarasan bottom bar mobile agar mendukung hingga 7 item menu staf (Admin/Bendahara) dengan kontainer scroll horizontal halus (*smooth touch scrollbar-hide*) atau pengaturan flex dinamis, touch target ergonomis min 44×44px, dan teks label yang tidak bertumpuk atau terpotong.
- **Adaptabilitas Panel Tinjau Transaksi (`components/transaction-review-panel.tsx`)**:
  - Penataan ulang baris transaksi (`TransactionRow`) pada layar sempit: badge status (*Verified*, *Manual*, kategori) dan tombol aksi (Edit, Hapus) terstruktur rapi tanpa terjadi overflow horizontal atau teks tumpang tindih.
  - Dialog modal tambah/edit transaksi yang fleksibel di layar kecil dengan input touch-friendly.
- **Optimalisasi Detail Laporan Kas (`app/laporan/[id]/page.tsx`)**:
  - Penataan ulang kartu ringkasan 4 saldo (Saldo Awal, Pemasukan, Pengeluaran, Saldo Akhir) menjadi grid 2 kolom di layar mobile (`grid-cols-2 sm:grid-cols-4`) agar nilai nominal angka tetap terbaca utuh tanpa clipping.
  - Toolbar aksi cetak & unduh Excel yang adaptif dan rapi (`flex-wrap`).
- **Optimalisasi Grid Kategori Pengeluaran & Donatur (`components/expenses-client.tsx`, `components/donors-client.tsx`)**:
  - Pengelompokan kartu kategori pengeluaran dan baris daftar donatur yang proporsional di mobile dengan pemisah tipis dan angka nominal tabular terisolasi rapi.
- **Adaptabilitas Hero Band & Indikator Dashboard (`components/dashboard-client.tsx`)**:
  - Hero band saldo kas dan 3 metrik sekunder tertata harmonis tanpa saling bertabrakan pada resolusi 360px–414px.

### 0.10.8 (2026-10-15) — Fase V10.8: Ekstraksi Vision-LLM Context-Aware Berbasis Periode Pekan Laporan (Issue #076 / F-031)
- **Ekstraksi Vision-LLM Context-Aware (`lib/extract-transactions.ts` & `app/api/attachments/:id/extract/route.ts`)**:
  - Endpoint ekstraksi kini meneruskan `report.reportDate` ke `extractTransactionsFromFile`.
  - Prompt Gemini Vision-LLM dilengkapi instruksi batas periode pekan: membedakan transaksi milik pekan berjalan dengan catatan transaksi pekan lain yang tertulis pada halaman fisik yang sama (halaman bersambung).
  - Aturan *Closing Balance Boundary*: AI secara cerdas mengenali garis saldo total penutup tanggal target (misal `TOTAL KAS MESJID TGL 25-7-2025 Rp 850.000`) dan otomatis mengabaikan mutasi yang ditulis di bawah garis penutup tersebut saat mengekstrak laporan pekan berjalan.
  - Untuk laporan pekan lanjutan (misal 1 Agustus 2025) pada berkas yang sama, AI menggunakan saldo penutup pekan lalu sebagai saldo awal dan hanya mengekstrak mutasi lanjutan.
- **Otomatisasi Pengujian Fungsional (`scripts/test-context-aware-extraction.ts`)**:
  - Test suite komprehensif menguji skenario injeksi tanggal laporan, perhitungan boundary mingguan, format bahasa Indonesia, dan ketahanan backward-compatible.

### 0.10.7 (2026-10-15) — Fase V10.7: Kompresi Gambar Otomatis Client-Side Sebelum Unggah Laporan Kas (Issue #075 / F-030)
- **Kompresi Gambar Otomatis Client-Side (`lib/image-compression.ts`)**:
  - Foto resolusi tinggi hasil jepretan kamera ponsel (3–8 MB) otomatis di-*downscale* ke batas maksimal 1920px dan dikonversi ke format **WebP** dengan kualitas 82% langsung di peramban pengguna.
  - Menghasilkan pengurangan ukuran berkas hingga 85%–90% (menjadi ~200–400 KB) tanpa mengurangi keterbacaan teks angka kas oleh manusia maupun AI Gemini.
  - Memperpanjang masa pakai kuota penyimpanan Supabase Storage (1 GB) dari sebelumnya hanya menampung ~300 foto menjadi **3.000 s.d. 5.000 lembar dokumen** (setara 15–25 tahun arsip).
  - Berkas non-gambar (PDF, Excel `.xlsx`/`.xls`) dilewatkan secara utuh (*pass-through*) tanpa kompresi.
  - Dilengkapi mekanisme pengaman: jika berkas hasil kompresi lebih besar dari aslinya atau peramban tidak mendukung canvas/WebP, sistem otomatis menggunakan berkas asli (*graceful fallback*).
- **Indikator Visual Transparansi Ukuran di Formulir Unggah (`app/unggah/page.tsx`)**:
  - Menampilkan badge perbandingan ukuran sebelum dan sesudah kompresi secara langsung (misal: "3.6 MB → 340 KB (Hemat 91%)") pada kartu pratinjau berkas.
  - Proses kompresi berjalan instan di latar belakang saat berkas dipilih sehingga tidak menghalangi interaksi pengguna.
- **Dukungan Tambah Lampiran Terpadu (`components/add-attachment-button.tsx`)**:
  - Penambahan lampiran foto baru pada laporan yang sudah ada turut memanfaatkan pipeline kompresi yang sama.
- **Verifikasi Kompatibilitas AI Vision-LLM (`lib/extract-transactions.ts`)**:
  - Penanganan eksplisit MIME `image/webp` saat mengirimkan inline data gambar ke Google Gemini Vision.
- **Otomatisasi Pengujian Fungsional (`scripts/test-image-compression.ts`)**:
  - Test suite komprehensif menguji skenario rasio kompresi, batas dimensi, passthrough berkas dokumen, dan ketahanan terhadap error.

### 0.10.6 (2026-10-14) — Fase V10.6: Kendali Visibilitas Menu Unggah Berbasis Role & Notifikasi Akses Terbatas (Issue #074 / F-029)
- **Kendali Visibilitas Navigasi Berbasis Peran (`components/app-shell.tsx`)**:
  - Menu **"Unggah"** kini disembunyikan secara otomatis bagi pengguna publik dan akun yang login dengan peran **Jemaah** (`role: null`) menggunakan helper `isStaff(session)`.
  - Hanya staf operasional DKM (**Bendahara** dan **Administrator**) yang dapat melihat dan mengakses tombol Unggah di sidebar desktop dan navigasi mobile.
- **Banner Notifikasi Akses Ditolak di Dashboard (`components/dashboard-client.tsx`)**:
  - Menangkap parameter `?error=forbidden` ketika pengguna tanpa hak akses staf mencoba membuka rute `/unggah` secara langsung.
  - Menampilkan banner peringatan ramah pengguna berwarna kuning/amber dengan ikon `ShieldAlert`, menjelaskan mengapa akses ditolak dan peran akun saat ini.
  - Dilengkapi tombol tutup (*dismiss*) yang menghapus parameter URL via `window.history.replaceState` tanpa *reload*.

### 0.10.5 (2026-10-14) — Fase V10.5: Penambahan Baris Transaksi Manual Saat Review Ekstraksi (Issue #073 / F-028)
- **Fitur Tambah Baris Transaksi Manual (`components/transaction-review-panel.tsx`)**:
  - Tombol **`+ Tambah Baris Transaksi`** di header tabel review untuk staf DKM (Admin/Bendahara).
  - Modal dialog interaktif untuk input: Tanggal, Deskripsi/Uraian, Jenis (Pemasukan/Pengeluaran), Kategori Pengeluaran (wajib untuk pengeluaran), dan Nominal (Rupiah).
  - Badge visual ungu **"Manual"** untuk memudahkan identifikasi data inputan staf versus data hasil Vision-LLM.
  - Review panel tetap tampil dan responsif saat ekstraksi selesai meski menghasilkan 0 baris transaksi, memungkinkan staf memasukkan transaksi secara manual.
- **Backend API & Audit Trail (`app/api/attachments/[id]/transactions/route.ts`)**:
  - Endpoint baru `POST /api/attachments/:id/transactions` dilindungi otorisasi `ADMIN` & `BENDAHARA`.
  - Validasi ketat format tanggal ISO, panjang deskripsi, nominal numerik positif finite, serta keselarasan tipe dan kategori pengeluaran.
  - Jejak audit transparan mencatat `createdById` (relasi FK ke `User`) untuk setiap baris transaksi yang ditambahkan manual.
- **Preservasi Baris Manual Saat Ekstrak Ulang (`app/api/attachments/[id]/extract/route.ts`)**:
  - Logika pembersihan draf saat ekstrak ulang hanya menghapus data otomatis (`where: { attachmentId: id, isVerified: false, isManual: false }`).
  - Baris manual (`isManual: true`) dan baris terverifikasi (`isVerified: true`) aman tersimpan dan tidak terhapus selama proses ekstrak ulang biasa.
  - Pilihan reset total (`replaceVerified: true`) tetap tersedia jika pengguna secara sadar ingin membersihkan seluruh baris lampiran.
- **Peringatan Dinamis di Dialog Ekstrak Ulang (`components/extract-button.tsx`)**:
  - Modal konfirmasi ekstrak ulang mendeteksi jumlah baris manual (`manualCount`) dan menampilkan alert peringatan khusus terkait preservasi baris manual.
- **Test Automation Suite (`scripts/test-manual-transaction.ts`)**:
  - 15 uji coba mencakup otentikasi, validasi data, preservasi ekstrak ulang, reset total, dan audit trail, dengan tingkat kelulusan 100% (15/15 passed).

### 0.10.4 (2026-10-09) — Fase V10.4: Refaktor Lampiran PDF Multi-Halaman & Border Grid (Issue #072)
- **Refaktor Lampiran PDF Multi-Halaman Lega (`lib/export-pdf.ts`)**:
  - **Paginasi Dinamis Otomatis**: Lampiran *Rincian Mutasi Transaksi Kas* tidak lagi dipaksa muat dalam 1 lembar. Menghitung sisa tinggi halaman secara dinamis (`y - txRowHeight < 50`) dan membuat halaman baru jika tidak muat. Target 25–30 baris per lembar.
  - **Tipografi Nyaman & Proporsional**: Font isi tabel ditingkatkan menjadi 8.5pt regular, header 8.5pt bold + subjudul `(Rp)` 7.5pt muted bold, tinggi baris dasar 20pt dengan line-height 11pt, dan padding sel proporsional.
  - **Word-Wrap Tanpa Truncate ("…")**: Helper `wrapText` mengeliminasi pemotongan teks menggunakan pengukuran lebar teks riil (`font.widthOfTextAtSize`). Kolom Uraian dan Sumber/Donatur yang panjang membungkus aman ke baris berikutnya. Satu transaksi dijamin tidak pernah terbelah antar-halaman.
  - **Header Berulang & Baris TOTAL Tunggal**: Header tabel diulang otomatis di setiap lembar baru lampiran, sedangkan baris TOTAL hanya muncul sekali di akhir tabel dengan latar hijau muda (`rgb(0.90, 0.94, 0.90)`) dan border `#154212`.
  - **Penyelarasan Kolom & Prefiks Angka**: Prefiks "Rp" hanya muncul pada header kolom nominal (`Pemasukan (Rp)`, `Pengeluaran (Rp)`, `Saldo Kas (Rp)`) dan di baris TOTAL. Sel transaksi hanya memuat angka terformat `id-ID` atau `-` jika nol.
  - **Perbaikan Garis Border Pemisah Baris**: Memindahkan border langsung ke properti `borderColor: cBorderSoft` (#c2c9bb) dan `borderWidth: 0.7` di dalam `page.drawRectangle` untuk mengeliminasi bug visual painter's algorithm PDF di mana border tertimpa balok latar belakang baris berikutnya.
  - **Footer Global Two-Pass**: Menghitung total halaman dokumen secara dinamis (`doc.getPageCount()`) setelah seluruh lembar terbuat, menampilkan format `Halaman X dari Y` dan identitas resmi DKM di margin bawah dokumen.

### 0.10.3 (2026-10-09) — Fase V10.3: Penyatuan Tombol Tunggal "Cetak Laporan" (Issue #071)
- **Penyederhanaan Menjadi 1 Tombol Tunggal (`components/print-action-bar.tsx`)**:
  - Menghilangkan tombol sekunder "Cetak Browser" yang redundan.
  - Menyediakan **satu-satunya tombol aksi**: **"Cetak Laporan"** (ikon dokumen/cetak) yang secara otomatis menyiapkan dan mengunduh berkas PDF resmi berkualitas tinggi bebas dari teks URL atau header peramban.
  - Jika URL ekspor PDF tidak tersedia (fallback), tombol otomatis memanggil dialog cetak sistem tanpa membingungkan pengguna dengan dua pilihan terpisah.
  - Pengalaman pengguna menjadi intuitif, konsisten, dan bebas dari kebingungan pilihan ganda untuk tujuan yang sama.

### 0.10.2 (2026-10-09) — Fase V10.2: Desain PDF Tahunan Profesional 2-Bagian & Penyatuan Tombol Cetak PDF (Issue #070)
- **Redesain Tata Letak PDF Tahunan 2-Bagian yang Lega & Berwibawa (`lib/export-pdf.ts`)**:
  - **Halaman 1 (Ringkasan Eksekutif Mading)**:
    - Kop Surat resmi DKM Masjid Al-Luqman dan judul dokumen yang elegan.
    - 4 Kartu Ringkasan Saldo yang lapang dan bernapas lega (tinggi 42pt, padding proporsional).
    - Tabel Rekapitulasi 12 Bulan yang nyaman dibaca: tinggi baris ditingkatkan menjadi 18pt, font 7.5pt, zebra striping halus, dan baris Total Tahunan hijau resmi yang tegas.
    - Blok Pengesahan Tanda Tangan DKM (Ketua DKM & Bendahara) langsung di bawah tabel rekapitulasi pada Halaman 1, sehingga lembar pertama dapat berdiri sendiri sebagai dokumen mading / laporan rapat tahunan.
  - **Halaman 2+ (Lampiran Buku Besar Mutasi Transaksi Kas)**:
    - Dimulai di halaman baru (*clean page break*) dengan tajuk lampiran resmi: `LAMPIRAN: RINCIAN MUTASI TRANSAKSI KAS TAHUN {year}`.
    - Tabel transaksi yang lapang: tinggi baris 16pt, font tajam 7pt, padding cell yang lega, dan header tabel otomatis diulang di setiap lembar baru.
    - Footer baris Total Mutasi Tahunan dan blok pengesahan penutup di akhir lampiran.
- **Penyatuan Tombol Aksi di `PrintActionBar` (`components/print-action-bar.tsx`)**:
  - Menyatukan tombol menjadi aksi primer terpadu: **"Cetak / Unduh PDF Resmi"**.
  - Menyediakan *feedback* interaktif: tombol menampilkan indikator loading (*spinner* + teks *"Menyiapkan PDF..."*) saat pemrosesan berlangsung.
  - Menampilkan notifikasi visual toast setelah unduhan dimulai agar pengguna mendapatkan kepastian instan.
- **Standarisasi Judul Halaman Cetak**:
  - Mengatur metadata `<title>` pada halaman cetak (`app/laporan/cetak/tahunan/page.tsx` & `bulanan`) menjadi `Laporan Kas Tahunan {year} - DKM Masjid Al-Luqman` agar header bawaan peramban tidak lagi memunculkan label teknis repositori.
- **Konsistensi Total PDF Tahunan (`generateYearlyReportPdf`)**:
  - Mengintegrasikan Tabel Bagian II: Rincian Mutasi Transaksi Kas Tahunan (No, Tanggal, Uraian, Donatur/Sumber, Pemasukan, Pengeluaran, Saldo Berjalan) secara lengkap ke dalam berkas PDF yang diunduh.
  - Implementasi mekanisme *multi-page pagination* otomatis di engine `pdf-lib` agar rincian transaksi kas mengalir ke halaman berikutnya dengan *header* tabel yang rapi jika volume transaksi melebihi kapasitas halaman.
  - Penempatan baris Total Akumulasi Mutasi dan blok Pengesahan Tanda Tangan DKM di lembar paling akhir dokumen, persis sama dengan tampilan pratinjau cetak web.
- **Pencegahan Pengulangan Total Table Footer pada Cetak Printer Multi-Halaman**:
  - Memperbaiki perilaku bawaan browser print engine yang mengulang elemen `<tfoot>` di bawah setiap potongan tabel per lembar cetak.
  - Memindahkan baris Total Mutasi ke baris penutup di dalam `<tbody>` (atau menerapkan `display: table-row-group !important;`) pada halaman cetak tahunan (`/laporan/cetak/tahunan`) dan bulanan (`/laporan/cetak/bulanan`).
  - Hasil cetak printer kini hanya menampilkan baris total persis SATU KALI di akhir tabel mutasi setelah transaksi terakhir.

### 0.10.0 (2026-10-09) — Fase V10: Cetak & Ekspor Kas Tahunan Penuh & Perapihan Toolbar Laporan (Issue #068)
- **Perapihan Toolbar Dashboard**: Menghapus tombol direct download "PDF" yang membingungkan dan redundan dari toolbar dashboard, menyisakan 2 tombol aksi bersih: `Cetak Laporan` dan `Excel`.
- **Dukungan Cetak Laporan Tahunan**:
  - Halaman pratinjau cetak A4 khusus tahunan (`/laporan/cetak/tahunan?year=YYYY`) dengan Kop DKM, kartu ringkasan saldo awal/akhir tahun, tabel ringkasan akumulasi 12 bulan (Jan–Des), rincian mutasi transaksi kas terverifikasi, dan kolom tanda tangan pengesahan.
  - Bar aksi cetak (`PrintActionBar`) menyediakan tombol Unduh PDF dan Cetak Printer.
- **Ekspor Tahunan PDF & Excel**:
  - Endpoint baru `GET /api/reports/export/yearly/pdf` untuk berkas vektor PDF resmi tahunan.
  - Endpoint baru `GET /api/reports/export/yearly/excel` untuk arsip spreadsheet tahunan.
- **Reaktivitas Mode Toolbar**:
  - Saat mode Mingguan aktif: tombol mencetak & mengekspor laporan bulanan (`month & year`).
  - Saat mode Tahunan aktif: tombol mencetak & mengekspor laporan tahunan penuh (`year`).
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
