# Masjid Archive

> **Sistem Arsip & Transparansi Keuangan Digital DKM Masjid Al-Luqman**  
> Kelurahan Soklat, Kecamatan Subang, Kabupaten Subang, Jawa Barat  
> *Versi Rilis: **V14.0 (Modern Collapsible Emerald Sidebar, Intelligent Search Grid & Production Release)***

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini_Vision_Multimodal-4285F4?logo=google)](https://ai.google.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable_Mobile_App-154212)](https://web.dev/progressive-web-apps/)
[![Automated Tests](https://img.shields.io/badge/Tests-194_Passed_100%25-success)](scripts/)

Aplikasi web modern dan Progressive Web App (PWA) untuk mengarsipkan, mendigitalkan, dan mempublikasikan laporan pembukuan keuangan mingguan kas masjid secara transparan, akuntabel, dan mudah diakses oleh seluruh jemaah tanpa memerlukan login.

---

## 🌟 Latar Belakang & Visi

Pencatatan keuangan mingguan DKM Masjid Al-Luqman sebelumnya bertumpu pada lembaran buku kas fisik tulisan tangan yang difoto dan ditempel di papan mading masjid setiap selesai shalat Jumat. Metode manual tersebut memiliki risiko kerusakan fisik, kertas basah/hilang, riwayat sulit ditelusuri, dan mutasi tidak terdokumentasi dalam format data terstruktur.

**Masjid Archive** menghadirkan transformasi digital menyeluruh tanpa mengubah alur kerja alami pengurus di lapangan:
- **Alur Alami Tetap Berjalan**: Bendahara tetap menulis pembukuan fisik di buku kas seperti biasa.
- **Digitalisasi Cepat**: Pengurus cukup mengambil foto lembar kas atau mengunggah pindaian dokumen/spreadsheet.
- **Ekstraksi Otomatis & Cerdas**: Sistem AI Vision-LLM membaca tulisan tangan, mengekstrak angka mutasi, dan memvalidasi saldo secara otomatis.
- **Transparansi Jemaah**: Seluruh jemaah dan donatur dapat memantau pergerakan kas, laporan berkala, grafik tren, serta mengunduh berkas laporan resmi secara bebas.

---

## ✨ Fitur-Fitur Utama Sistem

### 1. 🕌 Floating Collapsible Emerald Sidebar & Mobile Fluid Navigation (F-036 / V14.0)
- **Collapsible Floating Sidebar Desktop**: Sidebar bernuansa *Deep Mosque Emerald* (`#0e3824`) yang fleksibel diciutkan ke mode ramping (72px) atau dilebarkan (260px) dengan transisi animasi halus dan penyimpanan status otomatis di `localStorage`.
- **Watermark Siluet Masjid Autentik**: Mengintegrasikan siluet ilustrasi masjid autentik DKM di latar bawah sidebar tanpa mengganggu keterbacaan menu navigasi.
- **Bilah Navigasi Mobile Fluid Wave**: Navigasi bawah ponsel berbentuk kurva halus dengan active pill putih kontras tinggi dan ikon hijau tua.
- **Popover Profil Interaktif & Tombol Logout**: Popover akun interaktif pada avatar topbar serta tombol keluar akun minimalis di bagian bawah sidebar.

### 2. 🔍 Redesain Pencarian Arsip & Agregasi Bulanan (F-037 / V14.0)
- **Pengelompokan Bulanan Terstruktur**: Mengelompokkan seluruh arsip laporan kas per bulan kalender.
- **Header Agregasi Finansial Bulanan**: Menampilkan kartu ringkasan total pemasukan, total pengeluaran, dan arus kas bersih (*Net Cash Flow*) di setiap grup bulan.
- **Grid 4-Kolom Desktop Proporsional**: Layout kartu laporan kompak dalam 4 kolom desktop yang proporsional dan tertata rapi.
- **Pengurutan Kronologis Pekan**: Menata pekan secara runtut dari pekan awal ke pekan penutup dalam setiap bulan.

### 3. 🚀 Alur Kerja Unggah Cepat & Antrean Laporan Tertunda (F-038 / V14.0)
- **Auto-Redirect Pasca-Unggah**: Pengurus langsung diarahkan ke halaman detail laporan (`/laporan/[id]`) setelah berkas kas disimpan untuk segera memicu ekstraksi AI.
- **Antrean Laporan Tertunda (*Pending Reports Queue*)**: Seksi khusus pada dashboard staf untuk mendeteksi laporan yang belum diekstrak atau belum diverifikasi.

### 4. 📱 Progressive Web App (PWA) & Ergonomi Layar Sentuh Mobile (F-032 / V10.9)
- **Dukungan Instalasi Mandiri**: Dapat dipasang langsung ke layar utama (*Add to Home Screen*) ponsel Android & iOS tanpa melalui Play Store / App Store via Web App Manifest (`manifest.json`).
- **Mode Layar Penuh (*Standalone*)**: Beroperasi bersih tanpa bilah URL peramban, memberikan pengalaman layaknya aplikasi ponsel pintar asli (*native app*).
- **Navigasi Bawah Adaptif & 100% Simetris**: Bilah navigasi mobile membentang penuh dengan pembagian ruang rata (`flex-1 min-w-0`), mendukung 5 menu untuk Jemaah, 6 menu untuk Bendahara, hingga 7 menu untuk Administrator tanpa pergeseran layout.
- **Sentuhan Ergonomis**: Seluruh elemen interaktif dan tombol aksi memiliki target sentuh minimal 44×44px (standar aksesibilitas WCAG).

### 5. ⚡ Kompresi Gambar Cerdas Client-Side (F-030 / V10.7)
- **Kompresi Otomatis di Peramban**: Foto kamera ponsel beresolusi tinggi (3–8 MB) otomatis di-*downscale* ke batas maksimal 1920px dan dikonversi ke format **WebP** kualitas 82% langsung di peramban pengguna sebelum diunggah (`lib/image-compression.ts`).
- **Efisiensi Penyimpanan ~85%–90%**: Ukuran berkas tereduksi menjadi ~200–400 KB tanpa mengurangi keterbacaan angka tulisan tangan oleh manusia maupun AI.
- **Masa Pakai Kuota Jangka Panjang**: Memperpanjang kapasitas kuota penyimpanan cloud (1 GB) dari ~300 foto menjadi **3.000 s.d. 5.000 lembar dokumen** (setara 15–25 tahun arsip).
- **Transparansi Ukuran Berkas**: Pratinjau unggahan menampilkan badge penghematan ukuran secara nyata (contoh: *"3.6 MB → 340 KB (Hemat 91%)"*). Berkas PDF dan Excel dilewatkan secara utuh (*pass-through*).

### 6. 🧠 Ekstraksi Multimodal AI Vision-LLM Context-Aware (F-031 / V10.8)
- **Google Gemini Multimodal Vision**: Menggunakan model utama `gemini-3-flash-preview` dengan mekanisme kaskade *auto-fallback* cadangan (`gemini-3.1-flash-lite`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`) saat batas kuota atau latensi antrean tercapai.
- **Instruksi Kontekstual Berbasis Periode Pekan (*Context-Aware Prompt*)**: Menginjeksikan tanggal laporan target (`targetReportDate`) ke dalam prompt analisis guna mengunci batas mutasi mingguan.
- **Deteksi Batas Saldo Penutup (*Closing Balance Boundary*)**: AI secara cerdas mengenali garis penutup saldo (misal: `TOTAL KAS MESJID TGL 25-7-2025 Rp 850.000`) dan otomatis memisahkan catatan transaksi lanjutan di bawahnya yang merupakan milik pekan berikutnya (halaman fisik bersambung).
- **Parsing Spreadsheet Deterministik**: Berkas Excel (`.xlsx`, `.xls`) diproses langsung via parser tabular server-side tanpa konsumsi token OCR.

### 7. ✍️ Panel Tinjau Ekstraksi & Baris Transaksi Manual (F-028 / V10.5)
- **Penambahan Transaksi Manual**: Pengurus dapat menambahkan baris transaksi kas secara manual langsung dari panel peninjauan untuk mencatat mutasi yang terlewat oleh dokumen atau AI tanpa perlu melakukan ekstraksi ulang dari awal.
- **Identifikasi Visual Transparan**: Penanda khusus berupa badge `Manual` berwarna biru muda pada transaksi inputan pengurus serta badge `Draf` / `Belum Diverifikasi`.
- **Preservasi Data Cerdas**: Proses ekstraksi ulang cerdas mempertahankan baris transaksi manual yang telah dibuat pengurus dan hanya menyegarkan data draf hasil AI.

### 8. 👛 Posisi Kas & Perbendaharaan: Kas Fisik vs Kas Bank / Digital (F-033 / V11.0)
- **Tripartit Pemantauan Saldo Kas**: Halaman analitik khusus `/keuangan` yang menyajikan perbandingan real-time antara **Total Kas Keseluruhan**, **Kas Fisik (Tunai / Brankas)**, dan **Kas Bank / Digital (QRIS)**.
- **Rasio Likuiditas Real-Time**: Bilah kemajuan visual dwi-warna yang memperlihatkan proporsi persentase uang kontan di brankas masjid vs dana mengendap di rekening giro/tabungan resmi BSI.
- **Pencatatan Mutasi Kas Internal**: Antarmuka modal interaktif bagi staf DKM (Admin/Bendahara) untuk mencatat **Setor Tunai ke Bank** (`CASH_TO_BANK`) dan **Tarik Tunai dari Bank** (`BANK_TO_CASH`) dengan jaminan konservasi total saldo kas.
- **Pemisahan Kanal Transaksi**: Setiap transaksi kas ditandai dengan badge `Kas Tunai` atau `Bank / QRIS` dan dapat diubah secara instan oleh staf melalui tombol satu-klik `Ubah` pada panel review ekstraksi.
- **Alokasi Belanja per Kanal**: Analisis komparatif yang memperlihatkan pos kategori pengeluaran mana yang dibayarkan tunai dan mana yang ditransfer melalui perbankan.

### 9. 📊 Dasbor Analitik & Financial Intelligence Publik
- **Visualisasi Saldo & Tren Kas**: Grafik interaktif Recharts yang menyajikan pergerakan kas mingguan dan bulanan dengan penanganan responsif pada layar ponsel.
- **Filter Periode Waktu Cerdas**: Preset cepat (*Semua Waktu* dan *Tahun Ini*) serta pemilih kustom tahun dan bulan yang tertata rapi tanpa perlu geser horizontal di mobile.
- **Transparansi Pos Pengeluaran**: Pengelompokan mutasi kas keluar ke dalam kategori resmi DKM: Operasional, Honorarium, Pembangunan Fisik, Sosial & Santunan, Konsumsi Kajian, Administrasi, dan Pos Lainnya (`/pengeluaran`).
- **Pencatatan Donatur & Infaq Anonim**: Agregasi infaq donatur terdaftar disertai modal audit riwayat infaq tanpa nama / kotak amal tromol Jumat (`/donatur`).
- **Paginasi Tabel & Kontrol Skalabilitas (F-034 / V12.0)**: Navigasi tabel cerdas (`PaginationControls`) dengan smart ellipsis, pemilih ukuran baris (10, 25, 50, 100), continuous ranking `#rank` donatur, dan perlindungan performa DOM di halaman Pengeluaran, Donatur, dan Keuangan.

### 10. 🏛️ Portal Transparansi Publik & Saldo Terkonsolidasi (F-035 / V13.0)
- **Portal Transparansi Kas Terpadu**: Halaman muka (`/`) menyajikan narasi amanah, pembagian Kas Fisik vs Bank resmi, alokasi pos pengeluaran, cek infaq jemaah mandiri, dan arsip dokumen mingguan.
- **Konsolidasi Arsitektur Satu Pintu**: Mengeliminasi menu `/dashboard` duplikat menjadi satu landing page seragam dan ramah bagi publik maupun staf.

### 11. 🖨️ Ekspor & Pratinjau Cetak Formal A4 (Mading DKM)
- **Format Resmi Mading DKM**: Menghasilkan lembar laporan formal A4 lengkap dengan Kop Resmi DKM Masjid Al-Luqman, 4 kartu ikhtisar kas, tabel mutasi transaksi, dan kolom tanda tangan basah Ketua DKM serta Bendahara.
- **Dukungan Rekapitulasi Tahunan Penuh**: Mode pencetakan 12 bulan penuh yang dilengkapi lampiran multi-halaman buku besar kas (`drawLedgerTable`) beresolusi tinggi via `pdf-lib`.
- **Unduh Spreadsheet Excel**: Format `.xlsx` siap olah untuk arsip laporan kas mingguan, bulanan, maupun tahunan.

### 12. 🛡️ Keamanan Sistem & Otorisasi RBAC 3-Tier
- **Tiga Tingkatan Hak Akses**:
  - **Jemaah / Tamu Publik (`role: null`)**: Akses membaca seluruh data keuangan terverifikasi, grafik, pencarian arsip, dan ekspor dokumen tanpa perlu mendaftar/login.
  - **Bendahara (`BENDAHARA`)**: Wewenang operasional untuk mengunggah dokumen, memicu ekstraksi AI, menambah transaksi manual, dan memverifikasi data kas.
  - **Administrator (`ADMIN`)**: Wewenang administratif penuh mencakup pengelolaan akun pengurus, promosi hak akses, serta proteksi penghapusan berkas laporan.
- **Proteksi Penguncian Admin Tunggal (*Sole Admin Lockout Protection*)**: Sistem basis data secara atomik menolak mutasi atau penurunan hak akses akun admin terakhir di sistem.
- **Isolasi Data Publik**: Pencegahan kebocoran data sensitif (seperti respons mentah JSON prompt AI Gemini, galat teknis ekstraksi, dan email pengunggah) dari endpoint publik.

---

## 🛠️ Arsitektur & Teknologi

| Lapisan | Teknologi | Deskripsi / Catatan Konfigurasi |
|---|---|---|
| **Framework Web** | Next.js 16 (App Router) | Menggunakan routing terpadu, Server Components, dan routing guard `proxy.ts` |
| **Bahasa Pemrograman** | TypeScript 5 | Validasi tipe data ketat pada seluruh alur kerja dan API contracts |
| **Gaya & Desain Sistem** | Tailwind CSS + Base UI | Desain visual bertema nuansa hijau DKM (`#154212`) & krem hangat (`#fafaf4`) |
| **Ikonografi & Komponen** | Lucide React + shadcn/ui | Komponen antarmuka yang ringan, konsisten, dan berstandar aksesibilitas |
| **Progressive Web App** | Web App Manifest (PWA) | Pengalaman instalasi layar utama ponsel dengan ikon resmi kubah masjid |
| **Basis Data** | PostgreSQL (Vercel Postgres) | Penyimpanan data relasional transaksi, donatur, laporan, dan otorisasi |
| **Object-Relational Mapping** | Prisma ORM 5.22.0 | Akses basis data aman (*locked* pada versi 5.22.0 untuk stabilitas schema) |
| **Penyimpanan Berkas** | Supabase Storage | Bucket terisolasi `report-photos` untuk pindaian dokumen dan foto kas |
| **Kecerdasan Buatan (AI)** | Google Gemini Vision API | `@google/generative-ai` multimodal Vision-LLM (Model utama: `gemini-3-flash-preview`) |
| **Autentikasi & Sesi** | NextAuth.js (Auth.js) | Google OAuth 2.0 SSO dengan token JWT dan sinkronisasi role dinamis |
| **Grafik Keuangan** | Recharts via shadcn/ui Charts | Visualisasi tren arus kas mingguan, bulanan, dan semester |
| **Generator Dokumen** | `pdf-lib` & `xlsx` | Pembangkitan berkas PDF A4 mading multi-halaman dan spreadsheet Excel |

---

## 🚀 Panduan Instalasi Lokal (Development)

### Prasyarat Perangkat Lunak
- **Node.js**: Versi 20+ (disarankan Node.js 22 LTS)
- **Database**: PostgreSQL (lokal atau cloud seperti Supabase / Neon / Vercel Postgres)
- **Kredensial Layanan Cloud**:
  - Google Cloud Platform (Google OAuth Client ID & Secret)
  - Google AI Studio (Gemini API Key)
  - Supabase Project (Project URL & Service Role Key)

### Langkah Pemasangan

1. **Clone repositori dari GitHub**:
   ```bash
   git clone https://github.com/RezaDwiPrasetya/masjid-archive.git
   cd masjid-archive
   ```

2. **Pasang dependensi Node.js**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:
   Salin template berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Lengkapi variabel environment berikut:
   ```env
   # Basis Data PostgreSQL
   DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
   DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

   # Autentikasi NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="kunci-rahasia-string-acak-minimal-32-karakter"

   # Google OAuth 2.0 SSO
   GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

   # Google Gemini AI Studio
   GEMINI_API_KEY="AIzasyxxx"

   # Supabase Storage (Bucket: report-photos)
   SUPABASE_URL="https://xxx.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
   ```

4. **Sinkronisasi Skema Basis Data**:
   ```bash
   npx prisma migrate dev
   ```

5. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Validasi Kualitas & Pengujian Otomatis

Seluruh logika bisnis, otorisasi, kompresi berkas, ekstraksi AI, dan layout antarmuka diuji melalui suite pengujian otomatis komprehensif (**147 pengujian lulus 100%**):

```bash
# 1. Pemeriksaan Tipe TypeScript (0 error)
npx tsc --noEmit

# 2. Pemeriksaan Linter ESLint (0 error)
npm run lint

# 3. Uji Responsivitas & Simetri Mobile PWA (F-032 / Issue #75)
npx tsx scripts/test-mobile-responsiveness.ts

# 4. Uji Guard Otorisasi Keamanan RBAC 3-Tier (55 pengujian)
npx tsx scripts/test-auth-guards.ts

# 5. Uji Pengerasan Audit & Validasi Mutasi Server (15 pengujian)
npx tsx scripts/test-audit-hardening.ts

# 6. Uji Validasi Sanitasi Berkas & Upload (10 pengujian)
npx tsx scripts/test-file-validation.ts

# 7. Uji Baris Transaksi Kas Manual (F-028 / Issue #073) (21 pengujian)
npx tsx scripts/test-manual-transaction.ts

# 8. Uji Kompresi Gambar Client-Side WebP (F-030 / Issue #075) (17 pengujian)
npx tsx scripts/test-image-compression.ts

# 9. Uji Ekstraksi Vision-LLM Context-Aware (F-031 / Issue #076) (14 pengujian)
npx tsx scripts/test-context-aware-extraction.ts
```

---

## 📁 Struktur Direktori Repositori

```
masjid-archive/
├── app/                  # Next.js App Router (Halaman & Endpoint API)
│   ├── api/              # REST Handlers (/reports, /transactions, /users, /expenses, dll)
│   ├── cari/             # Fitur Pencarian Cerdas Arsip Laporan
│   ├── dashboard/        # Dasbor Visualisasi Kas & Grafik Tren Keuangan
│   ├── donatur/          # Direktori Donatur Terdaftar & Audit Infaq Anonim
│   ├── pengeluaran/      # Rekapitulasi Alokasi Pengeluaran per Kategori
│   ├── pengguna/         # Panel Manajemen Pengguna & Hak Akses (Khusus Admin)
│   ├── laporan/          # Pratinjau Dokumen, Review Ekstraksi AI, & Cetak A4
│   │   └── [id]/cetak/   # Pratinjau Cetak Formal A4 Mading DKM
│   └── unggah/           # Formulir Unggah Berkas & Kompresi Client-Side
├── components/           # Komponen UI Reusable (AppShell, PageShell, Dialog, Chart)
├── lib/                  # Logika Bisnis, Helper AI, Ekspor PDF/Excel, Prisma Client
├── prisma/               # Schema Database (`schema.prisma`) & Riwayat Migrasi SQL
├── public/               # Manifest PWA (`manifest.json`), Ikon WebP, dan Favicon Kubah
├── scripts/              # Otomasi Pengujian Sistem & Script Utilitas Basis Data
└── docs/                 # Dokumentasi Teknis, Panduan Desain, & Spesifikasi Fitur
```

---

## 🏛️ Pengelola Sistem

Sistem ini dikembangkan untuk dan dikelola secara resmi oleh:  
**Dewan Kemakmuran Masjid (DKM) Al-Luqman**  
Kelurahan Soklat, Kecamatan Subang, Kabupaten Subang, Jawa Barat.

Semoga sistem digital ini menjadi wasilah keterbukaan informasi, meningkatkan amanah pembukuan kas, serta membawa keberkahan dan kebaikan bagi seluruh jemaah dan donatur. 🕌✨
