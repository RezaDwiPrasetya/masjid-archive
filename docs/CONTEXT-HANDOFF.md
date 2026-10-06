# CONTEXT HANDOFF — Proyek "Masjid Archive"
> **Terakhir diperbarui**: 6 Oktober 2026  
> **Status**: **V1–V7 FEATURE-COMPLETE (SELESAI PENUH & TERUJI) — Merged to Main & Pushed to Remote**

---

## 1. TUJUAN UTAMA PROJECT
Aplikasi web arsip & manajemen keuangan untuk **DKM Masjid Al-Luqman** (Kel. Soklat, Kec. Subang). Proyek PKL & Tugas Akhir Reza (D IV TRPL) di PT Gothru Media Indonesia.  
**Tujuan**: Mengubah pencatatan buku kas fisik mingguan (difoto, dipajang di mading) menjadi platform digital yang mengarsipkan, mengekstrak data via vision-LLM, memverifikasi manual, dan menyajikan transparansi keuangan (tren, donatur, infaq anonim, pengeluaran kas per kategori, ekspor cetak & Excel) ke publik/jemaah tanpa login.

---

## 2. KONDISI PROJECT SAAT INI
- **SELURUH FITUR V1–V7 SELESAI 100% (PROJEK TAMAT / FEATURE-COMPLETE)**:
  - **V1–V2**: Multi-format upload (JPG, PNG, PDF, Excel) & arsip berjenjang.
  - **V3**: Google SSO NextAuth & Role-based Access Control (Admin / Guest).
  - **V4**: Pipeline ekstraksi multimodal vision-LLM (Gemini API) + fallback model cadangan + review & konfirmasi transaksi manual + rekonsiliasi kas.
  - **V5**: Financial Intelligence (Grafik tren kas Jumat/bulanan via raw SQL, entity Donor fuzzy matching, deteksi duplikat, pembatalan verifikasi, isolasi data publik).
  - **Redesign UI Batch 1, 2, 3**: Standarisasi visual tokens, full-width PageShell, Accessible Base UI primitives.
  - **V6 (Issue #054–#057)**:
    - **#054**: Transparansi infaq anonim publik (`/donatur`).
    - **#055**: Ekstraksi PDF multimodal + embedded PDF viewer (`/laporan/:id`).
    - **#056**: Server-side tabular Excel parser (`.xlsx`/`.xls`) langsung ke review panel tanpa OCR.
    - **#057**: Ekspor & cetak rekap kas mingguan & bulanan (format A4 formal mading DKM + Excel spreadsheet).
  - **V7 (Issue #059 / F-023)**:
    - Rekapitulasi & transparansi pengeluaran kas per kategori (`/pengeluaran`).
    - Field additive `category String?` di model `Transaction` via migrasi Prisma.
    - Dropdown pemilihan kategori langsung di review panel (sebelum & sesudah verifikasi).
    - API publik agregasi per kategori (`/api/expenses`) & rincian transaksi (`/api/expenses/transactions`).
    - Penyelarasan layout full-width responsif & penanganan kompatibilitas Next.js 16 context.params Promise NextAuth.
- **PEMELIHARAAN & PERBAIKAN MOBILE (Issue #058)**:
  - **#058 (Selesai)**: Optimasi responsivitas mobile & ergonomi sentuh (eliminasi overlap teks nominal grafik mingguan, perbaikan tap target bottom bar navigasi, padding dialog responsif).
- Seluruh commit sudah digabungkan ke `main` dan sinkron dengan remote GitHub `origin/main`.
- Status kode: `tsc --noEmit` lolos 0 error, `npm run lint` lolos 0 error, production build lolos 100%.
- **Fokus Saat Ini**: Pemeliharaan stabil, operasional riil DKM Al-Luqman, dan dokumentasi laporan Tugas Akhir.et berikutnya.


---

## 3. ARSITEKTUR / TEKNOLOGI
- **Framework**: Next.js (App Router) + TypeScript
- **ORM**: Prisma versi 5.22.0 — **DIKUNCI, JANGAN upgrade ke v6+** (prisma.config.ts di v6 lebih kompleks, pernah 2x menimbulkan masalah besar sebelumnya)
- **Database**: Vercel Postgres (native)
- **File Storage**: Supabase Storage, bucket "report-photos" — **SENGAJA provider terpisah dari database** (separation of concerns, keputusan sadar, bukan solusi sementara)
- **Auth**: NextAuth.js (Auth.js) + @auth/prisma-adapter, Google OAuth
- **Next.js 16**: **WAJIB pakai `proxy.ts`** dengan fungsi bernama `proxy` (bukan middleware — `middleware.ts` deprecated, build gagal total kalau salah)
- **NextAuth di Next.js 16**: Route handler di `app/api/auth/[...nextauth]/route.ts` **WAJIB dibungkus fungsi async** yang me-resolve `const params = await context.params; return nextAuthHandler(req, { params });` karena di Next.js 16 App Router `context.params` adalah Promise. Tanpa wrapper ini, endpoint session/providers menghasilkan error 404 HTML.
- **UI**: shadcn/ui varian Base UI (bukan Radix) — Select butuh prop `items={[{label,value}]}`, Button butuh `nativeButton={false}` kalau prop `render` membungkus elemen non-<button>
- **Vision-LLM**: Google Gemini API (`@google/generative-ai`), free tier untuk development. Model utama `gemini-3.6-flash` dengan auto-fallback ke `gemini-3.5-flash` (timeout 25 detik via AbortController, trigger saat 503/429 dari model utama)
- **Chart**: Recharts via shadcn/ui Charts (`npx shadcn@latest add chart`)
- **Hosting**: Vercel
- **Repo**: GitHub `RezaDwiPrasetya/masjid-archive`, branch `main` (sinkron penuh dengan lokal).

---

## 4. STRUKTUR FILE PENTING

### Backend / Lib:
- `schema.prisma` — model User, Report, Attachment, Transaction (dengan field additive `category`), Donor + model NextAuth (Account, Session, VerificationToken)
- `lib/gemini.ts` — singleton GoogleGenerativeAI client
- `lib/extract-transactions.ts` — logika ekstraksi (schema structured output, prompt, fetch gambar/dokumen → Gemini → parse). Skema mencakup `initialBalance`, `finalBalance`, dan per-transaksi: type, amount, description, transactionDate, donorName (nullable)
- `lib/donor-matching.ts` — `normalizeDonorName()`, `isAnonymousDonor()`, `escapeRegex()`, daftar `DONOR_PREFIXES` dan `ANONYMOUS_PATTERNS`
- `lib/donor-service.ts` — `matchAndAssignDonor(txType, rawInput)`, shared logic dipanggil dari endpoint confirm DAN endpoint edit donor
- `lib/expense-categories.ts` — konstanta kategori pengeluaran kas (operasional, honor, sosial, pembangunan, konsumsi, administrasi, lainnya) & sistem warna badge
- `lib/auth.ts` — konfigurasi authOptions NextAuth

### API Routes (`app/api/`):
- `attachments/[id]/extract/route.ts` — POST trigger ekstraksi (Gambar & PDF V6)
- `reports/[id]/transactions/route.ts` — GET, filter isVerified berdasarkan sesi (tanpa sesi → hanya isVerified=true, dengan sesi → semua)
- `transactions/[id]/route.ts` — PATCH (edit sebelum konfirmasi, dukung category) + DELETE (hanya jika belum verified)
- `transactions/[id]/confirm/route.ts` — POST, terima `donorNameRaw` opsional, panggil `matchAndAssignDonor`
- `transactions/[id]/donor/route.ts` — PATCH edit nama donatur pada transaksi yang SUDAH verified tanpa menyentuh field finansial lain
- `transactions/[id]/category/route.ts` — PATCH (BARU di V7 — Issue #059): edit kategori pengeluaran pada transaksi verified/unverified bagi sesi aktif
- `transactions/[id]/unverify/route.ts` — POST batalkan verifikasi (`isVerified→false`, `verifiedById/At→null`), TIDAK menghapus baris
- `dashboard/trend/route.ts` — GET publik, agregasi via `prisma.$queryRaw` + `DATE_TRUNC` (selaras ke hari Jumat)
- `donors/route.ts`, `donors/[id]/route.ts` — GET publik
- `donors/anonymous/transactions/route.ts` — GET publik (V6 — Issue #054): rincian transaksi infaq tanpa nama
- `expenses/route.ts` — GET publik (BARU di V7 — Issue #059): agregasi pengeluaran per kategori
- `expenses/transactions/route.ts` — GET publik (BARU di V7 — Issue #059): rincian transaksi pengeluaran (filter kategori & paginasi)
- `auth/[...nextauth]/route.ts` — Route handler NextAuth dengan wrapper Promise params

### Frontend (`app/` & `components/`):
- `app/page.tsx` — Arsip Laporan (landing page, grid kartu 3:4 grup tahun/bulan)
- `app/laporan/[id]/page.tsx` — Detail Laporan (dokumen viewer, rekap kas, tab)
- `app/dashboard/page.tsx` + `components/dashboard-client.tsx` (Hero band saldo)
- `app/donatur/page.tsx` + `components/donors-client.tsx` (2 KPI card 50:50 + modal rincian anonim)
- `app/donatur/[id]/page.tsx` — Detail profil Donatur + riwayat transaksi
- `app/pengeluaran/page.tsx` + `components/expenses-client.tsx` (BARU di V7 — Issue #059): Rekapitulasi pengeluaran full-width (3 KPI, progress bar distribusi, filter chips, tabel & kartu rincian)
- `app/cari/page.tsx` — Pencarian arsip full-width
- `app/unggah/page.tsx` — Form unggah file drag-and-drop & tanggal laporan
- `app/pengguna/page.tsx` — Manajemen pengguna, role, & dialog hapus akun
- `components/app-shell.tsx` — Sidebar 260px, octagram emblem, desktop breadcrumb, menu Pengeluaran
- `components/page-shell.tsx` — Layout wrapper global full-width proporsional
- `components/extract-button.tsx` — Tombol ekstraksi AI & badge Model Cadangan
- `components/transaction-review-panel.tsx` — State review transaksi, dropdown kategori pengeluaran real-time, & modal edit
- `components/ui/` — badge.tsx, table.tsx, button.tsx, card.tsx, alert-dialog.tsx, input.tsx, alert.tsx, select.tsx

---

## 5. DATABASE / SCHEMA PENTING
Model utama:
- `Report`: reportDate (wajib Jumat, unik), year/month/weekOfMonth (auto-derive), uploadedById, `initialBalance`/`finalBalance` (Decimal?, disimpan di Report)
- `Attachment`: fileType (image/pdf/excel), extractionStatus (not_extracted/processing/done/failed), extractionModel, extractionRawResponse (Json?), extractionError, extractedAt
- `Transaction`: type (pemasukan/pengeluaran), amount, description, transactionDate, `category` (nullable String untuk pengeluaran, default null), `donorNameRaw`, `donorId` (nullable), `isVerified` (default false), `verifiedById`, `verifiedAt`. Relasi ke Attachment & Report: `ON DELETE RESTRICT` (konsisten, disengaja)
- `Donor`: `name` (canonical), `normalizedName` (UNIK — kunci fuzzy matching), `contact`. `totalContribution` DIHITUNG ON-THE-FLY (tanpa cache)

### Aturan penting yang JANGAN dilanggar:
- Transaction `isVerified=true` TIDAK BOLEH terhapus otomatis oleh proses apa pun.
- Donasi berpola "hamba allah"/"hamba alloh"/"anonim"/"tanpa nama" / "kas masjid" → `donorId` SELALU null, TIDAK PERNAH jadi entity Donor tersendiri.
- Nilai `category` pada transaksi pemasukan bernilai `null`. Pada pengeluaran, jika belum dipilih oleh bendahara bernilai `null` dan ditampilkan di antarmuka sebagai "Tidak Dikategorikan".

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

**Pemeliharaan & Perbaikan Responsivitas (Post-V6 Maintenance)**
- **Issue #058**: F-022 — Optimasi Responsivitas Mobile, Eliminasi Overlap Grafik Tren Kas Mingguan, dan Ergonomi Sentuh Navigasi Bawah (✅ Selesai).

---

## 7b. FITUR FASE V7 — SELESAI PENUH (F-023)
**F-023 — Rekap & Transparansi Pengeluaran Per Kategori (Issue #059) (✅ Selesai & Dimerge ke Main):**
- Migrasi database `20261006095151_add_expense_category`: Field `category String?` (nullable, additive) pada model `Transaction`.
- Shared catalog di `lib/expense-categories.ts`: 7 kategori baku (`operasional`, `honor`, `sosial`, `pembangunan`, `konsumsi`, `administrasi`, `lainnya`) dengan fallback `null` ("Tidak Dikategorikan").
- Interaksi edit kategori di `components/transaction-review-panel.tsx` diselaraskan 100% dengan pola donatur: badge statis terverifikasi dengan ikon pensil inline ✏️ untuk pengguna terautentikasi (dropdown hanya muncul saat pensil diklik).
- Endpoint mutasi `PATCH /api/transactions/[id]/category`: Pengguna terautentikasi dapat mengubah kategori transaksi yang sudah terverifikasi secara in-place tanpa merusak integritas angka saldo kas.
- Endpoint publik aman `GET /api/expenses` & `GET /api/expenses/transactions`: Terisolasi ketat hanya melayani data `isVerified: true`.
- Halaman publik baru `/pengeluaran` (`components/expenses-client.tsx`): 3 KPI cards, visual progress bar proporsi multi-warna, filter kategori interaktif chips, pencarian deskripsi langsung, tabel rincian transaksi terverifikasi full-width responsif.
- Navigasi utama `components/app-shell.tsx`: Menu "Pengeluaran" dengan ikon `Receipt` di desktop dan bottom navigation mobile.

---

## 8. MASALAH/BUG YANG SEDANG DIBAHAS
Tidak ada bug fungsional aktif di codebase. Seluruh fase V1 s/d V7 telah tuntas 100%, teruji lolos typecheck & linter, serta live di Vercel Production.

---

## 9. PENYEBAB BUG YANG SUDAH DIKETAHUI (dicatat agar tidak diulang)
- Batasan `max-w-[1120px]` atau `max-w-6xl` pada PageShell / halaman spesifik sempat membuat layout di desktop lebar (1920px) menciut tidak proporsional — fixed menjadi full-width responsif (`w-full px-6 md:px-8 lg:px-10`).
- **Next.js 16 App Router Dynamic Route `params` Breaking Change**: Pada Next.js 16 Turbopack, parameter `context.params` bertipe `Promise`. NextAuth v4 Route Handler standar mem-parse synchronous sehingga `params.nextauth` terbaca `undefined` dan Next.js me-render 404 HTML (`CLIENT_FETCH_ERROR Unexpected token '<'`) — fixed dengan membungkus handler GET/POST di `app/api/auth/[...nextauth]/route.ts` dan melakukan `await context.params` sebelum delegasi ke `NextAuth(authOptions)`.
- ON DELETE RESTRICT pada Transaction→Attachment/Report menyebabkan error hapus jika ada transaksi terkait — fixed dengan aturan hapus berjenjang.
- Transaksi `isVerified=false` sempat terlihat tanpa sesi — fixed dengan proteksi sesi ketat di semua endpoint publik.
- Regex metacharacter pada prefix nama donatur ("h.", "hj.") sempat memotong nama biasa — fixed dengan `escapeRegex()`.
- Agregasi tren grafik sempat mulai hari Senin — fixed diselaraskan ke hari Jumat.

---

## 10. SOLUSI YANG SUDAH DICOBA DAN HASILNYA
- `npx tsc --noEmit` lolos 0 error.
- `npm run lint` lolos 0 error (hanya 3 peringatan pre-existing).
- NextAuth handler wrapper sukses menangani session request (`/api/auth/session`) mengembalikan JSON valid status 200, mengeliminasi `CLIENT_FETCH_ERROR`.
- Halaman `/pengeluaran` dan komponen-komponennya telah mengadopsi layout full-width selaras dengan halaman lainnya.
- Isolasi publik teruji: transaksi draft (`isVerified: false`) tidak bocor ke publik di endpoint agregasi maupun rincian `/api/expenses`.
- Tombol aksi finansial hanya muncul untuk pengguna yang login.

---

## 11. KEPUTUSAN TEKNIS YANG SUDAH DISEPAKATI
- Palet warna: primary `#154212` (hijau tua), surface `#fafaf4`, surface-container `#ffffff`, outline-variant `#c2c9bb`.
- Font: Outfit. Ikon: Lucide.
- Layout: Full-width proporsional (`w-full px-6 md:px-8 lg:px-10`).
- Enum kategori pengeluaran disimpan sebagai hardcoded shared config di `lib/expense-categories.ts`, bukan tabel database relasional terpisah, guna menjaga kesederhanaan skema dan kemudahan deployment tugas akhir.
- Transaksi tanpa kategori disimpan sebagai `null` di database dan disajikan ramah pengguna sebagai "Tidak Dikategorikan".
- Rincian Infaq Anonim menggunakan dialog/modal responsif dengan format tabel/list ledger rapi, tanpa membuat entity `Donor` palsu di database.
- Proteksi Ekstrak Ulang: Jika berkas sudah memiliki transaksi terverifikasi (`verifiedCount > 0`), tombol "Ekstrak Ulang" wajib memicu dialog konfirmasi (`AlertDialog`). Opsi eksplisit yang disediakan adalah:
  1. `Reset & Ekstrak Ulang` (mengirim `{ replaceVerified: true }` ke API untuk menghapus transaksi lama sebelum memasukkan hasil baru).
  2. `Simpan Lama & Tambah Draf` (mengirim `{ replaceVerified: false }`, hanya menghapus unverified).
  Hal ini mencegah insiden duplikasi nilai kas ganda akibat konfirmasi berulang dari ekstrak ulang.
- Pengurutan Halaman Cari (`/cari`): Secara default diurutkan berdasarkan aktivitas terbaru (`terbaru_aktivitas`) dengan menghitung `lastActivity` (waktu terbesar dari `report.uploadedAt`, `attachments.uploadedAt`, `attachments.extractedAt`, dan `transactions.verifiedAt`), serta menyediakan opsi alternatif `tanggal_desc` dan `tanggal_asc`.

---

## 12. HAL-HAL YANG JANGAN DIUBAH KARENA SUDAH BENAR
- JANGAN upgrade Prisma ke v6+ (tetap di 5.22.0).
- JANGAN satukan Vercel Postgres dengan Supabase Storage.
- JANGAN ubah ON DELETE RESTRICT pada relasi transaksi jadi CASCADE/SET NULL.
- JANGAN biarkan proses apa pun menghapus transaksi `isVerified=true` secara otomatis/implisit tanpa konfirmasi eksplisit dari pengguna.
- JANGAN buat entity Donor untuk pola nama anonim ("hamba allah", "kas masjid").
- JANGAN ubah warna primary `#154212`.
- JANGAN kembalikan batasan `max-w-[1120px]` atau `max-w-6xl` pada PageShell / Expenses.
- JANGAN hapus async wrapper `await context.params` pada `app/api/auth/[...nextauth]/route.ts` karena Next.js 16 mewajibkannya untuk dynamic routes.

---

## 13. KODE/KONFIGURASI PENTING YANG PERLU DIPERTAHANKAN
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```
Shared logic di `lib/donor-matching.ts`, `lib/donor-service.ts`, dan `lib/expense-categories.ts`.

---

## 14. LANGKAH BERIKUTNYA YANG SEHARUSNYA DILAKUKAN
**Pemeliharaan Sistem & Persiapan Uji Sidang / Deployment Lanjutan:**
1. **Regression Testing & UAT**: Lakukan uji coba langsung bersama pengurus DKM Masjid Al-Luqman (Bendahara & Ketua DKM) untuk verifikasi laporan mingguan aktual.
2. **Penyusunan Laporan Proyek/Tugas Akhir**: Dokumentasikan metrik performa AI Vision multimodal vs Direct Excel parser, arsitektur isolasi privasi data publik, serta rekap pengeluaran per kategori.
3. **Pemantauan Vercel & Supabase**: Monitor kuota gratis Vercel Postgres & Supabase Storage untuk memastikan kapasitas media foto/PDF mencukupi hingga 1–2 tahun ke depan.

---

## 15. KONTEKS LAIN YANG PENTING
- Reza adalah mahasiswa akhir Software Engineering (D IV TRPL), selalu sertakan penjelasan singkat fungsi perintah terminal/git.
- Reza selalu melakukan review manual sebelum commit/push.
- Scope tetap fokus pada Masjid Al-Luqman (bukan aplikasi umum/multi-tenant).
- Pola kerja bertahap: 1 issue dalam satu waktu, laporkan dengan bukti konkret.
