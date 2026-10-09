# 12. Technical Specification

## Overview

Dokumen ini menjelaskan implementasi teknis Masjid Archive, mencakup kondisi produksi aktual (setelah deploy ke Vercel) dan spesifikasi teknis dari Fase V1 hingga V5 (Financial Intelligence).

## Tech Stack

| Layer | Tools | Catatan |
|---|---|---|
| Frontend Framework | Next.js (App Router) | Server Components untuk fetching data, Client Components untuk form interaktif |
| UI Components | shadcn/ui | Button, Input, Card, Table, Form, Dialog, Toast |
| Styling | Tailwind CSS | Sesuai token dari 11. Design Guidelines |
| Icons | Lucide Icons | |
| **Database** | **Vercel Postgres** (native integration, provider PostgreSQL) | Sebelumnya SQLite lokal (V1 development), lalu Supabase Postgres, kini Vercel Postgres native — SQLite tidak bisa dipakai di produksi karena lingkungan serverless Vercel bersifat read-only |
| ORM | Prisma, versi **5.22.0** (sengaja dipin) | Versi 6+ memperkenalkan sistem konfigurasi baru (`prisma.config.ts`) yang lebih kompleks dan sempat menyebabkan error saat development — tidak di-upgrade kecuali ada kebutuhan spesifik |
| **File Storage** (foto/lampiran laporan) | **Supabase Storage** (bucket `report-photos`) | Provider terpisah dari database — lihat penjelasan arsitektur di bawah |
| **Auth & RBAC** | **NextAuth.js (Auth.js)** | Google OAuth 2.0, `@auth/prisma-adapter`, sesi JWT dengan sinkronisasi DB role Prisma dinamis, helper `lib/auth-guard.ts` (RBAC 3-Tier: `ADMIN`, `BENDAHARA`, `null`) |
| **Vision-LLM (V4)** | **Google Gemini API** (`@google/generative-ai`) | Free tier untuk tahap development — lihat bagian V4 di bawah |
| **Visualisasi (V5)** | **Recharts** (via `shadcn/ui` Charts, yang membungkus Recharts) | Lihat bagian V5 di bawah |
| Hosting | Vercel | |

## Arsitektur: Kenapa Database dan File Storage Beda Provider?

Ini keputusan arsitektur yang disengaja, bukan solusi sementara:
- **Database (Vercel Postgres)**: menyimpan data terstruktur (User, Report, Attachment, Transaction) yang butuh query relasional, transaksi, dan filtering
- **File Storage (Supabase Storage)**: menyimpan file besar (foto, PDF, Excel) di object storage yang memang dirancang untuk itu — bukan disimpan sebagai binary di database

Pola ini disebut **separation of concerns**, umum dipakai di aplikasi production (kombinasi database + object storage terpisah). Tidak ada kebutuhan untuk menyatukan keduanya ke satu provider.

## Auth & Authorization Model (NextAuth SSO & RBAC 3-Tier)

Sistem autentikasi dan otorisasi menggunakan arsitektur Role-Based Access Control (RBAC) 3-Tier yang terintegrasi secara menyeluruh dari edge proxy, server components, hingga API route handlers:

### 1. Tingkatan Hak Akses (3-Tier Roles)
- **Jamaah / Publik (`role: null` atau tanpa sesi)**:
  - Akses baca data terverifikasi (dashboard, arsip, detail laporan, grafik tren, donatur, kategori pengeluaran, unduh PDF/Excel).
  - Transaksi draf yang belum diverifikasi (`isVerified: false`) **disembunyikan secara otomatis**.
  - Seluruh mutasi finansial (`POST`, `PATCH`, `DELETE`) ditolak (`401` jika tanpa sesi, `403 Forbidden` jika login Google tapi ber-role `null`).
  - Akses rute `/unggah` dialihkan oleh `proxy.ts` ke `/dashboard?error=forbidden`.
- **Bendahara / Staf Operasional (`role: "BENDAHARA"`)**:
  - Akses operasional pembukuan: unggah dokumen kas di `/unggah`, jalankan ekstraksi OCR AI, konfirmasi/batal verifikasi transaksi kas, edit nama donatur, serta klasifikasi kategori pengeluaran.
  - Hapus lampiran berkas unverified (`DELETE /api/attachments/:id`).
  - **Dilarang keras**: Menghapus laporan utama kas dan mengelola hak akses pengguna (ditolak `403 Forbidden`).
- **Administrator / Ketua DKM (`role: "ADMIN"`)**:
  - Seluruh wewenang operasional staf bendahara.
  - Wewenang eksklusif manajemen pengguna dan penetapan peran di `/pengguna`.
  - Hak eksklusif menghapus laporan kas (`DELETE /api/reports/:id`) dengan proteksi transaksi terverifikasi.

