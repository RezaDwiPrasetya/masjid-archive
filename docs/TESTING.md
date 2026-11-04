# Panduan & Matriks Pengujian — Masjid Archive

Dokumen ini menjelaskan struktur pengujian terstandarisasi, matriks uji per pilar/modul, dan perintah eksekusi untuk menjamin integritas fungsional, keamanan, dan akurasi finansial sistem Masjid Archive.

---

## 1. Arsitektur & Filosofi Pengujian

Sistem pengujian Masjid Archive dirancang dengan prinsip:
1. **Zero External Test Framework Overhead**: Menggunakan native Node.js `assert` (`node:assert`) dan `tsx` (`npx tsx` / `npm run test:*`) tanpa ketergantungan jest/vitest, menjaga bundle tetap ringan.
2. **Pilar Modular**: Setiap modul dapat diuji secara terisolasi tanpa harus menjalankan seluruh test suite.
3. **Database Integrity & Cleanup**: Test yang membutuhkan state database membuat data fixture sementara bertanda `__FIXTURE_*__` dan membersihkannya 100% pada blok `finally`.
4. **Master E2E Verification**: Audit sistem menyeluruh (`test:audit`) memvalidasi 39 kriteria kelayakan produksi secara end-to-end.

---

## 2. Matriks Pengujian 5 Pilar + V5 & E2E

| Pilar / Modul | NPM Script | File Uji | Cakupan Pengujian | Status |
|---|---|---|---|---|
| **1. Auth & Access Control** | `npm run test:auth` | `scripts/test-auth-guards.ts`<br>`scripts/test-audit-hardening.ts` | RBAC role (Admin, Bendahara, Jamaah, Anonim), Route Handlers, middleware, proteksi demote last admin, sanitasi PATCH transaksi, timezone resilience | ✅ 79 checks |
| **2. Files & Media** | `npm run test:files` | `scripts/test-file-validation.ts`<br>`scripts/test-image-compression.ts` | Validasi MIME/ekstensi, batas ukuran 10MB (HTTP 413), sanitasi path traversal, WebP canvas downscale, passthrough dokumen non-gambar | ✅ 27 checks |
| **3. AI & Extraction** | `npm run test:ai` | `scripts/test-context-aware-extraction.ts`<br>`scripts/test-auto-categorization.ts` | Gemini Vision prompt dynamic context (periode Jumat penutup), kamus 7 kategori pengeluaran F-043, deteksi word-boundary, fallback ekstraksi lokal | ✅ 27 checks |
| **4. Finance & Data** | `npm run test:finance` | `scripts/test-donor-matching.ts`<br>`scripts/test-manual-transaction.ts`<br>`scripts/test-treasury-cash-bank.ts` | Fuzzy matching nama donatur & varian gelar, deteksi infaq anonim, CRUD transaksi manual F-025, rekonsiliasi kas fisik vs bank F-033 | ✅ 52 checks |
| **5. UI & Navigation** | `npm run test:ui` | `scripts/test-pagination.ts`<br>`scripts/test-navigation-and-redirect.ts`<br>`scripts/test-mobile-responsiveness.ts` | Algoritma paginasi & elipsis tabel F-034, urutan menu dinamis per role, smart post-login redirect, ergonomi mobile bottom bar & layout responsif | ✅ 61 checks |
| **6. V5 Functional** | `npm run test:v5` | `scripts/test-v5-functional.ts` | Verifikasi integrasi API trend mingguan/bulanan, agregasi donatur, sorting tie-breaker alfabetis, HTTP status codes | ✅ Full Pass |
| **7. E2E Master Audit** | `npm run test:audit` | `scripts/audit-full-system.ts` | Verifikasi menyeluruh 5 area sistem (Core Flow, Publik, Keamanan, Analitik & Ekspor, Tampilan & UX) | ✅ 39 checks |

---

## 3. Cara Menjalankan Pengujian

### Menjalankan Per Modul (Fokus Pengembangan)
```bash
# Uji Keamanan & Otorisasi RBAC
npm run test:auth

# Uji Validasi Upload & Kompresi WebP
npm run test:files

# Uji Logika Ekstraksi AI & Auto-Kategorisasi
npm run test:ai

# Uji Perbendaharaan, Transaksi Manual & Donatur
npm run test:finance

# Uji Paginasi, Navigasi & Responsivitas Mobile
npm run test:ui

# Uji Fungsional Endpoint V5
npm run test:v5

# Uji Audit Sistem Komprehensif
npm run test:audit
```

### Menjalankan Seluruh Modul Sekaligus (Pre-Deploy / CI)
```bash
npm run test:all
```
Perintah ini akan menjalankan seluruh 7 rangkaian pengujian secara berurutan. Jika ada satu modul yang gagal, proses akan berhenti dengan exit code 1.

---

## 4. Konvensi Penulisan Test Baru

Jika menambahkan modul baru, ikuti pedoman berikut:

1. **Penamaan File**: Letakkan di folder `scripts/` dengan format `test-[nama-fitur].ts`.
2. **Import Runner**: Gunakan `node:assert` atau `node:assert/strict` dan `prisma` dari `@/lib/prisma`.
3. **Pola Fixture Database**:
   ```ts
   const FIXTURE_PREFIX = `__FIXTURE_${Date.now()}__`;
   const initialCounts = { ... };
   try {
     // Buat data uji sementara
   } finally {
     // Cleanup 100% data uji berdasarkan FIXTURE_PREFIX
     // Pastikan database kembali ke initialCounts persis
   }
   ```
4. **Registrasi ke `package.json`**:
   Tambahkan script baru atau gabungkan ke grup pilar yang relevan (`test:auth`, `test:finance`, dll), lalu sertakan ke dalam `test:all`.

