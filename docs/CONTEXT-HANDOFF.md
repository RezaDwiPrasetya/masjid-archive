# CONTEXT HANDOFF — Proyek "Masjid Archive"
> **Terakhir diperbarui**: 27 Oktober 2026  
> **Status**: **PRODUKSI / FEATURE-COMPLETE — FASE V15.0 (Branch: main)**  
> **Versi Rilis**: `0.16.0` (41 Fitur F-001 s/d F-041 Selesai Penuh 100%)

---

## 1. TUJUAN UTAMA PROJECT
Aplikasi web arsip & manajemen keuangan digital untuk **DKM Masjid Al-Luqman** (Kel. Soklat, Kec. Subang).  
**Tujuan**: 
1. **Dunia Publik (Tanpa Login)**: Memberikan wajah publik yang ramah, hangat, dan transparan bagi jamaah & donatur (Portal Beranda kas terverifikasi, posisi kas fisik vs bank/QRIS, alokasi pos belanja riil, widget cek infaq mandiri, kanal rekening resmi DKM, unduh buletin PDF).
2. **Dunia Staf DKM (Login)**: Ruang kerja operasional aman bagi pengurus (Cockpit analitik kas pengurus, unggah nota/foto buku kas fisik, ekstraksi vision-LLM Gemini context-aware, review transaksi side-by-side, penambahan baris manual, manajemen kas tunai vs perbankan & mutasi internal di `/keuangan`, serta administrasi hak akses di `/pengguna`).
3. **Standar Desain**: Menerapkan pedoman `frontend-design` dari Anthropic guna mengeliminasi template AI klise (SaaS-card kit generik, palet generik, label kaku) dan menonjolkan identitas khas Masjid Al-Luqman berbasis tema *Deep Mosque Emerald* (`#0e3824`).

---

## 2. KONDISI PROJECT SAAT INI
- **STATUS REPOSITORI & DEPLOYMENT**:
  - Branch aktif: `main` (sinkron 100% lokal dengan GitHub `RezaDwiPrasetya/masjid-archive`).
  - Live di Vercel Production dengan domain terhubung resmi.
  - Typecheck (`tsc --noEmit`) 0 error, Linter (`npm run lint`) 0 error, dan 150+ automated unit & simulation tests passed.
  - Status migrasi Prisma: 7 migrasi resmi tersinkronisasi bersih di tabel `_prisma_migrations`.

- **ARSITEKTUR DUA DUNIA: PORTAL BERANDA PUBLIK VS COCKPIT DASHBOARD PENGURUS**:
  - **Beranda (`/`) — Portal Transparansi Kas Umat (Publik / Jamaah)**:
    - Desain human-centric, hangat, dan ramah jamaah tanpa grafik instrumen teknis yang membingungkan.
    - Menyajikan: Salam takzim & identitas Masjid Al-Luqman, ikrar amanah pengelolaan kas, saldo terkonsolidasi (kas tunai brankas vs rekening bank/QRIS), kartu naratif alokasi belanja kas umat bulan berjalan, widget pencarian riwayat infaq mandiri tanpa login, informasi rekening bank syariah & QRIS resmi, serta arsip pindaian buku kas mingguan.
  - **Dashboard (`/dashboard`) — Cockpit Analitik & Instrumen Kerja Pengurus (Staf DKM: Bendahara & Admin)**:
    - Diproteksi ketat oleh RBAC (`isStaff(session)`). Pengguna publik/tamu yang mengakses `/dashboard` otomatis dialihkan ke `/` dengan banner notifikasi izin akses ramah pengguna.
    - Dark Green Hero Card: Saldo terverifikasi, tanggal laporan mutakhir, dan tombol aksi pintasan (`+ Unggah Laporan Baru` dan `Lihat Portal Publik`).
    - Visualisasi tren arus kas masuk vs keluar berbasis grafik batang Recharts (mode Mingguan & Tahunan).
    - Tombol administratif tanpa modal: **Cetak Laporan (A4)** untuk mading masjid dan **Ekspor Excel (.xlsx)**.
    - Kartu alokasi belanja analitik yang reaktif sinkron dengan filter periode aktif.
    - Seksi Antrean Laporan Tertunda (*Pending Reports Queue*) untuk memantau berkas yang belum diekstrak atau diverifikasi.
  - **Smart Redirection & Navigasi Terpadu**:
    - Router pasca-login (`app/auth/post-login/route.ts`) secara cerdas mengarahkan staf langsung ke `/dashboard`.
    - Staf yang membuka alamat utama `/` otomatis dialihkan ke `/dashboard`, kecuali jika sengaja mengeklik tautan *"Lihat Beranda Publik"* (`/?view=public`) di footer sidebar.
    - Navigasi Staf DKM di sidebar: `Dashboard` (`/dashboard`), `Unggah` (`/unggah`), `Keuangan` (`/keuangan`), `Donatur` (`/donatur`), `Pengeluaran` (`/pengeluaran`), `Cari` (`/cari`), dan `Pengguna` (`/pengguna` khusus Admin).
    - Navigasi Publik: `Beranda` (`/`), `Donatur` (`/donatur`), `Pengeluaran` (`/pengeluaran`), dan `Cari` (`/cari`).