### 2. Mekanisme Sesi: JWT Strategy + Dynamic DB Role Synchronization
- NextAuth dikonfigurasi dengan `session: { strategy: "jwt" }`.
- **Alasan Pemilihan**: Next.js 16 edge proxy (`proxy.ts`) membaca data sesi secara cepat dan stateless melalui `getToken({ req, secret })`.
- **Sinkronisasi Role Seketika (Realtime Sync)**:
  Untuk mengatasi kelemahan JWT biasa yang menyimpan payload usang, callback `jwt({ token, user })` di `lib/auth.ts` selalu melakukan query `prisma.user.findUnique({ where: { id: userId } })` ke Vercel Postgres setiap kali token diverifikasi.
  *Dampak Positif*: Perubahan peran pengguna yang dilakukan oleh Administrator di antarmuka `/pengguna` (misal promosi Jamaah menjadi Bendahara, atau pencabutan akses) **langsung aktif detik itu juga**, tanpa mengharuskan pengguna keluar (logout) dan masuk kembali.

### 3. Modul Otorisasi Terpusat (`lib/auth-guard.ts`)
Pengecekan hak akses di seluruh route handler API distandarisasi menggunakan dua fungsi guard:
- `isStaff(session)`: Mengembalikan `true` hanya jika `role` adalah `"ADMIN"` atau `"BENDAHARA"` (case-insensitive & whitespace trimmed). Mengembalikan `false` untuk `null` atau `undefined`.
- `isAdmin(session)`: Mengembalikan `true` hanya jika `role` adalah `"ADMIN"`.

### 4. Perlindungan Rute Next.js 16 (`proxy.ts`)
Menggantikan `middleware.ts` yang telah deprecated di Next.js 16:
- Melindungi rute `/unggah` dan `/unggah/:path*` (khusus Staf: `ADMIN` atau `BENDAHARA`).
- Melindungi rute `/pengguna` dan `/pengguna/:path*` (khusus `ADMIN`).
- Pengguna tanpa sesi dialihkan ke `/login?callbackUrl=...`. Pengguna dengan peran tidak memadai dialihkan ke `/dashboard?error=forbidden`.

### 5. Proteksi Data Publik & Pencegahan Kebocoran Informasi (Data Hardening)
- Seluruh query data publik (`GET /api/reports`, `GET /api/reports/:id`, `app/page.tsx`, `app/cari/page.tsx`, `app/laporan/[id]/page.tsx`) wajib menggunakan klausa `select` eksplisit, bukan `include: true`.
- Relasi `uploadedBy` **hanya memilih field `name`**, menyembunyikan identitas email dan role pengunggah dari publik.
- Metadata ekstraksi internal Vision-LLM (`extractionRawResponse`, `extractionModel`, `extractionError`) **tidak pernah dibocorkan** ke pengunjung publik tanpa hak staf.

### 6. Pembersihan Total Legacy Auth
- Dependensi `iron-session`, berkas helper `lib/session.ts`, serta endpoint usang `app/api/auth/login` dan `app/api/auth/logout` telah dihapus sepenuhnya dari kode sumber demi menjaga kebersihan arsitektur sistem.




## Environment Variables

```env
# Database (Vercel Postgres)
DATABASE_URL=

# File Storage (Supabase)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth (V3)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Vision-LLM (V4)
GEMINI_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` dan `GEMINI_API_KEY` hanya digunakan di server (API routes), tidak boleh diberi prefix `NEXT_PUBLIC_`, dan tidak boleh diekspos ke client.

## Build Configuration (Vercel-specific)

```json
"scripts": {
  "build": "prisma generate && next build",
  "vercel-build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Halaman yang mengambil data live dari database ditandai dynamic agar tidak di-generate sebagai halaman statis saat build:
```typescript
export const dynamic = "force-dynamic";
```

## Prisma Schema (Ringkas — lihat 13. Data Model untuk detail lengkap)

*Catatan: Model tambahan bawaan NextAuth (`Account`, `Session`, `VerificationToken`) sengaja tidak ditampilkan di sini untuk keringkasan. Lihat dokumen 13 untuk struktur lengkap termasuk `Transaction` (V4).*

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          String?       // "ADMIN" | "BENDAHARA" | null (Jamaah)
  verifiedTransactions Transaction[] @relation("VerifiedBy")
  reports       Report[]
}

model Report {
  id             String       @id @default(cuid())
  reportDate     DateTime
  year           Int
  month          Int
  weekOfMonth    Int
  uploadedAt     DateTime     @default(now())
  uploadedById   String
  uploadedBy     User         @relation(fields: [uploadedById], references: [id])
  attachments    Attachment[]
  // V4: saldo kas mingguan — properti laporan, bukan lampiran individual
  initialBalance Decimal?     // Saldo lalu / saldo awal pekan ini
  finalBalance   Decimal?     // Saldo akhir yang tertera di buku kas
}

model Attachment {
  id                     String    @id @default(cuid())
  reportId               String
  report                 Report    @relation(fields: [reportId], references: [id])
  fileUrl                String
  fileType               String    // "image" | "pdf" | "excel"
  originalFileName       String
  fileSizeBytes          Int
  extractionStatus       String    @default("not_extracted") // V4
  extractionModel        String?   // V4
  extractionRawResponse  Json?     // V4
  extractionError        String?   // V4
  extractedAt            DateTime? // V4
  uploadedAt             DateTime  @default(now())
}
```

