# CONTEXT HANDOFF — Proyek "Masjid Archive"
> **Terakhir diperbarui**: 9 Oktober 2026  
> **Status**: **V1–V9 FEATURE-COMPLETE (SELESAI PENUH & TERUJI) — Merged to Main & Pushed to Remote**

---

## 1. TUJUAN UTAMA PROJECT
Aplikasi web arsip & manajemen keuangan untuk **DKM Masjid Al-Luqman** (Kel. Soklat, Kec. Subang). Proyek PKL & Tugas Akhir Reza (D IV TRPL) di PT Gothru Media Indonesia.  
**Tujuan**: Mengubah pencatatan buku kas fisik mingguan (difoto, dipajang di mading) menjadi platform digital yang mengarsipkan, mengekstrak data via vision-LLM, memverifikasi manual, dan menyajikan transparansi keuangan (tren, donatur, infaq anonim, pengeluaran kas per kategori, ekspor cetak & Excel) ke publik/jemaah tanpa login.

---

## 2. KONDISI PROJECT SAAT INI
- **SELURUH FITUR V1–V9 SELESAI 100% (PROJEK TAMAT / FEATURE-COMPLETE)**:
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
  - **V8 (Issue #66 / F-024)**:
    - Filter periode waktu terpadu (`PeriodFilterBar`) di halaman Donatur (`/donatur`) dan Pengeluaran (`/pengeluaran`).
    - Modul bersama `lib/period-filter.ts` dengan deteksi tahun dinamis dari database (`getAvailableYears()`) dan preset cepat (Semua Waktu, Tahun Ini, Bulan Ini).
    - Reaktivitas instan seluruh indikator KPI, progress bar proporsi alokasi dana, dan tabel mutasi kas.
  - **V9 (Issue #067 / F-025)**:
    - Toolbar filter periode fiskal (Bulan & Tahun) langsung di samping toggle grafik tren kas dashboard.
    - Mode Mingguan presisi memplot Jumat-Jumat spesifik dari kalender bulan terpilih.
    - Mode Tahunan responsif: 12 bulan penuh di desktop dan toggle Semester 1 & 2 di mobile (< 768px).
    - Zero-Modal Export: Tombol Cetak A4 Mading, Unduh PDF (.pdf), dan Unduh Excel (.xlsx) terpasang langsung di dashboard tanpa popup modal.
  - **Unified AppShell & Brand Identity Polish (F-026)**:
    - Komponen universal `AppShell` (`components/app-shell.tsx`) dengan sidebar desktop 260px permanen, bottom bar mobile thumb-friendly, dan header konteks.
    - Ikon brand sidebar `MasjidEmblem` disinkronkan 1:1 dengan vektor favicon resmi masjid (`/favicon.svg`).
    - Format judul tab peramban Shopee-style: `Masjid Archive | [Halaman]`.
  - **V10 (Issue #068 / F-027 — Dalam Pengerjaan)**:
    - Perapihan toolbar ringkasan kas: eliminasi tombol PDF direct-download yang redundan dan penggantian nama tombol menjadi "Cetak Laporan".
    - Dukungan Cetak & Ekspor Tahunan Penuh (`/laporan/cetak/tahunan`, `/api/reports/export/yearly/pdf`, `/api/reports/export/yearly/excel`).
    - Penyelarasan dinamis: mode Mingguan mencetak rekap bulanan, mode Tahunan mencetak rekap 12 bulan penuh.
- **PENGUATAN KEAMANAN & OTORISASI RBAC 3-TIER (Selesai)**:
  - **Audit & Pengetatan RBAC**: Mengganti pemeriksaan permisif `if (!session)` dengan sistem otorisasi 3-Tier yang ketat: Jamaah (`null` / Guest umum), Bendahara (`BENDAHARA`), Administrator (`ADMIN` / Ketua DKM).
  - **Helper Terpusat (`lib/auth-guard.ts`)**: `isStaff(session)` untuk hak operasional (unggah, ekstraksi AI, verifikasi, edit donatur & kategori) dan `isAdmin(session)` untuk wewenang tertinggi (kelola pengguna & hapus laporan).
  - **Pengetatan Seluruh Handler Mutasi (`app/api/`)**: Aksi `DELETE /api/reports/:id` dikunci eksklusif `ADMIN` (403 untuk lainnya); seluruh aksi mutasi `POST`/`PATCH`/`DELETE` lainnya dikunci untuk `isStaff`.
  - **Penyembunyian Transaksi Draf**: Endpoint `GET /api/reports/[id]/transactions` dan Server Component `app/laporan/[id]/page.tsx` mengunci transaksi belum terverifikasi (`isVerified: false`) khusus bagi staf (`isStaff`).
  - **Pengetatan Middleware (`proxy.ts`)**: Rute `/unggah` hanya dapat diakses staf (`ADMIN`/`BENDAHARA`), rute `/pengguna` hanya `ADMIN`. Akun dengan role `null` otomatis dialihkan ke `/dashboard?error=forbidden`.
  - **Proteksi Data Publik**: Mengganti seluruh query `include: { attachments: true, uploadedBy: true }` dengan `select` eksplisit pada `GET /api/reports`, `GET /api/reports/[id]`, serta Server Component (`app/page.tsx`, `app/cari/page.tsx`, `app/laporan/[id]/page.tsx`) untuk mencegah kebocoran JSON mentah LLM Gemini (`extractionRawResponse`), `extractionError`, serta alamat email pengunggah ke publik tanpa login.
  - **Pembersihan Total Legacy Auth**: Menghapus dependensi `iron-session`, berkas `lib/session.ts`, dan endpoint usang `app/api/auth/login` serta `app/api/auth/logout`.
- Seluruh commit sudah digabungkan ke `main` dan sinkron dengan remote GitHub `origin/main`.
- Status kode: `tsc --noEmit` lolos 0 error, `npm run lint` lolos 0 error, production build lolos 100%, 55 suite test otorisasi lolos 100%.
- **Fokus Saat Ini**: Pemeliharaan stabil, operasional riil DKM Al-Luqman, dan dokumentasi laporan Tugas Akhir.

---

## 3. ARSITEKTUR / TEKNOLOGI
- **Framework**: Next.js (App Router) + TypeScript
- **ORM**: Prisma versi 5.22.0 — **DIKUNCI, JANGAN upgrade ke v6+** (prisma.config.ts di v6 lebih kompleks, pernah 2x menimbulkan masalah besar sebelumnya)
- **Database**: Vercel Postgres (native)
- **File Storage**: Supabase Storage, bucket "report-photos" — **SENGAJA provider terpisah dari database** (separation of concerns, keputusan sadar, bukan solusi sementara)
- **Auth & RBAC**: NextAuth.js (Auth.js) + `@auth/prisma-adapter`, Google OAuth Provider. Sesi berbasis `strategy: "jwt"` dengan sinkronisasi role dinamis ke database pada callback `jwt` dan `session`.
- **Authorization Guard**: Helper sentral di `lib/auth-guard.ts` (`isAdmin`, `isStaff`). Tiga tier role: `null` (Jamaah/Publik), `BENDAHARA` (Pengurus operasional), `ADMIN` (Ketua DKM/Administrator).
- **Next.js 16**: **WAJIB pakai `proxy.ts`** dengan fungsi bernama `proxy` (bukan middleware — `middleware.ts` deprecated, build gagal total kalau salah). Melindungi `/unggah` dan `/pengguna` berdasarkan peran token JWT.
- **NextAuth di Next.js 16**: Route handler di `app/api/auth/[...nextauth]/route.ts` **WAJIB dibungkus fungsi async** yang me-resolve `const params = await context.params; return nextAuthHandler(req, { params });` karena di Next.js 16 App Router `context.params` adalah Promise. Tanpa wrapper ini, endpoint session/providers menghasilkan error 404 HTML.
- **UI**: shadcn/ui varian Base UI (bukan Radix) — Select butuh prop `items={[{label,value}]}`, Button butuh `nativeButton={false}` kalau prop `render` membungkus elemen non-<button>
- **Vision-LLM**: Google Gemini API (`@google/generative-ai`), free tier untuk development. Model utama `gemini-3.6-flash` dengan auto-fallback ke `gemini-3.5-flash` (timeout 25 detik via AbortController, trigger saat 503/429 dari model utama)
- **Chart**: Recharts via shadcn/ui Charts (`npx shadcn@latest add chart`)
- **Hosting**: Vercel
- **Repo**: GitHub `RezaDwiPrasetya/masjid-archive`, branch `main` (sinkron penuh dengan lokal).

---

## 4. STRUKTUR FILE PENTING

### Backend / Lib:
- `schema.prisma` — model User (role: null/BENDAHARA/ADMIN), Report, Attachment, Transaction (dengan field additive `category`), Donor + model NextAuth (Account, Session, VerificationToken)
- `lib/gemini.ts` — singleton GoogleGenerativeAI client
- `lib/extract-transactions.ts` — logika ekstraksi (schema structured output, prompt, fetch gambar/dokumen → Gemini → parse). Skema mencakup `initialBalance`, `finalBalance`, dan per-transaksi: type, amount, description, transactionDate, donorName (nullable)
- `lib/donor-matching.ts` — `normalizeDonorName()`, `isAnonymousDonor()`, `escapeRegex()`, daftar `DONOR_PREFIXES` dan `ANONYMOUS_PATTERNS`
- `lib/donor-service.ts` — `matchAndAssignDonor(txType, rawInput)`, shared logic dipanggil dari endpoint confirm DAN endpoint edit donor
- `lib/expense-categories.ts` — konstanta kategori pengeluaran kas (operasional, honor, sosial, pembangunan, konsumsi, administrasi, lainnya) & sistem warna badge
- `lib/auth.ts` — konfigurasi authOptions NextAuth (JWT strategy, sync role DB ke session)
- `lib/auth-guard.ts` — helper otorisasi `isAdmin(session)` dan `isStaff(session)`
- `scripts/test-auth-guards.ts` — skrip automated unit & simulation test untuk seluruh role guard

### API Routes (`app/api/`):
- `attachments/[id]/extract/route.ts` — POST trigger ekstraksi (khusus Staf: ADMIN & BENDAHARA)
- `reports/[id]/transactions/route.ts` — GET, filter isVerified berdasarkan role staf (publik/guest `null` → hanya isVerified=true, staf → semua termasuk draf)
- `transactions/[id]/route.ts` — PATCH (edit transaksi, category) + DELETE (hapus tx unverified) (khusus Staf)
- `reports/[id]/route.ts` — GET (publik, select aman) + DELETE (khusus ADMIN)
- `users/route.ts` — GET, PATCH, DELETE manajemen akun dan peran pengguna (khusus ADMIN)
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
- Aset Identitas Resmi Masjid Al-Luqman: Pembersihan berkas bawaan starter Vercel di `public/` dan penyediaan favicon multi-resolusi kubah masjid, apple-touch-icon, SVG vektor, serta Web App Manifest.

---

## 7c. FITUR FASE V8 — SELESAI PENUH (F-024, Issue #66)
**F-024 — Filter Periode Waktu & Analisis Keuangan Berkala pada Halaman Donatur dan Pengeluaran (Issue #66) (✅ Selesai & Dimerge ke Main):**
- Branch: `feature/v8-period-filter` telah di-merge ke `main`.
- **Latar Belakang**: Mencegah *data fatigue* seiring akumulasi arsip bertahun-tahun, memungkinkan jemaah dan pengurus melihat data kas per bulan atau per tahun secara terfokus.
- **Helper Backend (`lib/period-filter.ts`)**: Parser query parameter `year` & `month`, pembuat filter relasi Prisma `where: { report: { year, month } }`, dan pengambilan dinamis distinct `availableYears` dari tabel `Report`.
- **Ekstensi API Teruji**:
  - `GET /api/expenses`: Mendukung query param `year` dan `month`, mengembalikan `totalAmount`, `transactionCount`, `breakdown`, `period`, dan `availableYears`.
  - `GET /api/expenses/transactions`: Mendukung query param `year` dan `month`.
  - `GET /api/donors`: Mendukung query param `year` dan `month` untuk menghitung kontribusi per periode dan mengembalikan `availableYears`.
  - `GET /api/donors/anonymous/transactions`: Mendukung query param `year` dan `month` pada ledger transaksi anonim terverifikasi.
- **Komponen Frontend (`components/period-filter-bar.tsx`)**: Komponen universal reusable dengan selector Tahun dinamis, selector Bulan (Semua Bulan, Jan–Des), status badge periode aktif, tombol reset, dan quick preset chips ("Semua Waktu", "Tahun Ini", "Bulan Ini").
- **UI Integrations**:
  - `/pengeluaran`: KPI, progress bar persentase alokasi, filter pills, dan tabel mutasi reaktif terhadap filter periode dengan smooth loading state.
  - `/donatur`: KPI donatur & infaq anonim serta peringkat donatur terurut berdasarkan kontribusi pada periode terpilih, disinkronisasikan langsung dengan modal dialog rincian infaq anonim.
- **Verifikasi**: `tsc --noEmit` lolos 0 error, ESLint 0 error, dan verifikasi visual end-to-end via Browser subagent sukses.

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

## 14. STATUS & LANGKAH BERIKUTNYA
1. **Fase V8 (Issue #66) Telah Tuntas Penuh**:
   - Seluruh endpoint filtering, komponen `PeriodFilterBar`, dan integrasi reaktif di `/pengeluaran` dan `/donatur` telah selesai, diuji visual di browser, dan digabung ke branch `main`.
2. **Penyempurnaan Fitur Ekspor & Cetak Kas A4 (Maintenance / Issue #057 Refinement - Selesai)**:
   - **Optimasi Cetak A4 Pas 1 Lembar**: Mengatur CSS `@page { size: A4 portrait; margin: 8mm 10mm 10mm 10mm; }`, memadatkan padding tabel (`print:py-1 print:px-1.5`, font `10px`), dan merampingkan ruang tanda tangan (`print:h-12`) dengan aturan `print:break-inside-avoid`.
   - **Preservasi Warna Penuh**: Menghilangkan class `print:text-neutral-900` dan mengaktifkan `print-color-adjust: exact !important` di `app/globals.css`, memastikan angka pemasukan (hijau) dan pengeluaran (merah) tetap tampil cerah saat dicetak atau disimpan ke PDF.
   - **Direct PDF Download API (Berbasis `pdf-lib`)**:
     - Ditambahkan endpoint `GET /api/reports/export/monthly/pdf?year=YYYY&month=M` dan `GET /api/reports/:id/export/pdf`.
     - Generator PDF server-side di `lib/export-pdf.ts` menghasilkan PDF vektor A4 resmi dengan Kop DKM, kartu ringkasan, tabel mutasi kas, dan tanda tangan.
     - Berkas dikirim dengan header HTTP `Content-Disposition: attachment`, memicu notifikasi unduhan Chrome/Edge dan otomatis tersimpan di riwayat unduhan (`chrome://downloads`), sangat ergonomis bagi pengguna smartphone (HP) maupun desktop.
   - **Pembaruan Komponen UI**:
     - `components/monthly-export-dialog.tsx`: Menyediakan opsi tombol mandiri "Unduh PDF (.pdf)", "Unduh Excel (.xlsx)", dan "Buka Pratinjau Cetak / Mading (A4)".
     - `components/print-action-bar.tsx`: Menyediakan tombol aksi cepat "Unduh PDF" berdampingan dengan "Cetak (Printer)".
     - `app/laporan/[id]/page.tsx`: Menyediakan tombol unduh PDF langsung.
3. **Penguatan Keamanan, Otorisasi RBAC 3-Tier, dan Proteksi Data Publik (Selesai)**:
   - **Audit & Eliminasi Celah Role Null**: Memastikan pengguna login Google tanpa penetapan role (`null`) tidak dapat melakukan mutasi data keuangan atau melihat draf transaksi yang belum diverifikasi.
   - **Helper Otorisasi Terpusat (`lib/auth-guard.ts`)**: `isStaff(session)` memvalidasi wewenang `ADMIN` dan `BENDAHARA`, sementara `isAdmin(session)` memvalidasi wewenang eksklusif `ADMIN`.
   - **Pengetatan Endpoint & UI**: Aksi hapus laporan kas (`DELETE /api/reports/:id`) dan tombol hapus di UI hanya dapat diakses oleh Administrator. Aksi mutasi operasional lainnya hanya untuk staf.
   - **Proteksi Data Publik**: Query publik menggunakan `select` eksplisit, menyembunyikan dump respons mentah vision-LLM (`extractionRawResponse`), `extractionError`, serta email pengunggah dari publik tanpa login.
   - **Pembersihan Total Legacy Auth**: Modul `iron-session`, berkas `lib/session.ts`, dan endpoint login/logout lama dihapus permanen.
4. **Fase V9: Filter Periode Fiskal & Ekspor Terpadu Tanpa Modal (Issue #067 — Sedang Berjalan)**:
   - Mengganti sistem grafik *rolling window* dengan filter kalender terpadu (Bulan & Tahun).
   - Mode Mingguan: memplot 4–5 pekan (Jumat) spesifik bulan & tahun terpilih.
   - Mode Tahunan: memplot 12 bulan (Jan–Des) di desktop, dan toggle Semester 1 (Jan–Jun) / Semester 2 (Jul–Des) di mobile agar grafik tetap lega (maksimal 6 titik).
   - Zero-Modal Export: tombol Cetak A4, PDF, dan Excel diintegrasikan langsung pada toolbar dashboard tanpa modal popup `MonthlyExportDialog`.
5. **Kandidat Eksplorasi Fase Berikutnya (Fase V10)**:
   - Pemeliharaan performa dan audit berkala data kas.

---

## 15. KONTEKS LAIN YANG PENTING
- Reza adalah mahasiswa akhir Software Engineering (D IV TRPL), selalu sertakan penjelasan singkat fungsi perintah terminal/git.
- Reza selalu melakukan review manual sebelum commit/push.
- Scope tetap fokus pada Masjid Al-Luqman (bukan aplikasi umum/multi-tenant).
- Pola kerja bertahap: 1 issue dalam satu waktu, laporkan dengan bukti konkret.
