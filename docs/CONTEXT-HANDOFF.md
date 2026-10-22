# CONTEXT HANDOFF — Proyek "Masjid Archive"
> **Terakhir diperbarui**: 22 Oktober 2026  
> **Status**: **AKTIF — FASE REDESIGN V3: PORTAL TRANSPARANSI PUBLIK & DKM WORKSPACE (Branch: feature/portal-transparansi-publik)**

---

## 1. TUJUAN UTAMA PROJECT
Aplikasi web arsip & manajemen keuangan digital untuk **DKM Masjid Al-Luqman** (Kel. Soklat, Kec. Subang).  
**Tujuan**: 
1. **Dunia Publik (Tanpa Login)**: Memberikan wajah publik yang ramah, hangat, dan transparan bagi jamaah & donatur (Lobi saldo 3 pilar kas, widget cek infaq mandiri, kanal rekening/QRIS resmi DKM, unduh buletin PDF).
2. **Dunia Staf DKM (Login)**: Ruang kerja operasional aman bagi pengurus (Unggah nota/foto buku kas fisik, ekstraksi vision-LLM Gemini, review side-by-side, manajemen buku besar bank/tunai, serta administrasi hak akses).
3. **Standar Desain**: Menerapkan pedoman `frontend-design` dari Anthropic guna mengeliminasi template AI klise (SaaS-card kit, palet generik, label kaku) dan menonjolkan identitas khas Masjid Al-Luqman.

---

## 2. KONDISI PROJECT SAAT INI
- **INISIASI TRANSFORMASI UI/UX V3 (22 Oktober 2026)**:
  - Branch aktif: `feature/portal-transparansi-publik`.
  - Terpasang skill `frontend-design` dari repository resmi Anthropic (`anthropics/skills`).
  - Audit desain mengidentifikasi ~75% kemiripan dengan template SaaS AI generik; disusun matriks anti-AI tropes dan rencana 3 fase eksekusi:
    - **Fase 1 (Selesai - Commit a94fbbf)**: Gerbang Keamanan & Alur Autentikasi (`Akses Pengurus`, `/pending` approval state, router pasca-login).
    - **Fase 2 (Selesai - Commit 0cb0c20)**: Halaman Depan Publik (`/`) berkarakter masjid, saldo kas 3 pilar, widget pencarian infaq mandiri, dan kanal rekening resmi/QRIS DKM.
    - **Fase 3 (Selesai - Commit ae76cf9 & update)**: Penataan rute navigasi `AppShell`: publik hanya melihat 4 menu terbuka (`Beranda`, `Donatur`, `Pengeluaran`, `Cari`), sedangkan staf DKM mendapatkan menu kerja internal (`Unggah`, `Dashboard`, `Keuangan`).