## V2 — Spesifikasi Teknis: Multi-Format Upload

### Alur Upload Multi-File

1. Client memilih beberapa file sekaligus (`<input type="file" multiple>`)
2. Client melakukan validasi awal per file (tipe & ukuran) sebelum submit
3. Saat submit, server memvalidasi ulang, lalu:
   - Cek duplikat tanggal laporan terlebih dahulu (sebelum upload apa pun dimulai)
   - Upload semua file secara paralel (`Promise.all`) ke Supabase Storage
   - Jika semua berhasil, gunakan `prisma.$transaction` untuk insert `Report` + semua `Attachment` sekaligus
   - Jika ada file yang gagal diupload atau transaksi database gagal, hapus file yang sudah terlanjur terupload agar tidak menyisakan file "yatim" di storage

### Struktur Folder Storage (Supabase)

```
report-photos/
  reports/
    {reportId}/
      {uuid}.jpg
      {uuid}.pdf
      {uuid}.xlsx
```

### Validasi Tipe File (Server-side)

```typescript
const ALLOWED_TYPES = {
  "image/jpeg": { ext: "jpg", maxSize: 5 * 1024 * 1024 },
  "image/png": { ext: "png", maxSize: 5 * 1024 * 1024 },
  "application/pdf": { ext: "pdf", maxSize: 10 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "xlsx", maxSize: 5 * 1024 * 1024 },
};
```

### Library Frontend

Tidak ada library tambahan yang wajib untuk V2 dasar (native file input + FormData sudah cukup). Opsional: `react-dropzone` untuk UX drag-and-drop yang lebih modern.

## V4 — Spesifikasi Teknis: Ekstraksi Data (Vision-LLM)

### Model yang Dipakai & Ketahanan Sistem (Auto-Fallback)

**`gemini-3.6-flash`** dengan cadangan otomatis (**auto-fallback**) ke **`gemini-3.5-flash`** (via Google Generative AI SDK `@google/generative-ai`).

> **Riwayat keputusan & ketahanan runtime:**
> 1. Awalnya direncanakan `gemini-2.5-flash`, tetapi Google sudah mendeprekasinya per September 2026.
> 2. Model utama ditetapkan ke `gemini-3.6-flash`.
> 3. Dalam pengujian beban, server Google untuk model `3.6-flash` terkadang mengalami lonjakan antrean (*high demand spike / 503 Service Unavailable*) yang bisa menahan koneksi hingga 5 menit jika tanpa batas waktu.
> 4. **Solusi:** Sistem menerapkan batas waktu **timeout 25 detik** via `AbortController`. Jika `gemini-3.6-flash` terkena timeout atau error 503/429, sistem **secara otomatis langsung beralih ke `gemini-3.5-flash`** di latar belakang. Hasil pengujian riil membuktikan `gemini-3.5-flash` mampu menyelesaikan ekstraksi secara stabil dalam **15–16 detik**.

Alasan pemilihan:
- Volume pemakaian rendah (±4–5 laporan/bulan), prioritas diberikan ke akurasi tulisan tangan.
- Mendukung input gambar langsung via base64 `inlineData`.
- Mendukung **structured output** (JSON mode terjamin).

### Structured Output (JSON Mode)

Menggunakan fitur `responseMimeType: "application/json"` dan `responseSchema` dari Gemini API untuk mengekstrak transaksi dan catatan saldo fisik buku kas:

```typescript
const schema = {
  type: "object",
  properties: {
    initialBalance: {
      type: "integer",
      nullable: true,
      description: "Saldo awal / saldo lalu yang tertulis di bagian atas",
    },
    finalBalance: {
      type: "integer",
      nullable: true,
      description: "Total saldo kas akhir yang tertulis di bagian bawah",
    },
    transactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["pemasukan", "pengeluaran"] },
          amount: { type: "integer" },
          description: { type: "string" },
          transactionDate: { type: "string", nullable: true }, // ISO date
        },
        required: ["type", "amount", "description"],
      },
    },
  },
  required: ["transactions"],
};
```

### Alur API — Ekstraksi

**`POST /api/attachments/:id/extract`**

