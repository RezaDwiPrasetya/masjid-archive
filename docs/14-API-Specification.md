# 14. API Specification (Revisi — V2: Multi-Format Upload)

> **Catatan revisi:** Dokumen ini memperbarui API Specification awal untuk mendukung Fase V2. Perubahan utama mencakup transisi dari unggahan satu foto lokal menjadi unggahan multi-file (gambar, PDF, Excel) ke Supabase Storage, menggunakan entitas `Attachment`, dan dikelola lewat database transaction Vercel Postgres.

## Overview

API di-implementasi sebagai Next.js Route Handlers (`app/api/**/route.ts`). Semua endpoint di bawah `/api/reports`, `/api/users` memerlukan session cookie valid (lihat [12. Technical Specification — Auth Model](./12-Technical-Specification.md#auth-model)), kecuali `/api/auth/login`.

Format response standar:

```json
// Sukses
{ "data": ... }

// Error
{ "error": "Pesan error singkat" }
```

---

## Auth

### `POST /api/auth/login`

Verifikasi kredensial bersama, set session cookie.

**Request body**

```json
{ "username": "string", "password": "string" }
```

**Response 200**

```json
{ "data": { "success": true } }
```

**Response 401**

```json
{ "error": "Username atau kata sandi salah" }
```

### `POST /api/auth/logout`

Hapus session cookie. Response 200 `{ "data": { "success": true } }`.

---

## Users (Pengurus)

### `GET /api/users`

Daftar pengurus DKM — dipakai untuk dropdown "Diunggah oleh" di form Unggah Laporan.

**Response 200**

```json
{
  "data": [
    { "id": "usr_1", "name": "Bapak Kosasih", "role": "Bendahara 2" },
    { "id": "usr_2", "name": "Bapak Cecep", "role": "Bendahara 1" }
  ]
}
```

---

## Reports (Laporan) & Attachments (Lampiran)

### `GET /api/reports`

List laporan, terkelompok Tahun → Bulan (untuk Arsip Laporan), atau hasil filter (untuk Cari Arsip).

**Query params**

| Param     | Tipe   | Wajib | Keterangan                                      |
| --------- | ------ | ------ | ----------------------------------------------- |
| `year`    | number | tidak | filter tahun                                    |
| `month`   | number | tidak | filter bulan                                    |
| `keyword` | string | tidak | cari berdasarkan tanggal/teks terkait laporan |

**Response 200 (contoh tanpa filter — dikelompokkan)**

```json
{
  "data": [
    {
      "year": 2026,
      "months": [
        {
          "month": 8,
          "reports": [
            {
              "id": "rpt_1",
              "reportDate": "2026-08-14",
              "weekOfMonth": 2,
              "uploadedAt": "2026-08-14T10:00:00Z",
              "uploadedBy": { "id": "usr_1", "name": "Bapak Kosasih" },
              "attachments": [
                {
                  "id": "att_1",
                  "fileType": "image",
                  "fileUrl": "https://[supabase-url]/storage/v1/object/public/report-photos/foto.jpg"
                },
                {
                  "id": "att_2",
                  "fileType": "pdf",
                  "fileUrl": "https://[supabase-url]/storage/v1/object/public/report-photos/rekap.pdf"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Response 200 (kosong / tidak ditemukan)**

```json
{ "data": [] }
```

### `POST /api/reports`

Unggah laporan baru dengan banyak file pendukung. `multipart/form-data`.

**Form fields**

| Field          | Tipe                | Wajib | Keterangan |
| -------------- | ------------------- | ----- | ---------- |
| `files`        | array of files      | Yes   | Mendukung `.jpg`, `.png`, `.pdf`, `.xlsx`. Minimal 1 file. |
| `reportDate`   | date (`YYYY-MM-DD`) | Yes   | Tanggal laporan mingguan (harus hari Jumat). |
| `uploadedById` | string (User id)    | Yes   | ID pengunggah (bendahara). |

**Logika Transaksi (V2 Strict Rule):**
1. API harus mengekstrak semua file dari *form data* dan memvalidasi tipe/ukuran tiap file.
2. Cek duplikat: pastikan belum ada `Report` dengan `reportDate` yang sama — jika sudah ada, tolak di awal (sebelum upload apa pun dimulai) dengan status `409`.
3. Gunakan `Promise.all` untuk mengunggah seluruh *file* secara paralel ke bucket **Supabase Storage**.
4. Jika *semua* unggahan Supabase berhasil, susun array data lampiran (URL, nama asli, ukuran, tipe).
5. Gunakan `prisma.$transaction` untuk melakukan *insert* ke tabel `Report` DAN `Attachment` secara atomik di **Vercel Postgres**.
6. **Jika salah satu unggahan ke Supabase gagal:**
   - Hapus (`storage.remove()`) semua file yang **sudah terlanjur berhasil** diupload di langkah 3 pada percobaan yang sama, agar tidak menyisakan file "yatim" (tidak punya `Attachment` terkait) di storage.
   - Batalkan seluruh proses, jangan buat record apa pun di database.
7. **Jika insert ke database (langkah 5) gagal** setelah upload storage berhasil (kasus langka, misal koneksi database terputus): hapus juga semua file yang sudah terupload di langkah 3, karena `prisma.$transaction` sudah otomatis rollback sisi database — storage harus disinkronkan manual (dibersihkan) karena berada di sistem terpisah dan tidak ikut ter-rollback otomatis.

**Response 201**

```json
{
  "data": {
    "id": "rpt_25",
    "reportDate": "2026-08-14",
    "year": 2026,
    "month": 8,
    "weekOfMonth": 2,
    "attachments": [
      { "id": "att_1", "fileName": "foto-kas.jpg", "status": "uploaded" },
      { "id": "att_2", "fileName": "data-donatur.xlsx", "status": "uploaded" }
    ]
  }
}
```

**Response 400** (Validasi gagal — file kosong, tipe ditolak, ukuran over-limit, bukan hari Jumat)

```json
{ "error": "Tipe file tidak didukung atau ukuran terlalu besar." }
```

**Response 409** (Duplikat tanggal — dicek di awal, sebelum proses upload dimulai)

```json
{ "error": "Laporan untuk tanggal tersebut sudah tersimpan" }
```

**Response 500** (Gagal transaksi Supabase/Prisma — file yang sempat terupload sudah dibersihkan otomatis sesuai langkah 6/7)

```json
{ "error": "Gagal menyimpan lampiran. Silakan coba lagi." }
```

### `GET /api/reports/:id`

Detail satu laporan (untuk halaman Detail Laporan).

**Response 200**

```json
{
  "data": {
    "id": "rpt_1",
    "reportDate": "2026-08-14",
    "weekOfMonth": 2,
    "uploadedAt": "2026-08-14T09:00:00Z",
    "uploadedBy": { "id": "usr_1", "name": "Bapak Kosasih", "role": "Bendahara 2" },
    "attachments": [
      {
        "id": "att_1",
        "fileType": "image",
        "originalFileName": "foto-kas.jpg",
        "fileSizeBytes": 2500000,
        "fileUrl": "https://[supabase-url]/..."
      },
      {
        "id": "att_2",
        "fileType": "pdf",
        "originalFileName": "laporan-rekap.pdf",
        "fileSizeBytes": 1200000,
        "fileUrl": "https://[supabase-url]/..."
      }
    ]
  }
}
```

**Response 404**

```json
{ "error": "Laporan tidak ditemukan" }
```

---

## Ringkasan Endpoint

| Method | Path               | Fungsi                         | Terkait Issue          |
| ------ | ------------------- | --------------------------------- | ------------------------- |
| POST   | `/api/auth/login`  | Login akun bersama             | (Task 04 Entry)        |
| POST   | `/api/auth/logout` | Logout                         | (Task 04 Entry)        |
| GET    | `/api/users`       | Daftar pengurus untuk dropdown | #002                   |
| GET    | `/api/reports`     | List/kelompok/cari laporan     | #011, #016             |
| POST   | `/api/reports`     | Unggah laporan (Multi-File)    | #026, #027             |
| GET    | `/api/reports/:id` | Detail laporan beserta lampiran| #021, #028             |
