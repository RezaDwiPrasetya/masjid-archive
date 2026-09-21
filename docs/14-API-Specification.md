# 14. API Specification (Revisi — V4: Ekstraksi Data)

> **Catatan revisi:** Dokumen ini memperbarui API Specification untuk mendukung Fase V4 (Ekstraksi Data via Vision-LLM & Review/Verifikasi Transaksi), melanjutkan revisi V3 (Autentikasi SSO) sebelumnya.

## Overview

API di-implementasi sebagai Next.js Route Handlers (`app/api/**/route.ts`). Semua endpoint di bawah `/api/reports`, `/api/users`, `/api/attachments`, dan `/api/transactions` **wajib** memiliki *session cookie* NextAuth yang valid. Akses tanpa sesi akan langsung ditolak dengan status `401 Unauthorized`.

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
              "uploadedBy": { "id": "clxyz123...", "name": "Bapak Kosasih", "image": "https://lh3.googleusercontent.com/..." },
              "attachments": [
                {
                  "id": "att_1",
                  "fileType": "image",
                  "fileUrl": "https://[supabase-url]/storage/v1/object/public/report-photos/foto.jpg",
                  "extractionStatus": "not_extracted"
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
5. Jika berhasil, susun data lampiran dan eksekusi `prisma.$transaction` untuk *insert* ke tabel `Report` (dengan `uploadedById` dari sesi) DAN `Attachment` (dengan `extractionStatus` default `not_extracted`) secara atomik di **Vercel Postgres**.
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
    "uploadedBy": { "id": "clxyz123...", "name": "Bapak Kosasih", "image": "https://lh3.google..." },
    "attachments": [
      {
        "id": "att_1",
        "fileType": "pdf",
        "originalFileName": "laporan-rekap.pdf",
        "fileSizeBytes": 1200000,
        "fileUrl": "https://[supabase-url]/...",
        "extractionStatus": "not_extracted"
      }
    ]
  }
}
```

---

## Ekstraksi Data (V4)

### `POST /api/attachments/:id/extract`

Memicu ekstraksi data transaksi dari satu lampiran bergambar menggunakan vision-LLM (Gemini). **Hanya berlaku untuk `fileType = "image"`.**
**Wajib: Request harus memiliki Sesi NextAuth yang valid.**

**Logika Server-Side:**
1. Validasi sesi — `401` jika tidak ada.
2. Ambil `Attachment` sesuai `:id`. Tolak `400` jika `fileType !== "image"`, atau `409` jika `extractionStatus` sedang `processing` (mencegah trigger ganda).
3. Update `extractionStatus` → `processing`.
4. Kirim gambar (dari `fileUrl`) + prompt terstruktur ke Gemini API dengan `responseSchema` (lihat 12-Technical-Specification.md).
5. **Sukses**: hapus `Transaction` lama pada attachment ini yang `isVerified = false`, insert `Transaction` baru per item hasil ekstraksi, update `Attachment` (`extractionStatus: "done"`, `extractionModel`, `extractionRawResponse`, `extractedAt`, `extractionError: null`).
6. **Gagal**: update `Attachment` (`extractionStatus: "failed"`, `extractionError`: pesan singkat ramah pengguna).

**Response 200 (sukses)**

```json
{
  "data": {
    "attachmentId": "att_1",
    "extractionStatus": "done",
    "transactionsCreated": 6
  }
}
```

**Response 200 (gagal, tetap 200 karena permintaan diterima & diproses — bukan error server)**

```json
{
  "data": {
    "attachmentId": "att_1",
    "extractionStatus": "failed",
    "extractionError": "Gambar terlalu buram untuk dibaca, coba unggah ulang foto yang lebih jelas"
  }
}
```

**Response Error Umum:**
- `401 Unauthorized`: Sesi tidak valid
- `400 Bad Request`: Lampiran bukan bertipe gambar
- `409 Conflict`: Lampiran sedang dalam status `processing`
- `502 Bad Gateway`: Gemini API tidak bisa dihubungi sama sekali (bukan gagal parsing — itu masuk kategori `extractionStatus: "failed"` di atas)

---

## Review & Verifikasi Transaksi (V4)

### `GET /api/reports/:id/transactions`

Daftar seluruh transaksi (baik yang sudah maupun belum diverifikasi) untuk satu laporan tertentu — dipakai UI review di halaman Detail Laporan.

**Response 200**

```json
{
  "data": [
    {
      "id": "txn_1",
      "attachmentId": "att_1",
      "type": "pemasukan",
      "amount": 500000,
      "description": "Infaq Jumat",
      "transactionDate": "2026-08-14",
      "isVerified": false,
      "verifiedBy": null,
      "verifiedAt": null
    }
  ]
}
```

### `PATCH /api/transactions/:id`

Mengedit field transaksi hasil ekstraksi sebelum dikonfirmasi. **Hanya diizinkan jika `isVerified = false`.**

**Body**

```json
{
  "type": "pemasukan",
  "amount": 500000,
  "description": "Infaq Jumat (dikoreksi)",
  "transactionDate": "2026-08-14"
}
```

**Response 200**

```json
{ "data": { "id": "txn_1", "amount": 500000, "description": "Infaq Jumat (dikoreksi)" } }
```

**Response Error:**
- `409 Conflict`: Transaksi sudah `isVerified = true`, tidak bisa diedit lewat endpoint ini.

### `POST /api/transactions/:id/confirm`

Mengonfirmasi satu baris transaksi sebagai data resmi.

**Logika Server-Side:** set `isVerified = true`, `verifiedById` dari `session.user.id`, `verifiedAt = now()`.

**Response 200**

```json
{ "data": { "id": "txn_1", "isVerified": true, "verifiedBy": "Bapak Kosasih", "verifiedAt": "2026-09-21T10:00:00Z" } }
```

**Response Error:**
- `409 Conflict`: Transaksi sudah dikonfirmasi sebelumnya.

### `DELETE /api/transactions/:id`

Menghapus baris transaksi yang tidak valid (salah baca, duplikat, dll).

**Response 200**

```json
{ "data": { "id": "txn_1", "deleted": true } }
```

**Response Error:**
- `403 Forbidden`: Transaksi sudah `isVerified = true` — tidak bisa dihapus lewat alur normal ini (sesuai business rule F-012).

---

## Ringkasan Endpoint V4

| Method | Path                                   | Fungsi                                   | Akses Publik |
| ------ | -------------------------------------- | ----------------------------------------- | ------------ |
| POST   | `/api/attachments/:id/extract`         | Memicu ekstraksi data (vision-LLM)        | **Tidak**    |
| GET    | `/api/reports/:id/transactions`        | Daftar transaksi (verified & unverified)  | Ya (Baca)    |
| PATCH  | `/api/transactions/:id`                | Edit transaksi sebelum konfirmasi         | **Tidak**    |
| POST   | `/api/transactions/:id/confirm`        | Konfirmasi transaksi (`isVerified=true`)  | **Tidak**    |
| DELETE | `/api/transactions/:id`                | Hapus transaksi (hanya jika belum verified)| **Tidak**   |

## Ringkasan Endpoint V3 (Referensi)

| Method | Path                           | Fungsi                         | Akses Publik |
| ------ | ------------------------------ | ------------------------------ | ------------ |
| GET/POST| `/api/auth/[...nextauth]`      | Alur SSO & Sesi NextAuth       | Ya           |
| GET    | `/api/users`                   | Daftar pengguna (admin)        | Tidak        |
| GET    | `/api/reports`                 | List/kelompok/cari laporan     | Ya (Baca)    |
| POST   | `/api/reports`                 | Unggah laporan (Multi-File)    | **Tidak**    |
| GET    | `/api/reports/:id`             | Detail laporan & lampiran      | Ya (Baca)    |
| DELETE | `/api/reports/:id`             | Hapus laporan beserta lampiran | **Tidak**    |
| DELETE | `/api/reports/:id/attachments` | Hapus satu lampiran spesifik   | **Tidak**    |