**Wajib: Khusus Staf DKM (`ADMIN` atau `BENDAHARA`). Akses tanpa sesi mengembalikan `401`, role `null` mengembalikan `403 Forbidden`.**

**Logika Server-Side:**
1. Validasi sesi — 401 jika tidak ada.
2. Ambil `Attachment` berdasarkan `:id`; tolak dengan `400` jika `fileType !== "image"` atau status sedang `processing`.
3. Update `extractionStatus` → `processing`.
4. Ambil file gambar dari `fileUrl` (Supabase Storage), kirim sebagai inline data base64 ke Gemini API dengan timeout 25s dan auto-fallback ke `gemini-3.5-flash`.
5. **Jika berhasil:**
   - Parse response JSON (`transactions[]`, `initialBalance`, `finalBalance`).
   - `prisma.$transaction`:
     - Hapus transaksi lama yang **belum diverifikasi** (`where: { attachmentId: id, isVerified: false }`). Transaksi `isVerified = true` tetap utuh.
     - Insert transaksi baru hasil ekstraksi (`isVerified: false`).
     - Update `Attachment` (`extractionStatus = "done"`, `extractionModel`, `extractionRawResponse`, `extractedAt`, `extractionError = null`).
     - Jika `initialBalance` atau `finalBalance` berhasil dibaca oleh Gemini: Update `Report` induk dengan nilai saldo tersebut (bukan `Attachment` — saldo adalah properti laporan, bukan file).
     - Jika model yang dipakai adalah model cadangan (bukan model utama), badge **"Model Cadangan"** tampil di UI di samping status ekstraksi.
6. **Jika gagal**:
   - Update `Attachment` (`extractionStatus = "failed"`, `extractionError` diisi pesan singkat ramah pengguna).

**Response 200 (berhasil)**

```json
{
  "data": {
    "attachmentId": "att_1",
    "extractionStatus": "done",
    "transactionsCreated": 4,
    "initialBalance": 1485000,
    "finalBalance": 1605000
  }
}
```

### Rekonsiliasi Kas Mingguan Otomatis

Di halaman detail laporan, sistem menghitung:
* `totalMasuk` = `sum(amount)` transaksi terverifikasi bertipe `pemasukan`
* `totalKeluar` = `sum(amount)` transaksi terverifikasi bertipe `pengeluaran`
* `netChange` = `totalMasuk - totalKeluar`
* `calculatedFinal` = `initialBalance + netChange`
* **Pencocokan**: Jika `Math.abs(calculatedFinal - finalBalance) < 1`, lencana hijau **"Perhitungan buku kas seimbang"** muncul. Jika berbeda, alert selisih ditampilkan untuk membantu pengecekan.

### Proteksi Penghapusan (409 Conflict)

* `DELETE /api/reports/:id` dan `DELETE /api/attachments/:id` dilengkapi perlindungan integritas data:
  Jika terdapat transaksi yang sudah diverifikasi (`isVerified = true`), API merespons dengan `409 Conflict` dan payload `{ hasVerifiedTransactions: true, verifiedCount: N }`.
  Penghapusan paksa hanya diizinkan jika menyertakan query parameter `?force=true` setelah dikonfirmasi eksplisit lewat `AlertDialog`.

Semua endpoint mutasi di atas dilindungi RBAC: `DELETE /api/reports/:id` khusus untuk Administrator (`ADMIN`), sedangkan `DELETE /api/attachments/:id` dapat diakses oleh Staf (`ADMIN` atau `BENDAHARA`). Akses tanpa sesi mengembalikan `401`, dan akun non-staf (`role: null`) mengembalikan `403 Forbidden`.

## Estimasi Biaya Fase Mendatang (Catatan V4)

Ekstraksi via Gemini API free tier: **Rp 0** untuk tahap development (dengan catatan privasi di atas). Jika nanti perlu upgrade ke paid tier untuk produksi, estimasi biaya tetap sangat rendah untuk skala 1 masjid (±4–5 laporan/bulan) — perlu verifikasi harga terkini di halaman resmi Gemini API sebelum go-live, karena harga & struktur tier dapat berubah.

## V5 — Spesifikasi Teknis: Financial Intelligence

### Library Chart: Recharts (via shadcn/ui Charts)

Menggunakan komponen chart shadcn/ui (`<ChartContainer>`, `<ChartTooltip>`, dll) yang secara internal membungkus **Recharts**. Alasan: konsisten dengan komponen shadcn/ui lain yang sudah dipakai di seluruh aplikasi (Button, Card, Dialog), dan Recharts sudah cukup matang untuk kebutuhan grafik batang/garis sederhana tanpa perlu library charting yang lebih berat (D3 mentah, Chart.js, dll).

```bash
npx shadcn@latest add chart
```

### Skema Prisma Tambahan

