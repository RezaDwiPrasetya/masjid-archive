# 14. API Specification (Revisi — V3: Autentikasi SSO)

> **Catatan revisi:** Dokumen ini memperbarui API Specification awal untuk mendukung Fase V2 (Multi-Format) dan Fase V3 (Autentikasi SSO). Perubahan utama mencakup transisi pengelolaan sesi ke NextAuth.js dan otomatisasi identitas pengunggah (*uploader*) berbasis sesi aktif, bukan input klien.

## Overview

API di-implementasi sebagai Next.js Route Handlers (`app/api/**/route.ts`). Semua endpoint di bawah `/api/reports` dan `/api/users` **wajib** memiliki *session cookie* NextAuth yang valid. Akses tanpa sesi akan langsung ditolak dengan status `401 Unauthorized`.

Format response standar:

```json
// Sukses
{ "data": ... }

// Error
{ "error": "Pesan error singkat" }
```

---

## Auth (NextAuth V3)

### `GET/POST /api/auth/[...nextauth]`

Endpoint dinamis bawaan NextAuth.js. Menangani seluruh alur OAuth Google, *callback* verifikasi, dan manajemen sesi secara otomatis.

*Catatan: Endpoint manual `/api/auth/login` dan `/api/auth/logout` dari V1 telah dihapus sepenuhnya.*

---

## Users (Pengurus)

### `GET /api/users`

Daftar pengguna (pengurus) yang terdaftar di sistem.
*Catatan V3: Endpoint ini kini hanya digunakan untuk keperluan manajerial di dasbor admin, bukan lagi untuk dropdown form unggah, karena ID pengunggah kini otomatis diambil dari sesi aktif.*

**Response 200**

```json
{
  "data": [
    { "id": "clxyz123...", "name": "Bapak Kosasih", "email": "kosasih@gmail.com", "role": "Admin" }
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
              "uploadedBy": { "id": "clxyz123...", "name": "Bapak Kosasih", "image": "[https://lh3.googleusercontent.com/](https://lh3.googleusercontent.com/)..." },
              "attachments": [
                {
                  "id": "att_1",
                  "fileType": "image",
                  "fileUrl": "https://[supabase-url]/storage/v1/object/public/report-photos/foto.jpg"
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

### `POST /api/reports`

Unggah laporan baru dengan banyak file pendukung. `multipart/form-data`.
**Wajib: Request harus memiliki Sesi NextAuth yang valid.**

**Form fields**

| Field          | Tipe                | Wajib | Keterangan |
| -------------- | ------------------- | ----- | ---------- |
| `files`        | array of files      | Yes   | Mendukung `.jpg`, `.png`, `.pdf`, `.xlsx`. Minimal 1 file. |
| `reportDate`   | date (`YYYY-MM-DD`) | Yes   | Tanggal laporan mingguan (harus hari Jumat). |

*Catatan V3: Field `uploadedById` telah dihapus dari form payload karena rentan dimanipulasi. Server kini mengekstrak ID pengguna secara langsung dari objek `session.user.id` NextAuth.*

**Logika Transaksi Server-Side:**
1. **Validasi Sesi**: API mengekstrak ID pengguna dari sesi NextAuth. Jika tidak ada, kembalikan `401`.
2. Validasi file: Ekstrak file dari *form data* dan validasi tipe/ukuran.
3. Cek duplikat `reportDate` di Vercel Postgres (kembalikan `409` jika duplikat).
4. `Promise.all` unggah seluruh *file* secara paralel ke **Supabase Storage**.
5. Jika berhasil, susun data lampiran dan eksekusi `prisma.$transaction` untuk *insert* ke tabel `Report` (dengan `uploadedById` dari sesi) DAN `Attachment` secara atomik di **Vercel Postgres**.
6. Jika transaksi database gagal atau ada upload Supabase yang *error*, server otomatis menghapus (`storage.remove()`) file yang sempat terunggah agar tidak terjadi *orphan files* di bucket.

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
      { "id": "att_1", "fileName": "foto-kas.jpg", "status": "uploaded" }
    ]
  }
}
```

**Response Error Umum:**
- `401 Unauthorized`: Sesi NextAuth tidak valid atau kadaluarsa.
- `400 Bad Request`: Validasi tipe file/ukuran gagal.
- `409 Conflict`: Laporan untuk tanggal tersebut sudah tersimpan.
- `500 Internal Server Error`: Gagal transaksi penyimpanan.

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
    "uploadedBy": { "id": "clxyz123...", "name": "Bapak Kosasih", "image": "[https://lh3.google](https://lh3.google)..." },
    "attachments": [
      {
        "id": "att_1",
        "fileType": "pdf",
        "originalFileName": "laporan-rekap.pdf",
        "fileSizeBytes": 1200000,
        "fileUrl": "https://[supabase-url]/..."
      }
    ]
  }
}
```

---

## Ringkasan Endpoint V3

| Method | Path                           | Fungsi                         | Akses Publik |
| ------ | ------------------------------ | ------------------------------ | ------------ |
| GET/POST| `/api/auth/[...nextauth]`      | Alur SSO & Sesi NextAuth       | Ya           |
| GET    | `/api/users`                   | Daftar pengguna (admin)        | Tidak        |
| GET    | `/api/reports`                 | List/kelompok/cari laporan     | Ya (Baca)    |
| POST   | `/api/reports`                 | Unggah laporan (Multi-File)    | **Tidak**    |
| GET    | `/api/reports/:id`             | Detail laporan & lampiran      | Ya (Baca)    |
| DELETE | `/api/reports/:id`             | Hapus laporan beserta lampiran | **Tidak**    |
| DELETE | `/api/reports/:id/attachments` | Hapus satu lampiran spesifik   | **Tidak**    |