- **SELURUH FITUR V1–V16 SELESAI 100% (41 FITUR F-001 s/d F-041 TUNTAS)**:
  - **V1–V2**: Multi-format upload (JPG, PNG, PDF, Excel) & arsip berjenjang tahun/bulan/pekan.
  - **V3**: Google SSO NextAuth & Role-based Access Control 3-Tier (Admin, Bendahara, Jamaah).
  - **V4**: Pipeline ekstraksi multimodal vision-LLM (Gemini API) + fallback model cadangan + review & konfirmasi transaksi manual + rekonsiliasi kas.
  - **V5**: Financial Intelligence (Grafik tren kas Jumat/bulanan via raw SQL, entity Donor fuzzy matching, deteksi duplikat, pembatalan verifikasi, isolasi data publik).
  - **V6**: Transparansi infaq anonim publik, ekstraksi PDF multimodal, direct parser Excel tabular, ekspor cetak PDF A4 mading & Excel.
  - **V7**: Rekapitulasi & transparansi pengeluaran per 7 kategori baku di `/pengeluaran` & filter chips.
  - **V8**: Filter periode waktu terpadu (`PeriodFilterBar`) di halaman Donatur & Pengeluaran.
  - **V9**: Filter periode fiskal kalender di dashboard & zero-modal export.
  - **V10**: Cetak & ekspor rekapitulasi tahunan penuh 12 bulan (PDF multi-halaman + Excel) dan penyatuan aksi cetak resmi.
  - **V11**: Penambahan baris transaksi manual saat review ekstraksi, proteksi menu unggah staf, kompresi gambar client-side WebP, ekstraksi vision-LLM context-aware, dan ergonomi mobile.
  - **V12**: Pemantauan posisi kas fisik vs kas digital & mutasi internal (`/keuangan`) serta kontrol paginasi tabel modular.
  - **V13**: Portal transparansi publik `/` dan konsolidasi arsitektur Beranda.
  - **V14**: Modern Collapsible Sidebar (72px/260px) berlatar siluet masjid, mobile fluid wave navigation, redesain pencarian arsip grid 4-kolom proporsional, dan alur unggah cepat.
  - **V15**: Penyatuan header halaman ke dalam *Dark Green Hero Card* (`#0e3824`), eliminasi teks eyebrow redundan, kanvas desktop seamless (tanpa top header putih), profil/notifikasi terintegrasi di footer sidebar, dan tema PWA Deep Mosque Emerald.

---

## 3. ARSITEKTUR / TEKNOLOGI
- **Framework**: Next.js (App Router) + TypeScript
- **ORM**: Prisma versi 5.22.0 — **DIKUNCI, JANGAN upgrade ke v6+** (prisma.config.ts di v6 lebih kompleks, pernah 2x menimbulkan masalah besar sebelumnya)
- **Database**: Vercel Postgres (native)
- **File Storage**: Supabase Storage, bucket `report-photos` — **SENGAJA provider terpisah dari database** (separation of concerns, keputusan sadar, bukan solusi sementara)
- **Auth & RBAC**: NextAuth.js (Auth.js) + `@auth/prisma-adapter`, Google OAuth Provider. Sesi berbasis `strategy: "jwt"` dengan sinkronisasi role dinamis ke database pada callback `jwt` dan `session`.
- **Authorization Guard**: Helper sentral di `lib/auth-guard.ts` (`isAdmin`, `isStaff`). Tiga tier role: `null` (Jamaah/Publik), `BENDAHARA` (Pengurus operasional), `ADMIN` (Ketua DKM/Administrator).
- **Next.js 16**: **WAJIB pakai `proxy.ts`** dengan fungsi bernama `proxy` (bukan middleware — `middleware.ts` deprecated, build gagal total kalau salah). Melindungi `/unggah` dan `/pengguna` berdasarkan peran token JWT.
- **NextAuth di Next.js 16**: Route handler di `app/api/auth/[...nextauth]/route.ts` **WAJIB dibungkus fungsi async** yang me-resolve `const params = await context.params; return nextAuthHandler(req, { params });` karena di Next.js 16 App Router `context.params` adalah Promise.
- **UI & Design Tokens**: 
  - Varian Base UI shadcn/ui.
  - Tema: *Deep Mosque Emerald* (`#0e3824`), aksen primary `#154212`, surface `#fafaf4`, surface-container `#ffffff`, outline `#c2c9bb`.
  - Font: Outfit (Google Fonts). Ikon: Lucide Icons.
  - Kanvas desktop seamless (`lg:pt-8`), top bar desktop disembunyikan (`lg:hidden`).
  - Sidebar: Floating modern collapsible (Mode Compact 72px & Expanded 260px) dengan persistensi `localStorage`.