```prisma
model Donor {
  id             String        @id @default(cuid())
  name           String        // Nama tampilan (canonical)
  normalizedName String        @unique // Kunci pencocokan fuzzy — lowercase, whitespace rapi, prefix gelar dihapus
  contact        String?
  transactions   Transaction[]
}

model Transaction {
  // ...field V4 sebelumnya tetap sama...
  donorNameRaw String?  // V5: nama mentah hasil ekstraksi/input manual, sebelum matching
  donorId      String?  // V5: null jika belum di-assign, kosong, atau anonim
  donor        Donor?   @relation(fields: [donorId], references: [id])
}
```

### Fungsi Normalisasi Nama (Fuzzy Matching)

```typescript
const DONOR_PREFIXES = [
  "bpk", "bapak", "ibu", "sdr", "sdri", "mas", "mbak",
  "h.", "hj.", "ust", "ustadz", "ustadzah",
];

const ANONYMOUS_PATTERNS = ["hamba allah", "anonim", "tanpa nama"];

function normalizeDonorName(raw: string): string {
  let normalized = raw.trim().toLowerCase().replace(/\s+/g, " ");
  for (const prefix of DONOR_PREFIXES) {
    const pattern = new RegExp(`^${prefix}\\.?\\s+`, "i");
    normalized = normalized.replace(pattern, "");
  }
  return normalized.trim();
}

function isAnonymousDonor(normalized: string): boolean {
  return ANONYMOUS_PATTERNS.some((pattern) => normalized.includes(pattern));
}
```

### Alur Matching Saat Konfirmasi Transaksi

Diterapkan sebagai perluasan pada `POST /api/transactions/:id/confirm` (endpoint yang sama dari V4, bukan endpoint baru):

1. Ambil `donorNameRaw` dari body request (opsional, cuma relevan untuk `type: "pemasukan"`)
2. Jika kosong atau `null` → lanjut konfirmasi seperti biasa, `donorId` tetap `null`
3. Normalisasi via `normalizeDonorName()`. Jika `isAnonymousDonor()` bernilai true → `donorId` tetap `null` (donasi dihitung sebagai agregat "Infaq Anonim", bukan `Donor` individual)
4. Cari `Donor` dengan `normalizedName` yang cocok persis:
   - **Ketemu** → `donorId` = id `Donor` tersebut
   - **Tidak ketemu** → buat `Donor` baru (`name` = teks asli sebelum normalisasi, `normalizedName` = hasil normalisasi)
5. Set `isVerified = true`, `verifiedById`, `verifiedAt` (logika V4 yang sudah ada, tidak berubah)

### Query Agregasi Tren (Dashboard Publik — Revisi Issue #053)

Dalam revisi Issue #053, pengelompokan mingguan diselaraskan 100% dengan lembar kas fisik masjid:
- **Mingguan (Jumat)**: Agregasi dikelompokkan langsung berdasarkan entity `Report` (`reportId` & `r.reportDate` hari Jumat), bukan men-truncate `transactionDate`. Hal ini memastikan seluruh transaksi dalam satu lembar laporan mingguan tidak terpecah dan jumlahnya identik dengan fisik.
- **Bulanan**: Agregasi dikelompokkan berdasarkan bulan terbit laporan (`DATE_TRUNC('month', r."reportDate")`).

```typescript
// Agregasi mingguan berbasis Report.reportDate (Jumat)
const aggregated = await prisma.transaction.groupBy({
  by: ["reportId", "type"],
  where: {
    isVerified: true,
    reportId: { in: reportIds },
  },
  _sum: { amount: true },
});
```

### Rentang Dinamis Dashboard (Issue #053)

- **Bukan mundur dari hari ini**: Alih-alih selalu mengenerate 12 slot mundur dari tanggal hari ini (`now`) yang membuat grafik didominasi slot kosong di tahap awal, sistem mencari laporan kas terverifikasi yang ada di database secara kronologis ascending (maksimal 12 periode terakhir).
- Jika baru ada 3 laporan (misal 3 Apr, 31 Jul, 18 Sep), grafik menampilkan 3 periode tersebut secara presisi.
- Jika database kosong total, endpoint mengembalikan array kosong `{ data: { granularity, points: [] } }` dan UI menampilkan empty state yang jelas.

### Endpoint Mutasi Tambahan V5 (Issue #051)

1. **`PATCH /api/transactions/:id/donor`**:
   - Memungkinkan pengubahan nama donatur khusus pada transaksi yang sudah berstatus `isVerified = true`.
   - Mengubah `donorNameRaw`, menjalankan ulang matching/tuntasan ke `Donor`, dan mengupdate total kontribusi donatur lama dan baru tanpa mengutak-atik angka kas (`amount`).
2. **`POST /api/transactions/:id/unverify`**:
   - Membatalkan status verifikasi transaksi (`isVerified = false`).
   - Mengurangi kontribusi donatur terkait (jika pemasukan berdonatur) dan menyesuaikan saldo/kalkulasi kas. Transaksi otomatis keluar dari dashboard publik dan kembali ke antrean review bendahara.

