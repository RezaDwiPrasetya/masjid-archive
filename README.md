# Masjid Archive

> **Sistem Arsip & Transparansi Keuangan Digital DKM Masjid Al-Luqman**  
> Kelurahan Soklat, Kecamatan Subang, Jawa Barat

Aplikasi web modern untuk mengarsipkan, mendigitalkan, dan mempublikasikan laporan keuangan mingguan kas masjid secara transparan, akuntabel, dan mudah diakses oleh seluruh jamaah tanpa memerlukan login.

---

## 🌟 Latar Belakang & Tujuan

Sebelumnya, pencatatan keuangan DKM Masjid Al-Luqman bertumpu pada lembar buku kas fisik manual yang difoto dan ditempel di papan mading masjid. Metode ini memiliki risiko kerusakan berkas fisik, sulit ditelusuri riwayatnya, dan tidak terdokumentasi dalam format data terstruktur.

**Masjid Archive** menghadirkan solusi digital menyeluruh tanpa mengubah alur kerja alami pengurus:
- Bendahara tetap mencatat pembukuan mingguan seperti biasa.
- Cukup memfoto/memindai lembar kas fisik dan mengunggahnya ke sistem.
- Sistem mengekstrak transaksi tulisan tangan secara otomatis dan menyajikannya ke dalam dasbor analitik publik.

---

## ✨ Fitur Utama

### 1. Arsip Digital Multi-Format
- Mengelompokkan dokumen secara otomatis berdasarkan **Tahun → Bulan → Pekan (Jumat)**.
- Mendukung berkas foto lembar kas (`.jpg`, `.jpeg`, `.png`, `.webp`), dokumen PDF (`.pdf`), dan spreadsheet kas (`.xlsx`, `.xls`).
- Pembatasan ukuran aman hingga 10 MB per berkas dengan sanitasi nama berkas terintegrasi di **Supabase Storage**.

### 2. Ekstraksi AI Multimodal (Vision-LLM OCR)
- Menggunakan **Google Gemini Vision** (`gemini-3.6-flash` dengan auto-fallback cerdas ke `gemini-3.5-flash`) untuk membaca foto buku kas tulisan tangan.
- Ekstraksi langsung memetakan saldo awal, saldo akhir, tipe transaksi (pemasukan/pengeluaran), nominal rupiah, keterangan, dan nama donatur tertulis.
- Parsing tabular server-side instan untuk berkas Excel tanpa konsumsi token OCR.

### 3. Review, Rekonsiliasi, & Financial Intelligence
- **Panel Verifikasi Staf**: Pemeriksaan dan koreksi transaksi hasil AI sebelum disahkan menjadi data resmi.
- **Deteksi Seimbang Otomatis**: Rekonsiliasi otomatis antara saldo buku fisik dengan akumulasi mutasi transaksi digital.
- **Normalisasi & Pencocokan Donatur**: Menggabungkan variasi ejaan nama donatur (mis. penanganan gelar *Bpk*, *Haji*, *Ustadz*) serta agregasi khusus untuk Infaq Anonim (*Hamba Allah*).
- **Klasifikasi Pengeluaran Kas**: Kategorisasi pos anggaran masjid (operasional, honorarium marbot/guru ngaji, sosial/santunan, pembangunan fisik, konsumsi kajian, administrasi, dll).

### 4. Dasbor Publik & Transparansi Jamaah (Tanpa Login)
- Dasbor interaktif menyajikan saldo kas terkini, total pemasukan, total pengeluaran, dan grafik tren kas mingguan/bulanan.
- Tabulasi transparansi kontribusi donatur dan mutasi infaq tanpa nama.
- Visualisasi alokasi pengeluaran kas per kategori dengan filter rentang periode fleksibel.

### 5. Cetak & Ekspor Dokumen Resmi A4
- **Format Cetak Mading A4**: Tata letak resmi berkas mading masjid lengkap dengan Kop DKM Al-Luqman, kartu ikhtisar saldo, mutasi kas, dan ruang tanda tangan pengesahan Ketua DKM & Bendahara.
- **Unduh PDF Vektor Langsung**: Menghasilkan dokumen PDF A4 multi-halaman beresolusi tinggi langsung via server (`pdf-lib`).
- **Unduh Spreadsheet Excel**: Format laporan pembukuan kas bulanan dan tahunan lengkap (`.xlsx`).

### 6. Keamanan & RBAC 3-Tier
- Otentikasi aman melalui **Google OAuth SSO** via NextAuth.js.
- Pembagian wewenang ketat:
  - **Jamaah / Publik (`role: null`)**: Akses baca data terverifikasi dan ekspor laporan tanpa login.
  - **Bendahara (`BENDAHARA`)**: Akses unggah dokumen, ekstraksi AI, verifikasi, dan koreksi data kas.
  - **Administrator (`ADMIN`)**: Wewenang penuh operasional, manajemen hak akses pengguna, dan proteksi hapus laporan.