- **Vision-LLM**: Google Gemini API (`@google/generative-ai`), free tier. Model utama `gemini-3.6-flash` dengan auto-fallback ke `gemini-3.5-flash` (timeout 25 detik via AbortController, trigger saat 503/429 dari model utama).
- **Chart**: Recharts via shadcn/ui Charts.
- **Client-Side Optimization**: HTML5 Canvas Image Compression ke format WebP (`quality: 0.82`, max 1920px), menghemat kuota storage 85%–90%.
- **Ekspor Dokumen**: Generator PDF server-side multi-halaman berbasis `pdf-lib` dan generator spreadsheet Excel berbasis `exceljs`.
- **Hosting**: Vercel Production.

---

## 4. STRUKTUR FILE PENTING

### Backend / Lib:
- `schema.prisma` — model User, Report, Attachment, Transaction (dengan category, paymentMethod, isManual, createdById), Donor, TreasuryTransfer, + model NextAuth.
- `lib/gemini.ts` — singleton GoogleGenerativeAI client.
- `lib/extract-transactions.ts` — ekstraksi vision-LLM context-aware berbasis rentang pekan laporan & closing balance boundary.
- `lib/treasury.ts` — agregasi posisi kas fisik vs kas bank/digital, mutasi internal, dan rekonsiliasi saldo awal kas fisik baseline.
- `lib/image-compression.ts` — modul utilitas kompresi foto kamera HP client-side menggunakan HTML5 Canvas API dan konversi format WebP.
- `lib/export-pdf.ts` — generator berkas resmi PDF A4 vektor multi-halaman untuk laporan bulanan & tahunan (Kop DKM, tabel ringkasan, buku besar mutasi, tanda tangan).
- `lib/period-filter.ts` — helper parsing parameter periode bulan/tahun dan pembuat filter relasi Prisma.
- `lib/file-validation.ts` — modul bersama validasi berkas upload (ekstensi, MIME match, batas ukuran 10 MB, sanitasi nama berkas & path storage).
- `lib/derive-period.ts` — helper penentuan tahun, bulan, dan pekan ke-N berbasis komponen UTC murni.
- `lib/donor-matching.ts` — normalisasi nama donatur, pola anonim/hamba Allah, regex escaping.
- `lib/donor-service.ts` — shared logic konfirmasi & pencocokan donatur dengan ketahanan race condition Prisma P2002.
- `lib/expense-categories.ts` — konstanta 7 kategori pengeluaran kas baku & sistem warna badge.
- `lib/auth.ts` — konfigurasi authOptions NextAuth (JWT strategy, sync role DB ke session).
- `lib/auth-guard.ts` — helper otorisasi `isAdmin(session)` dan `isStaff(session)`.

### API Routes (`app/api/`):
- `treasury/route.ts` — GET ringkasan saldo perbendaharaan real-time kas fisik vs bank, rasio likuiditas, alokasi pos, dan daftar mutasi.
- `treasury/transfers/route.ts` — POST pencatatan mutasi kas internal (Setor/Tarik Tunai) khusus staf DKM.
- `treasury/transfers/[id]/route.ts` — DELETE pembatalan mutasi kas internal khusus staf DKM.
- `transactions/[id]/payment-method/route.ts` — PATCH kanal kas transaksi (`TUNAI` ↔ `BANK`) khusus staf DKM.
- `attachments/[id]/transactions/route.ts` — POST tambah baris transaksi manual pada lampiran berstatus done (khusus staf, isManual=true).
- `attachments/[id]/extract/route.ts` — POST trigger ekstraksi AI context-aware pekan target (khusus staf).
- `reports/[id]/transactions/route.ts` — GET, filter isVerified berdasarkan role staf (publik → hanya isVerified=true, staf → semua termasuk draf).
- `transactions/[id]/route.ts` — PATCH (edit transaksi, category) + DELETE (hapus tx unverified) (khusus Staf).
- `reports/[id]/route.ts` — GET (publik, select aman) + DELETE (khusus ADMIN).
- `reports/export/monthly/pdf/route.ts` — GET unduh PDF A4 bulanan resmi.
- `reports/export/yearly/pdf/route.ts` — GET unduh PDF A4 tahunan resmi multi-halaman.
- `reports/export/yearly/excel/route.ts` — GET unduh Excel rekapitulasi tahunan 12 bulan.
- `users/route.ts` — GET, PATCH, DELETE manajemen akun dan peran pengguna (khusus ADMIN, atomic lockout protection).
- `transactions/[id]/confirm/route.ts` — POST, konfirmasi transaksi & assign donatur.
- `transactions/[id]/donor/route.ts` — PATCH edit nama donatur transaksi verified.
- `transactions/[id]/category/route.ts` — PATCH edit kategori pengeluaran.
- `transactions/[id]/unverify/route.ts` — POST batalkan verifikasi transaksi.
- `dashboard/trend/route.ts` — GET publik, agregasi tren mingguan & tahunan via raw SQL.
- `donors/route.ts`, `donors/[id]/route.ts` — GET publik.
- `donors/anonymous/transactions/route.ts` — GET publik rincian transaksi infaq tanpa nama.
- `expenses/route.ts` — GET publik agregasi pengeluaran per kategori.
- `expenses/transactions/route.ts` — GET publik rincian transaksi pengeluaran terverifikasi.
- `auth/[...nextauth]/route.ts` — Route handler NextAuth dengan wrapper Promise params.
- `auth/post-login/route.ts` — Smart redirection pasca-login (staf → `/dashboard`, publik → `/`).

