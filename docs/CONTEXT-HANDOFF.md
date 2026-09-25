# CONTEXT HANDOFF — Proyek "Masjid Archive"
> **Terakhir diperbarui**: 25 September 2026  
> **Status**: Fase V6 (Advanced Transparency & Multimodal Data Pipeline) — **SELESAI (Issue #054, #055, #056, #057)**

---

## 1. TUJUAN UTAMA PROJECT
Aplikasi web arsip & manajemen keuangan untuk **DKM Masjid Al-Luqman** (Kel. Soklat, Kec. Subang). Awalnya proyek PKL Reza di PT Gothru Media Indonesia.  
**Tujuan**: Mengubah pencatatan buku kas fisik mingguan (difoto, dipajang di mading) menjadi platform digital yang mengarsipkan, mengekstrak data via vision-LLM, memverifikasi manual, dan menyajikan transparansi keuangan (tren, donatur) ke publik/jemaah tanpa login.

---

## 2. KONDISI PROJECT SAAT INI
- **V1–V5 SELESAI** dan sudah di-push ke repo (fungsional, data, backend).
- **REDESIGN VISUAL MENYELURUH (3 BATCH) SELESAI 100%**.
- **FASE V6 SELESAI 100%**:
  - **Issue #054** (Commit `d29dec3`): Endpoint publik `GET /api/donors/anonymous/transactions` & Modal ledger riwayat transaksi infaq anonim terverifikasi di `/donatur`.
  - **Issue #055** (Commit `fc6b8d8`): Ekstraksi AI dokumen PDF via Gemini Multimodal API di `/api/attachments/:id/extract` & Pratinjau dokumen PDF tersemat (`<iframe>` 65vh) di halaman detail laporan.
  - **Issue #056** (Commit `fcb80bf`): Server-side tabular parser (`lib/parse-excel-transactions.ts`) untuk impor langsung data kas dari spreadsheet Excel (.xlsx/.xls) ke panel review tanpa ketergantungan OCR, lengkap dengan UI di detail laporan.
  - **Issue #057**: Fitur ekspor dan unduh rekapitulasi pembukuan kas mingguan dan bulanan dalam format dokumen cetak PDF (siap mading) dan spreadsheet Excel (.xlsx) untuk transparansi fisik DKM.

---

## 3. ARSITEKTUR / TEKNOLOGI
- **Framework**: Next.js (App Router) + TypeScript
- **ORM**: Prisma versi 5.22.0 — **DIKUNCI, JANGAN upgrade ke v6+** (prisma.config.ts di v6 lebih kompleks, pernah 2x menimbulkan masalah besar sebelumnya)
- **Database**: Vercel Postgres (native)
- **File Storage**: Supabase Storage, bucket "report-photos" — **SENGAJA provider terpisah dari database** (separation of concerns, keputusan sadar, bukan solusi sementara)
- **Auth**: NextAuth.js (Auth.js) + @auth/prisma-adapter, Google OAuth
- **Next.js 16**: **WAJIB pakai `proxy.ts`** dengan fungsi bernama `proxy` (bukan middleware — `middleware.ts` deprecated, build gagal total kalau salah)
- **UI**: shadcn/ui varian Base UI (bukan Radix) — Select butuh prop `items={[{label,value}]}`, Button butuh `nativeButton={false}` kalau prop `render` membungkus elemen non-<button>
- **Vision-LLM**: Google Gemini API (`@google/generative-ai`), free tier untuk development. Model utama `gemini-3.6-flash` dengan auto-fallback ke `gemini-3.5-flash` (timeout 25 detik via AbortController, trigger saat 503/429 dari model utama)
- **Chart**: Recharts via shadcn/ui Charts (`npx shadcn@latest add chart`)
- **Hosting**: Vercel
- **Repo**: GitHub `RezaDwiPrasetya/masjid-archive`, branch `main` (sinkron penuh dengan lokal).

---

## 4. STRUKTUR FILE PENTING

### Backend / Lib:
- `schema.prisma` — model User, Report, Attachment, Transaction, Donor + model NextAuth (Account, Session, VerificationToken)
- `lib/gemini.ts` — singleton GoogleGenerativeAI client
- `lib/extract-transactions.ts` — logika ekstraksi (schema structured output, prompt, fetch gambar/dokumen → Gemini → parse). Skema mencakup `initialBalance`, `finalBalance`, dan per-transaksi: type, amount, description, transactionDate, donorName (nullable)
- `lib/donor-matching.ts` — `normalizeDonorName()`, `isAnonymousDonor()`, `escapeRegex()`, daftar `DONOR_PREFIXES` dan `ANONYMOUS_PATTERNS`
- `lib/donor-service.ts` — `matchAndAssignDonor(txType, rawInput)`, shared logic dipanggil dari endpoint confirm DAN endpoint edit donor
- `lib/auth.ts` — lint warning pre-existing (unused vars trigger/session) — BUKAN regresi

### API Routes (`app/api/`):
- `attachments/[id]/extract/route.ts` — POST trigger ekstraksi (Gambar & PDF V6)
- `reports/[id]/transactions/route.ts` — GET, filter isVerified berdasarkan sesi (tanpa sesi → hanya isVerified=true, dengan sesi → semua)
- `transactions/[id]/route.ts` — PATCH (edit sebelum konfirmasi) + DELETE (hanya jika belum verified)
- `transactions/[id]/confirm/route.ts` — POST, terima `donorNameRaw` opsional, panggil `matchAndAssignDonor`
- `transactions/[id]/donor/route.ts` — PATCH edit nama donatur pada transaksi yang SUDAH verified tanpa menyentuh field finansial lain
- `transactions/[id]/unverify/route.ts` — POST batalkan verifikasi (`isVerified→false`, `verifiedById/At→null`), TIDAK menghapus baris
- `dashboard/trend/route.ts` — GET publik, agregasi via `prisma.$queryRaw` + `DATE_TRUNC` (selaras ke hari Jumat)
- `donors/route.ts`, `donors/[id]/route.ts` — GET publik
- `donors/anonymous/transactions/route.ts` — GET publik (BARU di V6 — Issue #054): rincian transaksi infaq tanpa nama

### Frontend (`app/` & `components/`):
- `app/page.tsx` — Arsip Laporan (landing page, grid kartu 3:4 grup tahun/bulan)
- `app/laporan/[id]/page.tsx` — Detail Laporan (dokumen viewer, rekap kas, tab)
- `app/dashboard/page.tsx` + `components/dashboard-client.tsx` (Hero band saldo)
- `app/donatur/page.tsx` + `components/donors-client.tsx` (2 KPI card 50:50 + modal rincian anonim)
- `app/donatur/[id]/page.tsx` — Detail profil Donatur + riwayat transaksi
- `app/cari/page.tsx` — Pencarian arsip full-width
- `app/unggah/page.tsx` — Form unggah file drag-and-drop & tanggal laporan
- `app/pengguna/page.tsx` — Manajemen pengguna, role, & dialog hapus akun
- `components/app-shell.tsx` — Sidebar 260px, octagram emblem, desktop breadcrumb
- `components/page-shell.tsx` — Layout wrapper global full-width proporsional
- `components/extract-button.tsx` — Tombol ekstraksi AI & badge Model Cadangan
- `components/transaction-review-panel.tsx` — State review transaksi & modal
- `components/ui/` — badge.tsx, table.tsx, button.tsx, card.tsx, alert-dialog.tsx, input.tsx, alert.tsx

---

## 5. DATABASE / SCHEMA PENTING
Model utama:
- `Report`: reportDate (wajib Jumat, unik), year/month/weekOfMonth (auto-derive), uploadedById, `initialBalance`/`finalBalance` (Decimal?, disimpan di Report)
- `Attachment`: fileType (image/pdf/excel), extractionStatus (not_extracted/processing/done/failed), extractionModel, extractionRawResponse (Json?), extractionError, extractedAt
- `Transaction`: type (pemasukan/pengeluaran), amount, description, transactionDate, `donorNameRaw`, `donorId` (nullable), `isVerified` (default false), `verifiedById`, `verifiedAt`. Relasi ke Attachment & Report: `ON DELETE RESTRICT` (konsisten, disengaja)
- `Donor`: `name` (canonical), `normalizedName` (UNIK — kunci fuzzy matching), `contact`. `totalContribution` DIHITUNG ON-THE-FLY (tanpa cache)

### Aturan penting yang JANGAN dilanggar:
- Transaction `isVerified=true` TIDAK BOLEH terhapus otomatis oleh proses apa pun.
- Donasi berpola "hamba allah"/"hamba alloh"/"anonim"/"tanpa nama" / "kas masjid" → `donorId` SELALU null, TIDAK PERNAH jadi entity Donor tersendiri.

---

## 6. FITUR YANG SUDAH SELESAI
- **V1**: Arsip visual dasar
- **V2**: Multi-format upload
- **V3**: Login Google SSO (NextAuth), proteksi rute & role-based access
- **V4**: Ekstraksi data vision-LLM (gambar), review & verifikasi transaksi manual, rekonsiliasi saldo kas
- **Issue #047**: initialBalance/finalBalance di Report, badge Model Cadangan
- **V5 (Issue #048–#053)**: skema Donor, fuzzy matching, endpoint publik, UI assign donatur, edit donor verified, deteksi duplikat, batal verifikasi, Dashboard & Donatur publik
- **Redesign Visual (Batch 1, 2, 3)**: Diseragamkan ke design tokens, full-width PageShell, dan live di `main`

---

## 7. FITUR YANG SELESAI PADA FASE V6
**Fase V6: Advanced Transparency & Multimodal Data Pipeline**
- **Issue #054**: F-018 — Rincian Transparansi Infaq Anonim di Halaman Donatur (Modal dialog ledger riwayat transaksi kotak amal & hamba Allah).
- **Issue #055**: F-019 — Ekstraksi Dokumen Kas PDF via Gemini Multimodal API & Pratinjau Tersemat di Detail Laporan.
- **Issue #056**: F-020 — Direct Parser Impor Spreadsheet Kas Excel (.xlsx/.xls) ke Panel Review.
- **Issue #057**: F-021 — Fitur Ekspor dan Unduh Rekapitulasi Kas Mingguan & Bulanan dalam Format Cetak PDF Mading dan Spreadsheet Excel (.xlsx).

---

## 8. MASALAH/BUG YANG SEDANG DIBAHAS
Tidak ada bug fungsional aktif di codebase.  
Fokus saat ini adalah eksekusi Issue #054 secara rapi tanpa melanggar prinsip data isolasi (hanya data `isVerified=true` yang ditampilkan di modal rincian anonim).

---

## 9. PENYEBAB BUG YANG SUDAH DIKETAHUI (dicatat agar tidak diulang)
- Batasan `max-w-[1120px]` pada PageShell sempat membuat layout di desktop lebar (1920px) menciut — fixed menjadi full-width responsif (`w-full px-6 md:px-8 lg:px-10`).
- ON DELETE RESTRICT pada Transaction→Attachment/Report menyebabkan error hapus jika ada transaksi terkait — fixed dengan aturan hapus berjenjang.
- Transaksi `isVerified=false` sempat terlihat tanpa sesi — fixed dengan proteksi sesi ketat di semua endpoint publik.
- Regex metacharacter pada prefix nama donatur ("h.", "hj.") sempat memotong nama biasa — fixed dengan `escapeRegex()`.
- Agregasi tren grafik sempat mulai hari Senin — fixed diselaraskan ke hari Jumat.

---

## 10. SOLUSI YANG SUDAH DICOBA DAN HASILNYA
- `npx tsc --noEmit` lolos 0 error.
- `npm run lint` lolos 0 error (hanya 3 peringatan pre-existing).
- Isolasi publik teruji: transaksi draft (`isVerified: false`) tidak bocor ke publik.
- Tombol aksi finansial hanya muncul untuk pengguna yang login.

---

## 11. KEPUTUSAN TEKNIS YANG SUDAH DISEPAKATI
- Palet warna: primary `#154212` (hijau tua), surface `#fafaf4`, surface-container `#ffffff`, outline-variant `#c2c9bb`.
- Font: Outfit. Ikon: Lucide.
- Layout: Full-width proporsional (`w-full px-6 md:px-8 lg:px-10`).
- Rincian Infaq Anonim menggunakan dialog/modal responsif dengan format tabel/list ledger rapi, tanpa membuat entity `Donor` palsu di database.

---

## 12. HAL-HAL YANG JANGAN DIUBAH KARENA SUDAH BENAR
- JANGAN upgrade Prisma ke v6+ (tetap di 5.22.0).
- JANGAN satukan Vercel Postgres dengan Supabase Storage.
- JANGAN ubah ON DELETE RESTRICT pada relasi transaksi jadi CASCADE/SET NULL.
- JANGAN biarkan proses apa pun menghapus transaksi `isVerified=true` secara otomatis/implisit.
- JANGAN buat entity Donor untuk pola nama anonim ("hamba allah", "kas masjid").
- JANGAN ubah warna primary `#154212`.
- JANGAN kembalikan batasan `max-w-[1120px]` pada PageShell.

---

## 13. KODE/KONFIGURASI PENTING YANG PERLU DIPERTAHANKAN
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```
Shared logic di `lib/donor-matching.ts` dan `lib/donor-service.ts`.

---

## 14. LANGKAH BERIKUTNYA YANG SEHARUSNYA DILAKUKAN
1. Reza membuat Issue #054 di GitHub.
2. Buat branch baru untuk pengerjaan: `feature/v6-infaq-anonim` atau sesuai konvensi branch proyek.
3. Implementasikan endpoint `GET /api/donors/anonymous/transactions`.
4. Implementasikan UI Modal / Detail View di `components/donors-client.tsx`.
5. Verifikasi: `tsc --noEmit`, `npm run lint`, browser test, pastikan data `isVerified=false` terisolasi 100%.

---

## 15. KONTEKS LAIN YANG PENTING
- Reza adalah mahasiswa akhir Software Engineering (D IV TRPL), selalu sertakan penjelasan singkat fungsi perintah terminal/git.
- Reza selalu melakukan review manual sebelum commit/push.
- Scope tetap fokus pada Masjid Al-Luqman (bukan aplikasi umum/multi-tenant).
- Pola kerja bertahap: 1 issue dalam satu waktu, laporkan dengan bukti konkret.
