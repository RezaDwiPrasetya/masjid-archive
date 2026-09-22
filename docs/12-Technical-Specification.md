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
| **Auth** | **NextAuth.js (Auth.js)** | Menggunakan Google Provider (OAuth 2.0) dan `@auth/prisma-adapter` |
| **Vision-LLM (V4)** | **Google Gemini API** (`@google/generative-ai`) | Free tier untuk tahap development — lihat bagian V4 di bawah |
| **Visualisasi (V5)** | **Recharts** (via `shadcn/ui` Charts, yang membungkus Recharts) | Lihat bagian V5 di bawah |
| Hosting | Vercel | |

## Arsitektur: Kenapa Database dan File Storage Beda Provider?

Ini keputusan arsitektur yang disengaja, bukan solusi sementara:
- **Database (Vercel Postgres)**: menyimpan data terstruktur (User, Report, Attachment, Transaction) yang butuh query relasional, transaksi, dan filtering
- **File Storage (Supabase Storage)**: menyimpan file besar (foto, PDF, Excel) di object storage yang memang dirancang untuk itu — bukan disimpan sebagai binary di database

Pola ini disebut **separation of concerns**, umum dipakai di aplikasi production (kombinasi database + object storage terpisah). Tidak ada kebutuhan untuk menyatukan keduanya ke satu provider.

## Auth Model (V3)

- Beralih menggunakan **NextAuth.js (Auth.js)** dengan **Google Provider**.
- Kredensial bersama statis sepenuhnya dihapus.
- Data sesi dan identitas pengguna dikelola langsung di Vercel Postgres menggunakan `@auth/prisma-adapter`.
- Proxy Next.js (`proxy.ts`) melindungi rute `/unggah`. Penggunaan `middleware.ts` dihindari karena deprecated di Next.js 16. Semua *endpoint* API mutasi (POST, DELETE) di bawah `/api/reports` divalidasi status sesinya secara *server-side* (menolak akses jika tidak ada sesi aktif).

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

**Wajib: Request harus memiliki Sesi NextAuth yang valid.**

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

Semua endpoint di atas wajib sesi NextAuth valid (`401` jika tidak).

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

### Query Agregasi Tren (Dashboard Publik)

```typescript
// Contoh agregasi bulanan — hanya transaksi terverifikasi
const monthlyTrend = await prisma.transaction.groupBy({
  by: ["type"],
  where: {
    isVerified: true,
    transactionDate: { gte: startDate, lte: endDate },
  },
  _sum: { amount: true },
  // dikelompokkan lebih lanjut per bulan di level aplikasi
  // (Prisma groupBy tidak mendukung date_trunc langsung;
  //  gunakan raw query $queryRaw untuk agregasi per periode kalender)
});
```

> **Catatan implementasi:** untuk agregasi per-minggu/per-bulan yang presisi (mengelompokkan berdasarkan kalender, bukan cuma `type`), gunakan `prisma.$queryRaw` dengan `DATE_TRUNC('week', "transactionDate")` atau `DATE_TRUNC('month', "transactionDate")` di PostgreSQL — `groupBy` bawaan Prisma tidak mendukung truncation tanggal secara native.

### Rentang Default Dashboard

- Mode Mingguan: 12 minggu terakhir dari hari ini
- Mode Bulanan: 12 bulan terakhir dari bulan ini
- Query selalu difilter `isVerified: true` — tidak ada mode/flag apa pun yang bisa menampilkan transaksi belum terverifikasi di endpoint publik ini

### Endpoint Publik & Isolasi dari Data Belum Terverifikasi

Endpoint V5 (`GET /api/dashboard/trend`, `GET /api/donors`, `GET /api/donors/:id`) **tidak memerlukan sesi NextAuth** (publik), tetapi **setiap query di dalamnya WAJIB menyertakan `isVerified: true`** sebagai kondisi `WHERE` — tidak ada jalur kode yang mengembalikan transaksi `isVerified: false` dari endpoint-endpoint ini, baik untuk pengguna login maupun tidak (beda dengan `GET /api/reports/:id/transactions` di V4 yang memang dirancang menampilkan lebih banyak data untuk pengguna dengan sesi aktif — endpoint V5 ini sengaja tidak punya jalur "tampilkan semua" sama sekali, karena tujuannya murni tampilan publik).

### Catatan Desain: `finalBalance` sebagai KPI Card Terpisah (Wajib untuk #051/#052)

**Keputusan arsitektur:** `Report.finalBalance` (saldo akhir kas mingguan terakhir) **sengaja tidak dimasukkan** ke dalam response `GET /api/dashboard/trend` per-titik, karena saldo kas bukan agregasi per-periode — ia adalah nilai tunggal snapshot dari laporan terakhir.

**Tanggung jawab tampilan ini DIPINDAH ke fase UI dashboard (#051/#052):**

- Di halaman dashboard publik, `finalBalance` dari `Report` terbaru yang memiliki `finalBalance` tidak null WAJIB ditampilkan sebagai **KPI Card "Saldo Kas Terkini"** di atas grafik tren.
- Sumber data: `GET /api/reports?limit=1` atau query langsung `prisma.report.findFirst({ where: { finalBalance: { not: null } }, orderBy: { reportDate: "desc" } })`.
- **JANGAN biarkan informasi ini hilang total** hanya karena tidak ada di endpoint tren. Ini adalah salah satu informasi paling relevan bagi jemaah yang mengakses dashboard publik.
- Referensi acceptance criteria: F-014 di `09-Feature-Specification.md` — *"Menampilkan total pemasukan vs pengeluaran per periode, plus saldo akhir kas (dari `Report.finalBalance`) sebagai referensi."*