### Frontend Pages & Components:
- `app/page.tsx` — Beranda Publik (Portal Transparansi Kas Umat, saldo terpadu, alokasi pos riil, pencarian infaq mandiri, kanal resmi DKM).
- `app/dashboard/page.tsx` + `components/dashboard-client.tsx` — Cockpit Analitik Pengurus (Dark Green Hero Card, tren Recharts, pending queue, zero-modal export).
- `app/keuangan/page.tsx` + `components/treasury-client.tsx` — Pemantauan Posisi Kas (Total Kas, Kas Fisik, Kas Bank, rasio likuiditas, mutasi internal modal dialog).
- `app/laporan/[id]/page.tsx` — Detail Laporan (Dark Green Hero Card, multi-dokumen viewer gambar/PDF/Excel, rekap kas, tab transaksi).
- `app/laporan/cetak/tahunan/page.tsx` & `bulanan/page.tsx` — Halaman Pratinjau Cetak Formal A4 Mading.
- `app/donatur/page.tsx` + `components/donors-client.tsx` — Daftar Donatur Publik & Modal Rincian Infaq Anonim.
- `app/donatur/[id]/page.tsx` — Profil Detail Donatur & riwayat kontribusi.
- `app/pengeluaran/page.tsx` + `components/expenses-client.tsx` — Transparansi Pengeluaran (KPI, alokasi progress bar, filter chips, tabel paginasi).
- `app/cari/page.tsx` — Pencarian Arsip Cerdas (Filter fluid multi-baris, ringkasan finansial bulanan, grid 4-kolom).
- `app/unggah/page.tsx` — Unggah Laporan (Drag-and-drop berkas, kompresi otomatis WebP, Date Picker terintegrasi, auto-redirect ke detail laporan).
- `app/pengguna/page.tsx` — Manajemen Pengguna (Dark Green Hero Card, KPI role cards, dialog ubah peran & hapus akun).
- `components/app-shell.tsx` — Layout AppShell global (Collapsible Sidebar 72px/260px desktop, footer profil staf & notifikasi, mobile fluid wave nav).
- `components/page-shell.tsx` — Layout wrapper global full-width responsif (`px-4 sm:px-6 md:px-8 lg:px-10`).
- `components/ui/pagination-controls.tsx` — Komponen universal navigasi tabel (First, Prev, Next, Last, ellipsis, items-per-page selector).
- `components/auth-error-banner.tsx` — Banner interaktif pembatasan hak akses staf yang dapat ditutup.
- `components/period-filter-bar.tsx` — Bar pemilih tahun & bulan dinamis beserta chip preset instan.
- `components/cashflow-trend-section.tsx` — Grafik tren arus kas & kartu alokasi pos belanja reaktif di Beranda publik.
- `components/transaction-review-panel.tsx` — State review transaksi, dropdown kategori, ubah kanal kas TUNAI/BANK, tombol tambah baris manual.

---