- Perlindungan integritas: *Sole Admin Lockout Protection* (mencegah sistem terkunci tanpa admin), data hardening (pencegahan kebocoran raw AI dump ke publik), dan proteksi jejak audit laporan keuangan.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Bahasa** | TypeScript |
| **Styling** | Tailwind CSS + Accessible Base UI primitives |
| **Komponen UI** | shadcn/ui + Lucide React Icons |
| **Basis Data** | PostgreSQL (Vercel Postgres) |
| **ORM** | Prisma ORM 5.22.0 |
| **Penyimpanan Berkas** | Supabase Storage (Bucket: `report-photos`) |
| **Kecerdasan Buatan (AI)** | Google Generative AI SDK (Gemini Vision) |
| **Autentikasi** | NextAuth.js (Auth.js) dengan Google Provider & JWT Strategy |
| **Grafik & Visualisasi** | Recharts via shadcn/ui Charts |
| **Generator Dokumen** | `pdf-lib` (PDF Vektor A4) & `xlsx` (Excel Spreadsheet) |

---

## 🚀 Memulai (Panduan Instalasi Lokal)

### Prasyarat
- Node.js versi 20+ (disarankan Node.js 22 LTS)
- Akun Google Cloud Platform (untuk Google OAuth & Gemini API Key)
- Akun Supabase (untuk Storage Bucket)
- Database PostgreSQL (lokal atau cloud seperti Vercel Postgres / Neon)

### Langkah Pemasangan

1. **Clone repositori**:
   ```bash
   git clone https://github.com/RezaDwiPrasetya/masjid-archive.git
   cd masjid-archive
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:
   Salin berkas `.env.example` ke `.env` lalu sesuaikan kredensial Anda:
   ```bash
   cp .env.example .env
   ```
   Variabel kunci yang dibutuhkan:
   - `DATABASE_URL`: URI koneksi PostgreSQL.
   - `NEXTAUTH_SECRET`: Secret hash sesi NextAuth.
   - `NEXTAUTH_URL`: URL lokal aplikasi (mis. `http://localhost:3000`).
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Kredensial Google OAuth 2.0.
   - `GEMINI_API_KEY`: API Key Google Generative AI (AI Studio).
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kredensial Supabase Storage.

4. **Inisialisasi Database**:
   ```bash
   npx prisma migrate dev
   ```

5. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka peramban di [http://localhost:3000](http://localhost:3000).

6. **Menjalankan Validasi & Uji Mandiri**:
   ```bash
   npx tsc --noEmit                          # Cek tipe TypeScript
   npm run lint                              # Pemeriksaan linter ESLint
   npx tsx scripts/test-auth-guards.ts       # Uji guard otorisasi RBAC
   npx tsx scripts/test-audit-hardening.ts   # Uji proteksi admin & validasi server
   npx tsx scripts/test-file-validation.ts   # Uji validasi berkas upload
   ```

---

## 📁 Struktur Direktori

```
masjid-archive/
├── app/                  # Route Handlers & Server/Client Components (App Router)
│   ├── api/              # REST API Endpoints (/reports, /transactions, /users, dll)
│   ├── cari/             # Halaman Pencarian Arsip
│   ├── dashboard/        # Dasbor Analitik Keuangan Publik
│   ├── donatur/          # Halaman Transparansi Donatur & Infaq Anonim
│   ├── pengeluaran/      # Halaman Rekapitulasi Pengeluaran per Kategori
│   ├── pengguna/         # Halaman Manajemen Hak Akses Pengguna (Khusus Admin)
│   ├── laporan/          # Halaman Detail Laporan, Review AI, & Cetak A4
│   └── unggah/           # Halaman Form Unggah Berkas Kas Mingguan
├── components/           # Komponen UI Terpadu (AppShell, PageShell, Dialogs, Charts)
├── lib/                  # Logika Bisnis, Helper, Prisma Client, Guard, & Validasi
├── prisma/               # Skema Database (schema.prisma) & Migrasi
├── public/               # Aset Statis & Favicon Resmi Kubah Masjid
├── scripts/              # Skrip Otomasi Pengujian & Utilitas Database
└── docs/                 # Dokumentasi Lengkap Sistem & Spesifikasi Fitur
```

---

## 🏛️ Pengelola Sistem

Dikembangkan untuk dan dikelola oleh:  
**DKM Masjid Al-Luqman**  
Kelurahan Soklat, Kecamatan Subang, Kabupaten Subang, Jawa Barat.