- **SELURUH FITUR V1–V10 SELESAI 100% (PROJEK TAMAT / FEATURE-COMPLETE)**:
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
  - **V10 (Issue #068, #069, #070, #071, #072 / F-027 — Selesai Penuh)**:
    - Perapihan toolbar ringkasan kas: eliminasi tombol PDF direct-download yang redundan dan penggantian nama tombol menjadi "Cetak Laporan".
    - Dukungan Cetak & Ekspor Tahunan Penuh (`/laporan/cetak/tahunan`, `/api/reports/export/yearly/pdf`, `/api/reports/export/yearly/excel`).
    - Penyelarasan dinamis: mode Mingguan mencetak rekap bulanan, mode Tahunan mencetak rekap 12 bulan penuh.
    - Sinkronisasi kelengkapan berkas PDF Tahunan: mencakup Rekapitulasi 12 Bulan dan Rincian Transaksi Kas Multi-Halaman secara lengkap, 100% konsisten dengan pratinjau cetak web (Issue #069).
    - Pencegahan pengulangan total table footer (`<tfoot>`) di setiap lembar cetak printer multi-halaman (Issue #069).
    - Desain PDF tahunan profesional 2-bagian: Halaman 1 sebagai Resume Eksekutif Mading (Kop, 4 Kartu Saldo, Rekap 12 Bulan, Tanda Tangan), Halaman 2+ sebagai Lampiran Buku Besar Mutasi Transaksi Kas (Issue #070).
    - Tombol tunggal aksi cetak di `PrintActionBar`: hanya menyisakan satu tombol jelas "Cetak Laporan" dengan alur otomatis PDF resmi dan eliminasi tombol browser ganda yang membingungkan (Issue #071).
    - Refaktor Lampiran PDF Multi-Halaman Lega (`drawLedgerTable` di `lib/export-pdf.ts`): paginasi dinamis otomatis (25–30 baris/halaman), font 8.5pt, baris 20pt, word-wrap tanpa truncate "…", header berulang, baris TOTAL tunggal di akhir, dan border grid pemisah baris (#c2c9bb, 0.7pt) pada rectangle agar tidak tertimpa latar belakang (Issue #072).
- **PENGUATAN AUDIT QA & HARDENING SISTEM (12 Oktober 2026 — Selesai & Pushed to Main)**:
  - **Sole Admin Lockout Protection (`app/api/users/route.ts`)**: Pencegahan mutasi/pencabutan hak admin terakhir di database dengan atomic check di dalam `prisma.$transaction`.
  - **Server-Side Validation Ketat Transaksi (`app/api/transactions/[id]/route.ts`)**: Validasi angka `amount` finite `> 0`, `type` (`"pemasukan"` | `"pengeluaran"`), dan `category` terdaftar di `EXPENSE_CATEGORIES`.
  - **Sanitasi Pencarian Uploader Null (`app/cari/page.tsx`)**: Fallback `(report.uploadedBy.name ?? "")` mencegah query `"null"` mencocokkan uploader tanpa nama.
  - **Standardisasi Waktu UTC**: Validasi hari Jumat `app/api/reports/route.ts` (`getUTCDay() === 5`) dan derivasi periode `lib/derive-period.ts` (`getUTCFullYear`, `getUTCMonth`, `getUTCDate`) menghilangkan potensi pergeseran tanggal akibat timezone server.
  - **Ketahanan Konkurensi Donatur (`lib/donor-service.ts`)**: Penanganan Prisma `P2002` (unique constraint) dengan fallback otomatis ke `findUnique` saat dua transaksi membuat donatur baru bersamaan.
  - **Modul Validasi Berkas Terpadu (`lib/file-validation.ts`)**: Validasi ekstensi & MIME (JPG, JPEG, PNG, WEBP, PDF, XLSX, XLS), batas ukuran 10 MB (tolak HTTP 413), dan sanitasi nama berkas Supabase Storage `[a-zA-Z0-9._-]` dengan prefix `randomUUID()`.
  - **Optimasi Tooling Linter**: Penambahan `"node_modules/**"` ke `globalIgnores` di `eslint.config.mjs` mempercepat linting ~25%.
  - **Otomasi Pengujian**: Penambahan unit script `scripts/test-audit-hardening.ts` (15/15 lulus) dan `scripts/test-file-validation.ts` (10/10 lulus).
- **PENGUATAN KEAMANAN & OTORISASI RBAC 3-TIER (Selesai)**:
  - **Audit & Pengetatan RBAC**: Mengganti pemeriksaan permisif `if (!session)` dengan sistem otorisasi 3-Tier yang ketat: Jamaah (`null` / Guest umum), Bendahara (`BENDAHARA`), Administrator (`ADMIN` / Ketua DKM).
  - **Helper Terpusat (`lib/auth-guard.ts`)**: `isStaff(session)` untuk hak operasional (unggah, ekstraksi AI, verifikasi, edit donatur & kategori) dan `isAdmin(session)` untuk wewenang tertinggi (kelola pengguna & hapus laporan).
  - **Pengetatan Seluruh Handler Mutasi (`app/api/`)**: Aksi `DELETE /api/reports/:id` dikunci eksklusif `ADMIN` (403 untuk lainnya); seluruh aksi mutasi `POST`/`PATCH`/`DELETE` lainnya dikunci untuk `isStaff`.
  - **Penyembunyian Transaksi Draf**: Endpoint `GET /api/reports/[id]/transactions` dan Server Component `app/laporan/[id]/page.tsx` mengunci transaksi belum terverifikasi (`isVerified: false`) khusus bagi staf (`isStaff`).
  - **Hierarki Task-Centered Navigasi & Smart Redirect Pasca-Login (Masukan Mentor PKL)**: Bagi staf (`ADMIN`/`BENDAHARA`), menu navigasi **"Unggah"** diposisikan di urutan paling atas (#1) di sidebar desktop dan bilah navigasi mobile dengan tampilan standar yang seragam dengan menu lainnya. Disediakan pula endpoint `GET /auth/post-login` dan integrasi pada [components/auth-button.tsx](file:///d:/projects/masjid-archive/components/auth-button.tsx) serta [app/login/page.tsx](file:///d:/projects/masjid-archive/app/login/page.tsx) yang secara cerdas me-redirect staf langsung ke `/unggah` sesaat setelah login, tanpa mengubah akses publik/jamaah yang tetap mendarat di `/`.
  - **Proteksi Data Publik**: Mengganti seluruh query `include: { attachments: true, uploadedBy: true }` dengan `select` eksplisit pada `GET /api/reports`, `GET /api/reports/[id]`, serta Server Component (`app/page.tsx`, `app/cari/page.tsx`, `app/laporan/[id]/page.tsx`) untuk mencegah kebocoran JSON mentah LLM Gemini (`extractionRawResponse`), `extractionError`, serta alamat email pengunggah ke publik tanpa login.
  - **Pembersihan Total Legacy Auth**: Menghapus dependensi `iron-session`, berkas `lib/session.ts`, dan endpoint usang `app/api/auth/login` serta `app/api/auth/logout`.
- **F-028 / Issue #073 — Tambah Baris Transaksi Manual Saat Review Ekstraksi (Selesai Penuh & Teruji)**:
  - Mitigasi baris transaksi kas yang terlewat oleh Vision-LLM atau dokumen/spreadsheet tanpa harus ekstrak ulang dari nol.
  - Field additive model `Transaction`: `isManual Boolean @default(false)` dan `createdById String?` (relasi opsional ke `User`).
  - Endpoint baru `POST /api/attachments/:id/transactions`: dikunci staf (`isStaff`), validasi nominal > 0, tipe (`pemasukan` | `pengeluaran`), tanggal ISO, keterangan max 500 karakter, kategori terdaftar (khusus pengeluaran), dan nama donatur raw (khusus pemasukan).
  - Menghasilkan baris draf (`isVerified: false`, `isManual: true`), mempertahankan prinsip "satu pintu masuk" (bendahara tetap meninjau & mengonfirmasi sebelum masuk kas resmi).
  - Preservasi baris manual pada ekstrak ulang: opsi `Simpan Lama & Tambah Draf` (`replaceVerified: false`) mempertahankan baris manual yang belum diverifikasi (`isVerified: false, isManual: false` dihapus). Opsi `Reset & Ekstrak Ulang` (`replaceVerified: true`) menghapus seluruh baris dengan peringatan dinamis di dialog konfirmasi (`manualCount > 0`).
  - Komponen UI: Tombol `+ Tambah Baris Transaksi` dengan border dashed di `TransactionReviewPanel` (tampil saat ekstraksi selesai, termasuk jika hasil AI 0 baris), form inline dialog lengkap, serta badge visual biru muda `Manual` pada baris transaksi manual.
- **F-033 / Issue #078 — Pemantauan Posisi Kas & Perbendaharaan: Kas Fisik vs Kas Bank / Digital, Mutasi Internal & Rekonsiliasi Saldo Awal (Selesai Penuh & Teruji)**:
  - **Pemisahan Kas Fisik vs Kas Bank / Digital**: Field additive `paymentMethod String @default("TUNAI")` di model `Transaction`. Menandai uang kas fisik di brankas/tromol (`TUNAI`) vs rekening bank BSI & infak QRIS (`BANK`).
  - **Pencatatan Mutasi Kas Internal (`TreasuryTransfer`)**: Model baru untuk mencatat pergeseran dana internal (Setor Tunai ke Bank vs Tarik Tunai ke Brankas) tanpa mengubah total kekayaan kas masjid (prinsip konservasi saldo).
  - **Rekonsiliasi Saldo Awal Kas Fisik (`lib/treasury.ts`)**: Fungsi `getTreasuryBaselineCashBalance()` menyelaraskan saldo kas fisik awal dengan laporan mingguan terverifikasi terakhir (`latestReport.finalBalance - netCashTxUpToLatest`). Menjamin saldo Kas Fisik dan Total Kas di `/keuangan` persis sama dengan Saldo Kas Terkini di Dashboard (Rp 1.060.000).
  - **Backend API Perbendaharaan (`app/api/treasury/`)**:
    - `GET /api/treasury`: Ringkasan saldo kas real-time, saldo awal baseline kas fisik, rasio likuiditas persentase, alokasi pos belanja per kanal kas, serta riwayat mutasi internal.
    - `POST /api/treasury/transfers`: Pencatatan mutasi internal kas antar-kanal (khusus staf DKM).
    - `DELETE /api/treasury/transfers/:id`: Pembatalan catatan mutasi kas internal (khusus staf DKM).
    - `PATCH /api/transactions/:id/payment-method`: Pengubahan kanal kas transaksi (TUNAI ↔ BANK) oleh staf DKM.
  - **Halaman Khusus Pemantauan Kas (`/keuangan`)**:
    - Rute publik `/keuangan` (`app/keuangan/page.tsx` & `components/treasury-client.tsx`) dengan 3 kartu saldo utama (Total Kas, Kas Fisik lengkap dengan rincian saldo awal, Kas Bank), rasio likuiditas progress bar dwi-warna, dan 3 tab analitik (Alokasi Belanja per Kanal, Mutasi Internal, Riwayat Transaksi).
    - Dialog modal interaktif bagi staf DKM untuk mencatat setor tunai ke bank atau tarik tunai operasional.
  - **Pembaruan Panel Review Transaksi (`components/transaction-review-panel.tsx`)**:
    - Badge visual kanal kas (`Banknote` untuk Kas Tunai, `Building2` untuk Bank/QRIS).
    - Tombol mikro cepat `Ubah` bagi staf login untuk membalik kanal kas transaksi secara instan.
    - Pilihan kanal kas saat mengedit transaksi dan saat menambah baris transaksi manual.
  - **Integrasi Navigasi & AppShell (`components/app-shell.tsx`)**: Menu "Keuangan" berikon `Wallet` di sidebar desktop dan navigasi mobile.
  - **Otomasi Pengujian Presisi (`scripts/test-treasury-cash-bank.ts`)**: 27 uji coba otomatis (RBAC staf, formula matematika likuiditas, validasi input transfer, skema DB, serta rekonsiliasi saldo kas fisik dengan Dashboard) lulus 100% (27/27 passed).
- **F-034 / Issue #079 — Kontrol Paginasi Tabel & Skalabilitas Daftar Data Masif (Selesai Penuh & Teruji)**:
  - **Komponen Standar Paginasi (`components/ui/pagination-controls.tsx`)**: Komponen modular reusable dengan kontrol First Page, Previous, Next, Last, nomor halaman dengan smart ellipsis logic, pemilih ukuran baris (10, 25, 50, 100), dan status range data responsif.
  - **Paginasi Transaksi Pengeluaran (`components/expenses-client.tsx`)**: Default 25 item per halaman untuk tabel desktop dan kartu mobile, dengan logika render-time state check untuk reset otomatis ke halaman 1 saat filter atau sorting diubah tanpa memicu cascading render.
  - **Paginasi Daftar Donatur (`components/donors-client.tsx`)**: Default 25 item per halaman dengan perhitungan peringkat `#rank` global yang kontinu lintas halaman (`(safePage - 1) * pageSize + idx + 1`).
  - **Paginasi Perbendaharaan / Treasury (`components/treasury-client.tsx`)**: Paginasi Tab 2 (Mutasi Internal, size 10) dan Tab 3 (Transaksi Kanal Kas, size 15) dengan safe page clamping.
  - **Otomasi Pengujian Presisi (`scripts/test-pagination.ts`)**: 22 uji coba otomatis (matematika pembagian halaman, index array slice, clamping batas atas/bawah, elipsis deretan tombol halaman, integrasi database query limit/offset, dan konsistensi penomoran urut donatur) lulus 100% (22/22 passed).
- Status kode: `tsc --noEmit` lolos 0 error, `npm run lint` lolos 0 error, seluruh suite test otomatis (150+ automated test passed: 22 pagination + 27 treasury + 12 navigation/redirect + 64 auth guards + 15 QA hardening + 10 file validation).
- **Status Migrasi Basis Data**: Bersih dan mutakhir (`npx prisma migrate status` up to date, 7 migrasi resmi tercatat dan tersinkronisasi di tabel `_prisma_migrations`).

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
- `lib/file-validation.ts` — modul bersama validasi berkas upload (ekstensi, MIME match, batas ukuran 10 MB, sanitasi nama berkas & path storage)
- `lib/derive-period.ts` — helper penentuan tahun, bulan, dan pekan ke-N berbasis komponen UTC murni
- `lib/donor-matching.ts` — `normalizeDonorName()`, `isAnonymousDonor()`, `escapeRegex()`, daftar `DONOR_PREFIXES` dan `ANONYMOUS_PATTERNS`
- `lib/donor-service.ts` — `matchAndAssignDonor(txType, rawInput)`, shared logic konfirmasi & edit donatur dengan ketahanan race condition (fallback Prisma P2002)
- `lib/expense-categories.ts` — konstanta kategori pengeluaran kas (operasional, honor, sosial, pembangunan, konsumsi, administrasi, lainnya) & sistem warna badge
- `lib/auth.ts` — konfigurasi authOptions NextAuth (JWT strategy, sync role DB ke session)
- `lib/auth-guard.ts` — helper otorisasi `isAdmin(session)` dan `isStaff(session)`
- `scripts/test-auth-guards.ts` — skrip automated unit & simulation test untuk seluruh role guard
- `scripts/test-audit-hardening.ts` — skrip automated unit test validasi transaksi, sole admin lockout, uploader null, dan timezone UTC
- `scripts/test-file-validation.ts` — skrip automated test validasi ekstensi, MIME mismatch, batas 10 MB, dan sanitasi nama berkas
- `scripts/test-manual-transaction.ts` — skrip automated test pemanggilan route handler sungguhan untuk penambahan baris manual, RBAC, validasi payload, isolasi publik, dan deteksi duplikat (21/21 lulus)

### API Routes (`app/api/`):
- `attachments/[id]/transactions/route.ts` — POST tambah baris transaksi manual pada lampiran berstatus done (khusus staf: ADMIN & BENDAHARA, isManual=true, createdById tercatat)
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
- `Transaction`: type (pemasukan/pengeluaran), amount, description, transactionDate, `category` (nullable String untuk pengeluaran, default null), `donorNameRaw`, `donorId` (nullable), `isVerified` (default false), `isManual` (Boolean, default false), `createdById` (nullable String, FK ke User), `verifiedById`, `verifiedAt`. Relasi ke Attachment & Report: `ON DELETE RESTRICT` (konsisten, disengaja)
- `Donor`: `name` (canonical), `normalizedName` (UNIK — kunci fuzzy matching), `contact`. `totalContribution` DIHITUNG ON-THE-FLY (tanpa cache)

### Aturan penting yang JANGAN dilanggar:
- Transaction `isVerified=true` TIDAK BOLEH terhapus otomatis oleh proses apa pun.
- Transaction `isManual=true` (draf transaksi manual staf) TIDAK BOLEH terhapus oleh proses ekstrak ulang biasa (`replaceVerified=false`).
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
- **V10.5 (Issue #073 / F-028)**: Tambah baris transaksi manual saat review ekstraksi, endpoint `POST /api/attachments/:id/transactions`, preservasi baris manual saat ekstrak ulang, dan warning alert di modal dialog konfirmasi.

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
- Enum kategori pengeluaran disimpan sebagai hardcoded shared config di `lib/expense-categories.ts`, bukan tabel database relasional terpisah, guna menjaga kesederhanaan skema dan kemudahan deployment sistem kas.
- Transaksi tanpa kategori disimpan sebagai `null` di database dan disajikan ramah pengguna sebagai "Tidak Dikategorikan".
- Rincian Infaq Anonim menggunakan dialog/modal responsif dengan format tabel/list ledger rapi, tanpa membuat entity `Donor` palsu di database.
- Proteksi Ekstrak Ulang: Jika berkas sudah memiliki transaksi terverifikasi (`verifiedCount > 0`), tombol "Ekstrak Ulang" wajib memicu dialog konfirmasi (`AlertDialog`). Opsi eksplisit yang disediakan adalah:
  1. `Reset & Ekstrak Ulang` (mengirim `{ replaceVerified: true }` ke API untuk menghapus transaksi lama sebelum memasukkan hasil baru).
  2. `Simpan Lama & Tambah Draf` (mengirim `{ replaceVerified: false }`, hanya menghapus unverified).
  Hal ini mencegah insiden duplikasi nilai kas ganda akibat konfirmasi berulang dari ekstrak ulang.
- Proteksi Baris Manual pada Ekstrak Ulang (Issue #073 / F-028):
  - Sistem tetap "satu pintu masuk": tidak ada form input transaksi liar tanpa konteks laporan. Tambah baris manual HANYA bisa dilakukan dalam konteks review lampiran tertentu (`attachmentId` dan `reportId` wajib, `extractionStatus === "done"`).
  - Baris manual baru selalu berstatus draf (`isVerified: false`, `isManual: true`), wajib ditinjau dan dikonfirmasi sebelum dihitung di saldo kas resmi.
  - Pada "Ekstrak Ulang" dengan opsi `Simpan Lama & Tambah Draf` (`replaceVerified: false`), baris manual unverified DIPERTAHANKAN (`isVerified: false, isManual: false` yang dihapus) agar bendahara tidak kehilangan input manual yang telah diketik.
  - Pada opsi `Reset & Ekstrak Ulang` (`replaceVerified: true`), seluruh transaksi lampiran (termasuk manual) direset, dengan peringatan jumlah baris manual di modal konfirmasi.
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
     - `app/laporan/[id]/page.tsx`: Menyediakan toolbar ekspor terpadu 2 tombol: "Cetak Laporan" (ke pratinjau A4 dengan unduh PDF) dan "Unduh Excel" (unduh .xlsx), selaras dengan toolbar Dashboard.
3. **Penguatan Keamanan, Otorisasi RBAC 3-Tier, dan Proteksi Data Publik (Selesai)**:
   - **Audit & Eliminasi Celah Role Null**: Memastikan pengguna login Google tanpa penetapan role (`null`) tidak dapat melakukan mutasi data keuangan atau melihat draf transaksi yang belum diverifikasi.
   - **Helper Otorisasi Terpusat (`lib/auth-guard.ts`)**: `isStaff(session)` memvalidasi wewenang `ADMIN` dan `BENDAHARA`, sementara `isAdmin(session)` memvalidasi wewenang eksklusif `ADMIN`.
   - **Pengetatan Endpoint & UI**: Aksi hapus laporan kas (`DELETE /api/reports/:id`) dan tombol hapus di UI hanya dapat diakses oleh Administrator. Aksi mutasi operasional lainnya hanya untuk staf.
   - **Proteksi Data Publik**: Query publik menggunakan `select` eksplisit, menyembunyikan dump respons mentah vision-LLM (`extractionRawResponse`), `extractionError`, serta email pengunggah dari publik tanpa login.
   - **Pembersihan Total Legacy Auth**: Modul `iron-session`, berkas `lib/session.ts`, dan endpoint login/logout lama dihapus permanen.
4. **Fase V9: Filter Periode Fiskal & Ekspor Terpadu Tanpa Modal (Issue #067 — Selesai Penuh)**:
   - Filter kalender terpadu (Bulan & Tahun) di dashboard.
   - Mode Mingguan memplot pekan Jumat spesifik bulan terpilih, Mode Tahunan memplot 12 bulan di desktop & semester di mobile.
   - Tombol Cetak A4, PDF, dan Excel langsung di toolbar dashboard.
5. **Fase V10: Cetak & Ekspor Tahunan Penuh (Issue #068–#072 — Selesai Penuh)**:
   - Halaman cetak laporan tahunan 12 bulan penuh (`/laporan/cetak/tahunan`), ekspor PDF vektor multi-halaman A4, dan ekspor spreadsheet Excel.
   - Refaktor tabel buku besar multi-halaman lega (`drawLedgerTable`) dan perapihan aksi cetak satu tombol.
6. **Pembaruan QA Audit & Hardening Sistem (12 Oktober 2026 — Selesai Penuh)**:
   - Proteksi *Sole Admin Lockout* di `app/api/users/route.ts` via `prisma.$transaction`.
   - Server-side validation ketat transaksi di `app/api/transactions/[id]/route.ts`.
   - Standardisasi waktu UTC pada `app/api/reports/route.ts` dan `lib/derive-period.ts`.
   - Modul validasi upload terpadu `lib/file-validation.ts` (10 MB per berkas, HTTP 413, sanitasi nama berkas Supabase).
   - Ketahanan konkurensi donatur `lib/donor-service.ts` (Prisma error P2002 fallback ke `findUnique`).
   - Sanitasi query uploader null di `app/cari/page.tsx` dan optimasi ESLint `globalIgnores`.
   - Seluruh uji regresi otomatis lolos 100% (80 test passed).
7. **F-028: Tambah Baris Transaksi Manual Saat Review Ekstraksi (Issue #073 — Selesai Penuh & Teruji)**:
   - Skema additive `isManual` & `createdById` pada model `Transaction`.
   - Endpoint `POST /api/attachments/:id/transactions` dengan validasi ketat & otorisasi staf (`isStaff`).
   - Logika preservasi baris manual pada endpoint ekstraksi (`deleteMany` hanya `isVerified: false, isManual: false`).
   - Komponen UI: dialog form tambah baris manual & tombol "+ Tambah Baris Transaksi" di `TransactionReviewPanel`, peringatan baris manual pada dialog konfirmasi `ExtractButton`, serta badge `Manual` pada baris transaksi.
   - Test suite baru `scripts/test-manual-transaction.ts` lolos 100% (21/21 lulus: skema, otorisasi handler asli, validasi payload, isolasi publik, preservasi ekstrak ulang, lifecycle DB, dan deteksi duplikat). Total test suite proyek mencapai 101 test passed.
8. **F-029: Kendali Visibilitas Menu Unggah Berbasis Role & Notifikasi Akses Terbatas (Issue #074 — Selesai Penuh)**:
   - Menu `Unggah` di sidebar desktop dan navigasi mobile (`components/app-shell.tsx`) kini dikendalikan oleh `isStaff(session)`, sehingga disembunyikan secara elegan bagi akun Jamaah (`role: null`) dan pengunjung publik.
   - Penangkapan parameter `?error=forbidden` pada Dashboard (`app/dashboard/page.tsx` & `components/dashboard-client.tsx`) ketika pengguna tanpa wewenang staf dialihkan oleh middleware/proxy.
   - Komponen banner notifikasi informatif di Dashboard dengan penjelasan ramah peran akun serta tombol tutup (*dismiss*) yang membersihkan URL peramban via `window.history.replaceState` tanpa *page reload*.
9. **F-030: Kompresi Gambar Otomatis Client-Side Sebelum Unggah Laporan Kas (Issue #075 — Selesai Penuh)**:
   - Modul kompresi terpusat `lib/image-compression.ts` menggunakan HTML5 Canvas API dan konversi format WebP (`quality: 0.82`) dengan batas dimensi maksimal 1920px.
   - Mengurangi ukuran foto kamera HP dari 3–8 MB menjadi hanya ~200–400 KB (efisiensi 85%–90%), mengamankan kuota gratis 1 GB Supabase Storage hingga muat 3.000–5.000 lembar dokumen (setara 15–25 tahun).
   - Penanganan berkas non-gambar (PDF, Excel) dilewatkan secara utuh (*pass-through*), dan dilengkapi mekanisme proteksi *graceful fallback* jika proses kompresi di peramban mengalami kegagalan.
   - Integrasi langsung pada form unggah laporan (`app/unggah/page.tsx`) dengan badge perbandingan ukuran transparan ("3.5 MB → 310 KB (Hemat 91%)") dan tombol tambah lampiran (`components/add-attachment-button.tsx`).
   - Dukungan eksplisit MIME `image/webp` pada ekstraksi Vision-LLM (`lib/extract-transactions.ts`).
   - Otomatisasi pengujian komprehensif `scripts/test-image-compression.ts`.
10. **F-031: Ekstraksi Vision-LLM Context-Aware Berbasis Periode Pekan Laporan (Issue #076 — Selesai Penuh)**:
    - Injeksi parameter `targetReportDate` ke fungsi `extractTransactionsFromFile` via `POST /api/attachments/:id/extract`.
    - Prompt dinamis yang menyertakan rentang periode pekan berjalan (dari Jumat sepekan sebelumnya hingga Jumat target laporan).
    - Logika pembatas garis saldo penutup (*Closing Balance Boundary*): secara cerdas mendeteksi baris saldo penutup tanggal target (misal `TOTAL KAS MESJID TGL 25-7-2025 Rp 850.000`) dan otomatis memisahkan catatan transaksi lanjutan di bawahnya yang merupakan milik pekan berikutnya (seperti 1 Agustus 2025).
    - Sepenuhnya *backward-compatible* dengan dokumen satu pekan biasa dan berkas non-gambar.
11. **F-032: Penyelarasan Responsivitas Tampilan Mobile & Ergonomi Layar Sentuh Multi-Perangkat (Issue #75 — Selesai Penuh)**:
    - Penyesuaian padding adaptif global `PageShell` (`px-4 sm:px-6 md:px-8 lg:px-10`, `py-5 sm:py-7 md:py-10`), memberikan margin tepi aman 16px di layar ponsel tanpa mengurangi kelegaan desktop.
    - Penyelarasan bottom bar navigasi mobile `AppShell` untuk menangani hingga 7 menu staf secara ergonomis tanpa clipping/clutter.
    - Reorganisasi baris tabel ekstraksi transaksi `TransactionRow` agar badge status dan tombol aksi tersusun rapi tanpa overlap di resolusi 360px–414px.
    - Penataan kartu 4 ringkasan saldo detail laporan kas menjadi `grid-cols-2 sm:grid-cols-4` agar seluruh nilai nominal angka tetap utuh dan terbaca.
    - Harmonisasi kartu pengeluaran, donatur, dan layout dashboard di perangkat mobile.

---

## 15. KONTEKS LAIN YANG PENTING
- Selalu sertakan penjelasan singkat yang jelas mengenai fungsi perintah terminal/git.
- Reza selalu melakukan review manual sebelum commit/push.
- Scope tetap fokus pada Masjid Al-Luqman (bukan aplikasi umum/multi-tenant).
- Pola kerja bertahap: 1 issue dalam satu waktu, laporkan dengan bukti konkret.