### Endpoint Publik & Isolasi dari Data Belum Terverifikasi

Endpoint V5 (`GET /api/dashboard/trend`, `GET /api/donors`, `GET /api/donors/:id`) **tidak memerlukan sesi NextAuth** (publik), tetapi **setiap query di dalamnya WAJIB menyertakan `isVerified: true`** sebagai kondisi `WHERE` — tidak ada jalur kode yang mengembalikan transaksi `isVerified: false` dari endpoint-endpoint ini, baik untuk pengguna login maupun tidak (beda dengan `GET /api/reports/:id/transactions` di V4 yang memang dirancang menampilkan lebih banyak data untuk pengguna dengan sesi aktif — endpoint V5 ini sengaja tidak punya jalur "tampilkan semua" sama sekali, karena tujuannya murni tampilan publik).

### Catatan Desain: `finalBalance` sebagai KPI Card Terpisah (Wajib untuk #051/#052)

**Keputusan arsitektur:** `Report.finalBalance` (saldo akhir kas mingguan terakhir) **sengaja tidak dimasukkan** ke dalam response `GET /api/dashboard/trend` per-titik, karena saldo kas bukan agregasi per-periode — ia adalah nilai tunggal snapshot dari laporan terakhir.

**Tanggung jawab tampilan ini DIPINDAH ke fase UI dashboard (#051/#052):**

- Di halaman dashboard publik, `finalBalance` dari `Report` terbaru yang memiliki `finalBalance` tidak null WAJIB ditampilkan sebagai **KPI Card "Saldo Kas Terkini"** di atas grafik tren.
- Sumber data: `GET /api/reports?limit=1` atau query langsung `prisma.report.findFirst({ where: { finalBalance: { not: null } }, orderBy: { reportDate: "desc" } })`.
- **JANGAN biarkan informasi ini hilang total** hanya karena tidak ada di endpoint tren. Ini adalah salah satu informasi paling relevan bagi jemaah yang mengakses dashboard publik.
- Referensi acceptance criteria: F-014 di `09-Feature-Specification.md` — *"Menampilkan total pemasukan vs pengeluaran per periode, plus saldo akhir kas (dari `Report.finalBalance`) sebagai referensi."*

---

## Spesifikasi Teknis — Fase V7: Rekap & Transparansi Pengeluaran Per Kategori (Issue #059)

### Data Model & Enum Kategori
- Model `Transaction` diperluas dengan kolom `category String?` (nullable, additive).
- Set kategori bersifat tetap (enum aplikasi di `lib/expense-categories.ts`, bukan tabel database relasional terpisah):
  - `operasional`: Tagihan PLN, PDAM, internet, sabun/kebersihan.
  - `honor`: Honor khotib Jumat, imam, marbot, ustadz kajian.
  - `sosial`: Santunan fakir miskin, anak yatim, bantuan warga dhuafa.
  - `pembangunan`: Renovasi atap/kubah, material bangunan, semen, keramik.
  - `konsumsi`: Snack rapat pengurus DKM, konsumsi jemaah pengajian.
  - `administrasi`: ATK, cetak berkas, meterai, biaya admin bank.
  - `lainnya`: Pengeluaran yang tidak masuk kategori di atas.
  - `null`: "Tidak Dikategorikan" (menjaga kompatibilitas data historis).

### Endpoint Publik V7
- **`GET /api/expenses`**:
  - Mengembalikan agregasi total nominal pengeluaran dan breakdown groupBy kategori.
  - **Isolasi Mutlak**: Query wajib menyertakan `where: { isVerified: true, type: "pengeluaran" }`.
- **`GET /api/expenses/transactions`**:
  - Mengembalikan daftar transaksi pengeluaran terverifikasi beserta relasi laporannya.
  - Mendukung query param `category` (termasuk filter transaksi tanpa kategori `null`), `limit`, dan `offset`.

### Endpoint Mutasi V7
- **`PATCH /api/transactions/:id/category`**:
  - Hanya dapat diakses oleh sesi terautentikasi (bendahara/admin).
  - Khusus transaksi bertipe `pengeluaran`.
  - Hanya memperbarui nilai `category`, tidak menyentuh `amount`, `isVerified`, `verifiedById`, atau `transactionDate`.

### Penanganan Kompatibilitas Next.js 16 (App Router)
- **Route Handler NextAuth**:
  Pada Next.js 16 App Router, parameter `context.params` bertipe `Promise`. Karena handler bawaan `NextAuth` v4 mengevaluasi `context.params` secara synchronous, handler di `app/api/auth/[...nextauth]/route.ts` dibungkus dengan fungsi async wrapper yang melakukan `const params = await context.params;` sebelum diteruskan ke NextAuth. Hal ini mencegah error `CLIENT_FETCH_ERROR Unexpected token '<' (404 HTML)` saat browser memanggil `/api/auth/session` atau `/api/auth/providers`.

---

## Spesifikasi Teknis — Fase V8: Filter Periode Waktu & Analisis Keuangan Berkala (Issue #66)

### Modul Bersama Filter Waktu (`lib/period-filter.ts`)
Modul terpusat untuk standardisasi parsing dan pembentukan query filter waktu di seluruh endpoint dan UI:
1. **`parsePeriodParams(searchParams: URLSearchParams): PeriodFilter`**:
   - Membaca `year` dan `month` dari query URL.
   - Memvalidasi rentang tahun `2000 <= year <= 2100` dan bulan `1 <= month <= 12`.
   - Mengembalikan `{ year: number | null, month: number | null }`.
2. **`buildReportRelationFilter(period: PeriodFilter)`**:
   - Menghasilkan klausa filter relasi Prisma: `{ year?: number, month?: number }` yang disisipkan ke kondisi `where.report`.
3. **`getAvailableYears(): Promise<number[]>`**:
   - Menjalankan `prisma.report.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } })` untuk mendeteksi tahun-tahun yang memiliki arsip data kas aktif secara otomatis, disortir descending dan selalu menyertakan tahun berjalan.

### Komponen Antarmuka `PeriodFilterBar`
- Komponen client interaktif yang dipasang di halaman `/pengeluaran` dan `/donatur`.
- Dilengkapi tombol preset cepat: **Semua Waktu**, **Tahun Ini**, dan **Bulan Ini** untuk navigasi satu-klik.
- Selector dropdown Tahun dinamis dan selector Bulan (Semua Bulan, Jan–Des).
- Mendukung pembaruan URL via query parameter tanpa full page reload.

### Ekstensi Endpoint Backend V8
- **`GET /api/expenses` & `GET /api/expenses/transactions`**: Menerima parameter `year` dan `month`. Total pengeluaran, breakdown proporsi kategori, dan tabel rincian transaksi otomatis tersaring sesuai periode tersebut.
- **`GET /api/donors` & `GET /api/donors/anonymous/transactions`**: Menerima parameter `year` dan `month`. Kartu agregat Donatur Terdata, Infaq Anonim, dan ranking kontribusi donatur dihitung dinamis sesuai periode yang dipilih.
- **Isolasi Mutlak**: Query tetap mempertahankan `where: { isVerified: true }`.

---

## Spesifikasi Teknis — Fase V9: Filter Periode Fiskal & Ekspor Terpadu Tanpa Modal (Issue #067)

### Latar Belakang & Masalah
1. Mode grafik sebelumnya berbasis *rolling window* (8–12 pekan terakhir) yang terus bergeser dan tidak memungkinkan bendahara/jamaah meninjau laporan keuangan masa lalu (misal bulan Ramadhan atau tahun lalu).
2. Fitur ekspor kas bulanan sebelumnya terisolasi di dalam modal dialog popup terpisah (`MonthlyExportDialog`) yang mengharuskan pengguna memilih ulang bulan dan tahun, menimbulkan redundansi interaksi (tidak WYSIWYG).
3. Tampilan tahunan (12 bulan x 2 batang = 24 batang) sangat padat di layar ponsel (< 768 px) jika dipaksakan sekaligus.

### Desain Solusi V9
1. **Global Fiscal Filter Terpadu**:
   - Selector Bulan (Jan–Des) dan Tahun diintegrasikan langsung pada toolbar ringkasan kas dashboard di samping tombol toggle mode grafik.
   - **Mode Mingguan:** Menampilkan 4 atau 5 pekan (hari Jumat) di dalam bulan dan tahun yang dipilih secara presisi.
   - **Mode Tahunan:** Menampilkan 12 bulan (Jan–Des) di tahun yang dipilih pada layar desktop (>= 768 px).
   - **Semester Mobile Toggle (Smt 1 & Smt 2):** Khusus layar mobile (< 768 px) pada mode tahunan, grafik dipecah menjadi dua semester (`Jan - Jun` dan `Jul - Des`) agar kapasitas grafik tetap optimal (6 titik = 12 batang), mudah disentuh, dan tidak berdesakan.
2. **Ekspor & Cetak Terpadu (Zero Modal)**:
   - Tombol **Cetak (Mading A4)**, **Unduh PDF (.pdf)**, dan **Unduh Excel (.xlsx)** dikeluarkan dari modal dan diletakkan langsung di samping selector periode.
   - Mengklik cetak atau unduh langsung mengeksekusi dokumen untuk bulan dan tahun yang sedang aktif di layar tanpa popup tambahan.
3. **Penyelarasan Kartu KPI & Sumbu X**:
   - Kartu KPI (Total Pemasukan, Total Pengeluaran, Arus Kas Bersih) menghitung data agregat dari periode yang dipilih di dropdown.

---

## Arsitektur Shell Universal & Identitas Brand Resmi (AppShell & Brand Icon)

### 1. Komponen Universal `AppShell` (`components/app-shell.tsx`)
- Menggantikan layout terfragmentasi dengan wrapper arsitektural tunggal yang mencakup seluruh halaman aplikasi.
- **Desktop Sidebar**:
  - Lebar tetap `260px` (`w-[260px]`), posisi fixed di sisi kiri dengan background `surface-container` dan pembatas `border-r border-outline-variant`.
  - Brand header dengan logo masjid, judul "Masjid Archive", dan subjudul "Sistem Kas & Arsip".
  - Navigasi link berikon Lucide (`Laporan`, `Dashboard`, `Donatur`, `Pengeluaran`, `Cari`, `Unggah`, dan dinamis `Pengguna` khusus role `ADMIN`).
  - Kartu transparansi di bagian bawah sidebar.
- **Mobile Navigation**:
  - Bilah navigasi bawah (*bottom bar*) responsif dengan tap target WCAG (≥ 44px) dan padding safe area.
  - Header konteks ringkas dengan logo dan tombol autentikasi Google.

### 2. Standarisasi Ikon Brand & Favicon Resmi
- Seluruh aset identitas brand diselaraskan menggunakan vektor resmi kubah masjid hijau dan aksen emas:
  - `public/favicon.svg` & `app/icon.svg`: Vektor SVG resolusi tinggi dengan squircle base, gradien hijau Islamic brand (`#0f340d` → `#1b5417`), kubah putih, dan finial bulan sabit emas (`#fde047` → `#eab308`).
  - Komponen `MasjidEmblem` di `components/app-shell.tsx` menampilkan ikon vektor resmi tersebut (`/favicon.svg`) sehingga identitas visual di sidebar desktop, header mobile, dan tab peramban 100% konsisten.
  - Judul tab peramban distandarisasi dengan format Shopee-style: `Masjid Archive | [Halaman]` di seluruh rute via metadata Next.js.

---

## Spesifikasi Teknis — Fase V10: Cetak & Ekspor Kas Tahunan Penuh & Perapihan Toolbar (Issue #068)

### 1. Perapihan Toolbar Dashboard (`components/dashboard-client.tsx`)
- Menghapus tombol `PDF` (direct download) yang memicu redundansi UX dengan pratinjau cetak.
- Mengubah tombol pertama menjadi **`Cetak Laporan`** dengan perilaku dinamis:
  - Mode Mingguan: memanggil rute bulanan `/laporan/cetak/bulanan?year=${selectedYear}&month=${selectedMonth}`.
  - Mode Tahunan: memanggil rute tahunan `/laporan/cetak/tahunan?year=${selectedYear}`.
- Tombol `Excel` secara dinamis mengekspor bulanan (`/api/reports/export/monthly/excel`) saat mode mingguan, atau tahunan (`/api/reports/export/yearly/excel`) saat mode tahunan.

### 2. Halaman Cetak Laporan Tahunan (`app/laporan/cetak/tahunan/page.tsx`)
- Komponen Server Component yang menerima parameter `year` (contoh: `?year=2026`).
- Mengumpulkan seluruh laporan dan transaksi kas terverifikasi (`isVerified: true`) di tahun tersebut.
- Menyusun rekapitulasi 12 bulan (Januari s/d Desember) mencakup:
  - Jumlah laporan pekanan per bulan
  - Pemasukan bulanan & pengeluaran bulanan
  - Selisih surplus/defisit bersih per bulan
  - Saldo akhir kas kumulatif
- Menghadirkan tabel seluruh mutasi transaksi kas tahunan secara kronologis.
- Dilengkapi Kop DKM Al-Luqman, ringkasan saldo, kolom pengesahan (Ketua DKM & Bendahara), dan bar aksi cetak `PrintActionBar`.

### 3. Modul Ekspor PDF & Excel Tahunan
- **`lib/export-pdf.ts`**: Menambahkan fungsi `generateYearlyReportPdf(data: YearlyReportExportData)` berbasis `pdf-lib` untuk dokumen PDF vektor multi-halaman A4.
- **`lib/export-excel.ts`**: Menambahkan fungsi `generateYearlyReportExcel(data: YearlyReportExportData)` berbasis `xlsx` dengan sheet ringkasan 12 bulan dan sheet mutasi detail.
- **Endpoint Route Handlers**:
  - `app/api/reports/export/yearly/pdf/route.ts`: mengembalikan file `.pdf`.
  - `app/api/reports/export/yearly/excel/route.ts`: mengembalikan file `.xlsx`.

