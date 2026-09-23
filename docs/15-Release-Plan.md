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

## Release Criteria

- [x] Alur inti (unggah, arsip, cari, detail, ekstraksi, verifikasi) berjalan tanpa error
- [x] Isolasi ketat: data belum diverifikasi tidak pernah bocor ke dashboard/donatur publik
- [x] Tidak ada bug kritis
- [x] Dokumentasi (Wiki `/docs`) sudah diperbarui dan selaras dengan implementasi

## Version

Current: `0.5.0` (Fase V5 Selesai)

## Changelog

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
