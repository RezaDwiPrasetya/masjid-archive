# 12. Technical Specification

## Overview

Dokumen ini menjelaskan implementasi teknis Masjid Archive, mencakup kondisi produksi aktual (setelah deploy ke Vercel) dan spesifikasi teknis untuk V2 (multi-format upload).

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
| Auth | Session cookie via `iron-session`, kredensial bersama dari environment variable | Direncanakan berubah ke multi-user di V5 |
| Hosting | Vercel | |

## Arsitektur: Kenapa Database dan File Storage Beda Provider?

Ini keputusan arsitektur yang disengaja, bukan solusi sementara:
- **Database (Vercel Postgres)**: menyimpan data terstruktur (User, Report, Attachment, dan nanti Transaction/Donor) yang butuh query relasional, transaksi, dan filtering
- **File Storage (Supabase Storage)**: menyimpan file besar (foto, PDF, Excel) di object storage yang memang dirancang untuk itu — bukan disimpan sebagai binary di database

Pola ini disebut **separation of concerns**, umum dipakai di aplikasi production (kombinasi database + object storage terpisah). Tidak ada kebutuhan untuk menyatukan keduanya ke satu provider.

## Auth Model

- Satu kredensial bersama untuk seluruh pengurus DKM (`AUTH_USERNAME`, `AUTH_PASSWORD` di environment variable)
- Login memverifikasi kredensial → set session cookie (HTTP-only, via `iron-session`) → redirect ke halaman Arsip Laporan
- Identitas individu (Bendahara 1/2/Pengurus) dipakai sebagai pilihan "Diunggah oleh" saat mengisi form Unggah Laporan, mengisi field `uploadedById`
- Semua halaman selain `/login` dilindungi middleware yang mengecek session cookie

## Environment Variables

```
# Database (Vercel Postgres)
DATABASE_URL=

# File Storage (Supabase)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
AUTH_USERNAME=
AUTH_PASSWORD=
SESSION_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di server (API routes), tidak boleh diberi prefix `NEXT_PUBLIC_`, dan tidak boleh diekspos ke client.

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

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id      String   @id @default(cuid())
  name    String
  role    String
  reports Report[]
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
  id               String   @id @default(cuid())
  reportId         String
  report           Report   @relation(fields: [reportId], references: [id])
  fileUrl          String
  fileType         String   // "image" | "pdf" | "excel"
  originalFileName String
  fileSizeBytes    Int
  uploadedAt       DateTime @default(now())
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

## Estimasi Biaya Fase Mendatang (Catatan untuk V3)

Ekstraksi data via vision-LLM API (misalnya Claude) dikenakan biaya per pemanggilan, bukan biaya tetap. Untuk skala pemakaian 1 masjid dengan ±4-5 laporan/bulan, estimasi biaya berada di kisaran puluhan sen dolar per tahun — sangat rendah dibanding komponen biaya lain (hosting/storage). Perlu verifikasi harga terkini di halaman resmi provider sebelum implementasi, karena harga API dapat berubah.
