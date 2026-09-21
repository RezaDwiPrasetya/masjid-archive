# 12. Technical Specification

## Overview

Dokumen ini menjelaskan implementasi teknis Masjid Archive, mencakup kondisi produksi aktual (setelah deploy ke Vercel) dan spesifikasi teknis dari Fase V1 hingga V4 (Ekstraksi Data).

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
  id           String       @id @default(cuid())
  reportDate   DateTime
  year         Int
  month        Int
  weekOfMonth  Int
  uploadedAt   DateTime     @default(now())
  uploadedById String
  uploadedBy   User         @relation(fields: [uploadedById], references: [id])
  attachments  Attachment[]
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

### Model yang Dipakai

**`gemini-3.6-flash`** (via Google AI Studio / Gemini Developer API, package `@google/generative-ai`).

> **Riwayat keputusan:** dokumen ini awalnya menetapkan `gemini-2.5-flash`, tapi model tersebut sudah tidak tersedia untuk pengguna baru per pengujian runtime (September 2026) — Google mengarahkan ke `gemini-3.6-flash` sebagai penerusnya. Sudah diuji langsung dengan foto asli buku kas dan hasilnya akurat (6/6 transaksi terbaca benar, subtotal/saldo tidak ikut terekstrak sebagai transaksi).

Alasan pemilihan (tetap berlaku untuk `gemini-3.6-flash`):
- Volume pemakaian sangat rendah (±4–5 laporan/bulan → maksimal beberapa kali panggilan API per minggu), jadi batas kuota free tier (RPM/RPD) bukan kendala — prioritas diberikan ke **akurasi**, bukan kecepatan/volume. Varian `-lite` (mis. `gemini-3.5-flash-lite`) sengaja dihindari karena dioptimalkan untuk volume tinggi/latensi rendah dengan trade-off akurasi, sementara kasus kita (baca tulisan tangan) butuh akurasi maksimal.
- Mendukung input gambar (vision) langsung tanpa preprocessing.
- Mendukung **structured output** (JSON mode) — lihat di bawah.

> **Catatan implementasi (dari pengujian runtime):** gambar dikirim sebagai `inlineData` (base64), bukan URL langsung — karena Gemini API tidak bisa mengakses URL Supabase Storage yang butuh autentikasi. Server men-fetch gambar dulu dari Supabase, lalu mengirimkannya sebagai binary base64 ke Gemini.

> **Catatan free tier:** batas RPM/TPM/RPD di Gemini API free tier bersifat per-project dan bisa berubah — cek langsung di Google AI Studio project masing-masing sebelum implementasi, jangan berpatokan pada angka dari dokumen manapun yang bisa jadi sudah usang.

> **Catatan privasi (penting untuk dev → produksi):** pada free tier, data yang dikirim ke Gemini API **dapat dipakai Google untuk meningkatkan produk mereka** (beda dengan paid tier). Untuk tahap development ini oke, tapi sebelum go-live produksi sungguhan, pertimbangkan upgrade ke paid tier (billing aktif) supaya data laporan keuangan masjid tidak ikut dipakai untuk training pihak ketiga.

### Structured Output (JSON Mode)

Alih-alih meminta Gemini "tolong jawab dalam format JSON" lewat teks prompt biasa (rawan gagal parsing), gunakan fitur `responseMimeType: "application/json"` dan `responseSchema` dari Gemini API, supaya API menjamin balasan berupa JSON valid sesuai skema yang kita tentukan:

```typescript
const schema = {
  type: "object",
  properties: {
    transactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["pemasukan", "pengeluaran"] },
          amount: { type: "number" },
          description: { type: "string" },
          transactionDate: { type: "string", nullable: true }, // ISO date, jika tanggal terbaca
        },
        required: ["type", "amount", "description"],
      },
    },
  },
  required: ["transactions"],
};
```

### Desain Prompt

Prompt disusun untuk:
- Menjelaskan konteks (foto buku kas masjid, tulisan tangan, format kolom "PEMASUKAN KAS MESJID" / "PENGELUARAN KAS MESJID")
- Meminta model memisahkan tiap baris transaksi jadi satu entri, bukan menjumlahkan/meringkas
- Meminta model **tidak mengarang** angka yang tidak terbaca jelas — lebih baik description diisi catatan seperti "tulisan tidak terbaca jelas" daripada menebak angka
- Contoh format tanggal yang diharapkan (`YYYY-MM-DD`), dengan instruksi eksplisit boleh `null` jika tanggal per baris tidak tercantum di foto (misalnya hanya ada satu tanggal laporan mingguan di header)

### Alur API — Ekstraksi

**`POST /api/attachments/:id/extract`**

**Wajib: Request harus memiliki Sesi NextAuth yang valid.**

**Logika Server-Side:**
1. Validasi sesi — 401 jika tidak ada
2. Ambil `Attachment` berdasarkan `id`; tolak dengan `400` jika `fileType !== "image"` atau status sedang `processing`
3. Update `extractionStatus` → `processing`
4. Ambil file gambar dari `fileUrl` (Supabase Storage), kirim sebagai inline data ke Gemini API bersama prompt + schema
5. **Jika berhasil:**
   - Parse response JSON (`transactions[]`)
   - `prisma.$transaction`: hapus `Transaction` lama pada attachment ini yang `isVerified = false` (sisa percobaan sebelumnya), lalu insert `Transaction` baru per item hasil ekstraksi, dan update `Attachment` (`extractionStatus = "done"`, `extractionModel`, `extractionRawResponse`, `extractedAt`, `extractionError = null`)
6. **Jika gagal** (error API, response tidak sesuai schema, dsb.):
   - Update `Attachment` (`extractionStatus = "failed"`, `extractionError` diisi pesan singkat yang ramah pengguna)

**Response 200 (berhasil)**

```json
{
  "data": {
    "attachmentId": "att_1",
    "extractionStatus": "done",
    "transactionsCreated": 6
  }
}
```

**Response Error Umum:**
- `401 Unauthorized`: Sesi tidak valid
- `400 Bad Request`: Attachment bukan gambar, atau sedang diproses
- `502 Bad Gateway`: Gemini API gagal merespons/error (attachment tetap ditandai `failed`, bukan 500, karena ini kegagalan dependensi eksternal bukan bug server)

### Alur API — Review & Verifikasi Transaksi

**`GET /api/reports/:id/transactions`** — daftar transaksi (verified & unverified) untuk satu laporan, dipakai UI review.

**`PATCH /api/transactions/:id`** — edit field (`type`, `amount`, `description`, `transactionDate`) SEBELUM konfirmasi. Hanya diizinkan jika `isVerified = false`.

**`POST /api/transactions/:id/confirm`** — menandai `isVerified = true`, `verifiedById` dari sesi aktif, `verifiedAt = now()`. Menolak (`409`) jika transaksi sudah `isVerified = true` sebelumnya.

**`DELETE /api/transactions/:id`** — hapus baris transaksi. Menolak (`403`) jika `isVerified = true` (sesuai business rule F-012 — transaksi terverifikasi tidak bisa dihapus lewat alur normal).

Semua endpoint di atas wajib sesi NextAuth valid (`401` jika tidak).

## Estimasi Biaya Fase Mendatang (Catatan V4)

Ekstraksi via Gemini API free tier: **Rp 0** untuk tahap development (dengan catatan privasi di atas). Jika nanti perlu upgrade ke paid tier untuk produksi, estimasi biaya tetap sangat rendah untuk skala 1 masjid (±4–5 laporan/bulan) — perlu verifikasi harga terkini di halaman resmi Gemini API sebelum go-live, karena harga & struktur tier dapat berubah.