## 5. DATABASE / SCHEMA PENTING
Model utama dalam `schema.prisma`:
- `Report`: `reportDate` (wajib Jumat, unik), `year`/`month`/`weekOfMonth` (auto-derive), `uploadedById`, `initialBalance`/`finalBalance` (Decimal?, saldo rekonsiliasi kas fisik).
- `Attachment`: `fileType` (image/pdf/excel), `fileUrl`, `fileName`, `fileSize`, `extractionStatus` (not_extracted/processing/done/failed), `extractionModel`, `extractionRawResponse` (Json?), `extractionError`, `extractedAt`.
- `Transaction`: `type` (pemasukan/pengeluaran), `amount`, `description`, `transactionDate`, `category` (nullable String untuk pengeluaran, default null), `paymentMethod` (String, default "TUNAI" — kas fisik brankas vs rekening bank), `donorNameRaw`, `donorId` (nullable), `isVerified` (default false), `isManual` (Boolean, default false), `createdById` (nullable String, FK ke User), `verifiedById`, `verifiedAt`. Relasi ke Attachment & Report: `ON DELETE RESTRICT`.
- `Donor`: `name` (canonical), `normalizedName` (UNIK — kunci fuzzy matching), `contact`. `totalContribution` DIHITUNG ON-THE-FLY tanpa cache.
- `TreasuryTransfer`: `transferType` ("SETOR_TUNAI" | "TARIK_TUNAI"), `amount` (Decimal), `transferDate` (DateTime), `description` (String), `referenceNumber` (String?), `createdById` (FK ke User).
- `User`: model akun Google SSO NextAuth dengan kolom `role` (enum: `ADMIN`, `BENDAHARA`, atau `null` untuk Jemaah/Publik).

### Aturan penting yang JANGAN dilanggar:
- Transaction `isVerified=true` TIDAK BOLEH terhapus otomatis oleh proses apa pun.
- Transaction `isManual=true` (draf transaksi manual staf) TIDAK BOLEH terhapus oleh proses ekstrak ulang biasa (`replaceVerified=false`).
- Donasi berpola "hamba allah"/"hamba alloh"/"anonim"/"tanpa nama" / "kas masjid" → `donorId` SELALU null, TIDAK PERNAH jadi entity Donor tersendiri.
- Nilai `category` pada transaksi pemasukan bernilai `null`. Pada pengeluaran, jika belum dipilih oleh bendahara bernilai `null` dan ditampilkan di antarmuka sebagai "Tidak Dikategorikan".
- Saldo Kas Fisik Awal baseline (`getTreasuryBaselineCashBalance`) bersumber dari saldo penutup laporan mingguan terverifikasi terakhir (`latestReport.finalBalance`).

---

## 6. RANGKUMAN FITUR TUNTAS (FASE V1 S/D V15)
- **V1**: MVP Arsip digital laporan kas mingguan.
- **V2**: Multi-format attachment (Gambar, PDF, Excel).
- **V3**: Google SSO NextAuth & RBAC 3-Tier (`ADMIN`, `BENDAHARA`, `null`).
- **V4**: Ekstraksi AI Vision-LLM Gemini, review side-by-side, dan rekonsiliasi saldo kas.
- **V5**: Financial Intelligence (Tren kas Recharts, entity Donor fuzzy matching, deteksi duplikat).
- **V6**: Transparansi infaq anonim, ekstraksi PDF multimodal, direct parser spreadsheet Excel, cetak A4 & ekspor Excel.
- **V7**: Transparansi pengeluaran kas per 7 kategori baku di `/pengeluaran` & shared catalog.
- **V8**: Filter periode waktu kalender dinamis (`PeriodFilterBar`) di Pengeluaran & Donatur.
- **V9**: Filter periode fiskal kalender di dashboard & zero-modal export.
- **V10**: Cetak & ekspor rekapitulasi kas tahunan penuh 12 bulan (PDF multi-halaman + Excel).
- **V11**: Penambahan baris transaksi manual, proteksi menu unggah, kompresi gambar client-side WebP, ekstraksi vision-LLM context-aware, dan ergonomi sentuh mobile.
- **V12**: Pemantauan posisi kas fisik vs kas digital & mutasi internal (`/keuangan`) serta kontrol paginasi tabel modular reusable.
- **V13**: Portal transparansi publik `/` dan konsolidasi arsitektur Beranda.
- **V14**: Modern Collapsible Sidebar (72px/260px) berlatar siluet masjid, mobile fluid wave navigation, redesain pencarian arsip grid 4-kolom proporsional, dan alur unggah cepat.
- **V15**: Penyatuan header halaman ke dalam *Dark Green Hero Card* (`#0e3824`), eliminasi teks eyebrow redundan, kanvas desktop seamless (tanpa top header putih), profil/notifikasi terintegrasi di footer sidebar, dan tema PWA Deep Mosque Emerald.

---

## 7. DETAIL FITUR PER FASE (V6 S/D V15)

### 7a. FASE V6 — ADVANCED TRANSPARENCY & MULTIMODAL PIPELINE
- **F-018 (Issue #054)**: Transparansi Infaq Anonim di `/donatur` (Modal ledger riwayat transaksi kotak amal & Hamba Allah).
- **F-019 (Issue #055)**: Ekstraksi Dokumen Kas PDF via Gemini Multimodal API & viewer tersemat di Detail Laporan.
- **F-020 (Issue #056)**: Direct Parser Impor Spreadsheet Kas Excel (.xlsx/.xls) ke Panel Review tanpa OCR.
- **F-021 (Issue #057)**: Ekspor & Cetak Rekapitulasi Kas Mingguan & Bulanan (Format A4 formal mading DKM + Excel).
- **F-022 (Issue #058)**: Optimasi Responsivitas Mobile, eliminasi overlap grafik tren mingguan, dan ergonomi sentuh navigasi.

### 7b. FASE V7 — EXPENSE TRANSPARENCY (F-023)
- Field additive `category String?` pada model `Transaction` via migrasi Prisma `20261006095151_add_expense_category`.
- Shared catalog di `lib/expense-categories.ts`: 7 kategori baku (`operasional`, `honor`, `sosial`, `pembangunan`, `konsumsi`, `administrasi`, `lainnya`) dengan fallback `null` ("Tidak Dikategorikan").
- Endpoint publik aman `GET /api/expenses` & `GET /api/expenses/transactions`.
- Halaman publik baru `/pengeluaran` dengan 3 KPI cards, visual progress bar proporsi multi-warna, filter kategori interaktif chips, pencarian deskripsi langsung, tabel rincian mutasi kas.

### 7c. FASE V8 — PERIOD FILTERING & ANALYSIS (F-024)
- Komponen universal `PeriodFilterBar` dengan selector Tahun dinamis, Bulan (Semua Bulan, Jan–Des), dan tombol preset instan.
- Ekstensi query param `year` dan `month` pada endpoint pengeluaran dan donatur.
- Reaktivitas instan seluruh indikator KPI, progress bar proporsi alokasi dana, dan tabel mutasi kas.

### 7d. FASE V9 & V10 — FISCAL PERIOD & FULL ANNUAL REPORT (F-025 s/d F-027)
- Toolbar filter kalender (Bulan & Tahun) terpadu di dashboard.
- Mode Mingguan presisi pekan Jumat dan Mode Tahunan responsif (12 bulan desktop, toggle semester di mobile).
- Halaman cetak laporan tahunan penuh (`/laporan/cetak/tahunan`), ekspor PDF vektor multi-halaman A4 (`drawLedgerTable`), dan ekspor spreadsheet Excel tahunan.
- Penyatuan tombol aksi cetak di `PrintActionBar` menjadi tombol cerdas tunggal "Cetak Laporan".

### 7e. FASE V11 — DATA INTEGRITY & WORKFLOW EFFICIENCY (F-028 s/d F-032)
- **F-028**: Tambah baris transaksi manual (`POST /api/attachments/:id/transactions`), skema `isManual` & `createdById`, serta proteksi preservasi baris manual saat ekstrak ulang.
- **F-029**: Kendali visibilitas menu "Unggah" khusus staf dan banner notifikasi izin akses di Dashboard.
- **F-030**: Kompresi foto kamera HP otomatis client-side Canvas WebP (`lib/image-compression.ts`), menghemat kuota storage 85%–90%.
- **F-031**: Ekstraksi AI Vision-LLM Context-Aware berbasis rentang pekan laporan & closing balance boundary.
- **F-032**: Penyelarasan responsivitas tampilan mobile, margin aman 16px, dan touch ergonomics.

### 7f. FASE V12 — TREASURY POSITION & PAGINATION (F-033, F-034)
- **F-033**: Pemantauan Posisi Kas & Perbendaharaan (`/keuangan`), pemisahan Kas Tunai Brankas vs Rekening Bank/QRIS (`paymentMethod`), model `TreasuryTransfer` (Setor/Tarik Tunai), dan rekonsiliasi saldo kas fisik awal baseline.
- **F-034**: Kontrol Paginasi Tabel Modular (`components/ui/pagination-controls.tsx`) diterapkan pada Pengeluaran, Donatur, dan Perbendaharaan.

### 7g. FASE V13 — PORTAL TRANSPARANSI PUBLIK & HOMEPAGE CONSOLIDATION (F-035)
- Transformasi halaman utama (`/`) menjadi Portal Transparansi Kas Umat publik.
- Eliminasi redundansi rute `/dashboard` untuk tamu (307 redirect ke `/`).
- Alokasi pos belanja riil terintegrasi dengan filter periode arus kas.
- Resolusi tanggal dokumen kas fisik riil pada widget pencarian riwayat infaq.

### 7h. FASE V14 — MODERN EMERALD UI, COLLAPSIBLE SIDEBAR & FAST UPLOAD (F-036 s/d F-038)
- Modern Collapsible Floating Emerald Sidebar (72px Compact & 260px Expanded) berlatar siluet masjid autentik.
- Bilah navigasi curved fluid wave mobile dengan white pill kontras tinggi.
- Redesain pencarian arsip (`/cari`): Header ringkasan finansial bulanan dan grid 4-kolom proporsional desktop.
- Smart auto-redirect pasca-unggah berkas langsung ke detail laporan (`/laporan/[id]`) dan seksi laporan tertunda di dashboard pengurus.

### 7i. FASE V15 — UNIFIED HERO CARD HEADER & SEAMLESS CANVAS (F-039, F-040)
- **F-039**: Penyatuan judul halaman, tombol aksi glassmorphism, dan metrik finansial ke dalam *Dark Green Hero Card* (`#0e3824`); eliminasi teks eyebrow redundan abu-abu; pengerasan responsivitas form `/cari` dan subcard ke `xl:grid-cols-12`.
- **F-040**: Kanvas desktop seamless (menyembunyikan bar horizontal putih 64px di desktop `lg:hidden`), penyatuan header detail laporan ke dalam hero card, integrasi avatar profil staf & lonceng notifikasi status kas ke footer sidebar, serta penyelarasan tema PWA Deep Mosque Emerald.

---

## 8. MASALAH/BUG YANG SEDANG DIBAHAS
Tidak ada bug fungsional aktif di codebase. Seluruh fase V1 s/d V15 (F-001 s/d F-040) telah tuntas 100%, teruji lolos typecheck & linter, serta live di Vercel Production.

### 7j. FASE V16 — PUBLIC FULL-WIDTH PORTAL & CENTERED TOP NAVIGATION (F-041, ISSUE #085)
- **Status**: Selesai Penuh 100% & Terverifikasi Bebas Galat (TypeScript Clean).
- **Latar Belakang & Masalah**: Pengunjung jemaah/donatur tanpa login sebelumnya melihat sidebar kiri desktop buka-tutup (collapsible) yang semestinya dikhususkan untuk admin/dashboard operasional, sehingga halaman terasa sempit dan menyerupai admin dashboard internal SaaS.
- **Solusi Arsitektur**:
  1. Menghilangkan sidebar desktop kiri pada sesi publik tanpa login (`lg:hidden` pada sidebar tamu, `lg:pl-0` pada kanvas konten) sehingga halaman menjadi *full-width* lapang dan megah.
  2. Menghadirkan **Centered Top Navigation Bar** di bagian atas kanvas publik (Logo DKM di kiri, Menu Navigasi Utama di tengah, Tombol Akses Pengurus di kanan).
  3. Mengeliminasi baris anchor bar ganda di atas kartu hero `app/page.tsx` agar navigasi terpusat dan tidak berulang.
  4. Mempertahankan sidebar collapsible emerald (`#0e3824`) secara eksklusif bagi staf DKM yang login pada modul kerja operasional (`/dashboard`, `/keuangan`, `/unggah`, `/pengguna`).

---

## 9. PENYEBAB BUG YANG SUDAH DIKETAHUI (dicatat agar tidak diulang)
- Batasan `max-w-[1120px]` atau `max-w-6xl` pada PageShell sempat membuat layout di monitor lebar menciut tidak proporsional — fixed menjadi full-width responsif (`w-full px-4 sm:px-6 md:px-8 lg:px-10`).
- **Next.js 16 App Router Dynamic Route `params` Breaking Change**: Parameter `context.params` bertipe `Promise`. NextAuth v4 Route Handler standar mem-parse synchronous sehingga menghasilkan error 404 HTML — fixed dengan membungkus handler GET/POST di `app/api/auth/[...nextauth]/route.ts` dan melakukan `await context.params`.
- ON DELETE RESTRICT pada Transaction→Attachment/Report menyebabkan error hapus jika ada transaksi terkait — fixed dengan aturan hapus berjenjang.
- Transaksi `isVerified=false` sempat terlihat tanpa sesi — fixed dengan proteksi sesi ketat di semua endpoint publik.
- Regex metacharacter pada prefix nama donatur ("h.", "hj.") sempat memotong nama biasa — fixed dengan `escapeRegex()`.
- Agregasi tren grafik sempat mulai hari Senin — fixed diselaraskan ke hari Jumat.
- Browser print engine bawaan mengulang elemen `<tfoot>` di setiap lembar cetak multi-halaman — fixed dengan memindahkan baris Total ke penutup `<tbody>`.

---

## 10. SOLUSI YANG SUDAH DICOBA DAN HASILNYA
- `npx tsc --noEmit` lolos 0 error.
- `npm run lint` lolos 0 error.
- NextAuth handler wrapper sukses menangani session request (`/api/auth/session`) mengembalikan JSON valid status 200.
- Isolasi publik teruji: transaksi draf (`isVerified: false`) tidak bocor ke publik di endpoint agregasi maupun rincian `/api/expenses`, `/api/reports`, dan `/api/dashboard`.
- Modul kompresi gambar client-side WebP berhasil menekan ukuran foto kamera ponsel dari 3–8 MB menjadi ~200–400 KB tanpa degradasi keterbacaan teks angka oleh Gemini AI.
- Paginasi tabel modular mencegah rendering ratusan baris sekaligus, menjaga performa rendering peramban tetap ringan.

---

## 11. KEPUTUSAN TEKNIS YANG SUDAH DISEPAKATI
- **Palet Warna Resmi**: Deep Mosque Emerald `#0e3824` (Hero Card & brand identity), dark green `#154212`, surface `#fafaf4`, surface-container `#ffffff`, outline `#c2c9bb`.
- **Tipografi & Ikon**: Outfit (Google Fonts) & Lucide Icons.
- **Kanvas Desktop**: Tanpa top header bar desktop (`lg:hidden`), memberikan tampilan kanvas yang lapang, elegan, dan fokus langsung pada Dark Green Hero Card (`lg:pt-8`).
- **Sidebar Desktop**: Floating modern collapsible (Mode Compact 72px & Expanded 260px) dengan persistensi preferensi di `localStorage` dan profil staf di footer.
- **Penyimpanan Kategori Pengeluaran**: Enum kategori disimpan sebagai hardcoded shared config di `lib/expense-categories.ts`, bukan tabel database relasional terpisah, guna menjaga kesederhanaan skema dan kemudahan deployment.
- **Pemisahan Kas Tunai vs Bank**: Ditandai pada level baris transaksi melalui kolom `paymentMethod` (`"TUNAI"` vs `"BANK"`), memungkinkan audit granular tanpa memecah integritas pembukuan kas mingguan.
- **Proteksi Ekstrak Ulang**: Jika berkas sudah memiliki transaksi terverifikasi (`verifiedCount > 0`), tombol "Ekstrak Ulang" wajib memicu dialog konfirmasi (`AlertDialog`) dengan opsi eksplisit: `Reset & Ekstrak Ulang` atau `Simpan Lama & Tambah Draf`. Baris manual unverified diproteksi agar tidak terhapus pada opsi penambahan draf.

---

## 12. HAL-HAL YANG JANGAN DIUBAH KARENA SUDAH BENAR
- JANGAN upgrade Prisma ke v6+ (tetap di 5.22.0).
- JANGAN satukan Vercel Postgres dengan Supabase Storage.
- JANGAN ubah ON DELETE RESTRICT pada relasi transaksi jadi CASCADE/SET NULL.
- JANGAN biarkan proses apa pun menghapus transaksi `isVerified=true` secara otomatis tanpa konfirmasi eksplisit pengguna.
- JANGAN buat entity Donor untuk pola nama anonim ("hamba allah", "kas masjid").
- JANGAN kembalikan batasan `max-w-[1120px]` atau `max-w-6xl` pada PageShell.
- JANGAN hapus async wrapper `await context.params` pada `app/api/auth/[...nextauth]/route.ts`.
- JANGAN ubah nama file `proxy.ts` menjadi `middleware.ts` di Next.js 16.

---

## 13. KODE/KONFIGURASI PENTING YANG PERLU DIPERTAHANKAN
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```
- Modul sentral: `lib/auth-guard.ts`, `lib/treasury.ts`, `lib/file-validation.ts`, `lib/image-compression.ts`, `lib/export-pdf.ts`, `lib/donor-matching.ts`, dan `lib/expense-categories.ts`.

---

## 14. STATUS & LANGKAH BERIKUTNYA
1. **Status Sistem**: Seluruh 15 Milestone rilis dan 40 fitur sistem telah rampung 100%, berstatus **Production-Grade & Feature-Complete** pada versi rilis `0.15.0`.
2. **Operasional Harian DKM Masjid Al-Luqman**:
   - Pengurus DKM dapat mengunggah lembar pembukuan kas mingguan secara rutin setiap hari Jumat/Sabtu.
   - Menggunakan fitur kompresi otomatis untuk menjaga efisiensi kapasitas storage Supabase.
   - Memanfaatkan fitur Cetak Laporan A4 Resmi untuk ditempel pada papan mading masjid setelah verifikasi selesai.
3. **Pemeliharaan Berkala**:
   - Monitoring kuota bulanan Google Gemini API (free tier).
   - Backup basis data berkala melalui dashboard Vercel Postgres.
   - Peninjauan berkala daftar donatur dan kategori pengeluaran kas.

---

## 15. KONTEKS LAIN YANG PENTING
- Selalu sertakan penjelasan singkat yang jelas mengenai fungsi perintah terminal/git.
- Reza selalu melakukan review manual sebelum commit/push.
- Scope tetap fokus pada Masjid Al-Luqman (bukan aplikasi multi-tenant).
- Pola kerja bertahap: 1 issue dalam satu waktu, laporkan dengan bukti konkret.
