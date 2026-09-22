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

### `DELETE /api/reports/:id`

Menghapus seluruh laporan beserta lampiran file di Supabase Storage dan seluruh data transaksi terkait di database.
**Wajib: Sesi NextAuth yang valid.**

**Query params:**
- `force` (boolean, opsional): Jika `true`, memaksa penghapusan meskipun terdapat transaksi yang sudah diverifikasi.

**Logika Server-Side:**
1. Cek keberadaan transaksi terverifikasi (`isVerified = true`) pada laporan ini.
2. Jika ada dan `force !== "true"`, sistem mengembalikan `409 Conflict` dengan payload `{ error: "...", hasVerifiedTransactions: true, verifiedCount: X }`.
3. Jika tidak ada transaksi terverifikasi atau `force === "true"`: hapus seluruh file lampiran dari Supabase Storage dan hapus record laporan via `prisma.report.delete` (cascade delete di Postgres).

**Response 200**
```json
{ "data": { "id": "rpt_1", "deleted": true } }
```

**Response Error:**
- `401 Unauthorized`: Sesi tidak valid
- `404 Not Found`: Laporan tidak ditemukan
- `409 Conflict`: Memiliki transaksi terverifikasi, butuh konfirmasi lanjutan (`?force=true`)

### `DELETE /api/attachments/:id`

Menghapus satu file lampiran tertentu dari suatu laporan.
**Wajib: Sesi NextAuth yang valid.**

**Query params:**
- `force` (boolean, opsional): Jika `true`, memaksa penghapusan meskipun terdapat transaksi yang sudah diverifikasi pada lampiran ini.

**Logika Server-Side:**
1. Cek keberadaan transaksi terverifikasi (`isVerified = true`) pada lampiran ini.
2. Jika ada dan `force !== "true"`, sistem mengembalikan `409 Conflict` dengan payload `{ error: "...", hasVerifiedTransactions: true, verifiedCount: X }`.
3. Jika tidak ada transaksi terverifikasi atau `force === "true"`: hapus file dari Supabase Storage dan hapus record attachment via `prisma.attachment.delete`.

**Response Error:**
- `409 Conflict`: Memiliki transaksi terverifikasi, butuh konfirmasi lanjutan (`?force=true`)

---

## Ekstraksi Data (V4)

### `POST /api/attachments/:id/extract`

Memicu ekstraksi data transaksi dari satu lampiran bergambar menggunakan vision-LLM (Gemini). **Hanya berlaku untuk `fileType = "image"`.**
**Wajib: Request harus memiliki Sesi NextAuth yang valid.**

**Logika Server-Side:**
1. Validasi sesi — `401` jika tidak ada.
2. Ambil `Attachment` sesuai `:id`. Tolak `400` jika `fileType !== "image"`, atau `409` jika `extractionStatus` sedang `processing` (mencegah trigger ganda).
3. Update `extractionStatus` → `processing`.
4. Kirim gambar (dari `fileUrl`) + prompt terstruktur ke Gemini API dengan `responseSchema` (timeout 25s dengan auto-fallback dari `gemini-3.6-flash` ke `gemini-3.5-flash`).
5. **Sukses**:
   - Hapus transaksi lama pada attachment ini yang **belum diverifikasi** (`isVerified = false`). Transaksi yang sudah `isVerified = true` tetap dipertahankan.
   - Insert baris `Transaction` baru hasil ekstraksi (`isVerified: false`).
   - Update `Attachment` (`extractionStatus: "done"`, `initialBalance`, `finalBalance`, `extractionModel`, `extractionRawResponse`, `extractedAt`, `extractionError: null`).
6. **Gagal**: update `Attachment` (`extractionStatus: "failed"`, `extractionError`: pesan singkat ramah pengguna).

**Response 200 (sukses)**

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

Daftar transaksi untuk satu laporan tertentu — dipakai UI review di halaman Detail Laporan.

**Wajib diperhatikan:** endpoint ini **tidak menolak** akses tanpa sesi (`401`), tapi **hasilnya difilter berdasarkan status sesi**:
- **Tanpa sesi valid**: hanya mengembalikan transaksi dengan `isVerified = true`
- **Dengan sesi valid**: mengembalikan semua transaksi (verified & unverified), untuk keperluan review bendahara

**Response 200 (dengan sesi — semua transaksi)**

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

**Body (opsional, V5)**

```json
{ "donorNameRaw": "Bapak Kosasih" }
```

`donorNameRaw` hanya relevan untuk transaksi bertipe `pemasukan`. Boleh dikosongkan (`null`/tidak dikirim) jika transaksi memang tidak punya nama donatur tertulis.

**Logika Server-Side:**
1. Jika `donorNameRaw` dikirim dan tidak kosong:
   - Normalisasi nama (lihat `normalizeDonorName()` di 12-Technical-Specification.md)
   - Jika hasil normalisasi cocok pola anonim ("hamba allah"/"anonim"/"tanpa nama") → `donorId` tetap `null`
   - Jika tidak, cari `Donor.normalizedName` yang cocok persis → tautkan; jika tidak ada, buat `Donor` baru
2. Set `isVerified = true`, `verifiedById` dari `session.user.id`, `verifiedAt = now()` (logika V4, tidak berubah)

**Response 200**

```json
{ "data": { "id": "txn_1", "isVerified": true, "verifiedBy": "Bapak Kosasih", "verifiedAt": "2026-09-21T10:00:00Z", "donorId": "dnr_1" } }
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

## Financial Intelligence (V5)

> Seluruh endpoint di bagian ini **tidak memerlukan sesi NextAuth** (publik), tetapi setiap query di dalamnya **selalu** memfilter `isVerified: true` tanpa pengecualian — tidak ada parameter atau kondisi apa pun yang membuka akses ke transaksi belum terverifikasi dari endpoint-endpoint ini.

### `GET /api/dashboard/trend`

Data tren pemasukan/pengeluaran untuk grafik dashboard publik (F-014).

**Query params**

| Param | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `granularity` | `"weekly"` \| `"monthly"` | tidak (default `"weekly"`) | Menentukan pengelompokan periode |
| `periods` | number | tidak (default `12`) | Jumlah periode terakhir yang ditampilkan |

**Response 200**

```json
{
  "data": {
    "granularity": "weekly",
    "points": [
      { "period": "2026-08-10", "pemasukan": 1250000, "pengeluaran": 680000 },
      { "period": "2026-08-17", "pemasukan": 980000, "pengeluaran": 720000 }
    ]
  }
}
```

### `GET /api/donors`

Daftar seluruh donatur beserta total kontribusi terverifikasi (F-015). Mencakup satu entri agregat khusus untuk donasi anonim.

**Response 200**

```json
{
  "data": {
    "donors": [
      { "id": "dnr_1", "name": "Bapak Kosasih", "totalContribution": 2400000, "donationCount": 8 }
    ],
    "anonymous": { "totalContribution": 1150000, "donationCount": 14 }
  }
}
```

### `GET /api/donors/:id`

Riwayat transaksi terverifikasi milik satu donatur tertentu.

**Response 200**

```json
{
  "data": {
    "donor": { "id": "dnr_1", "name": "Bapak Kosasih", "totalContribution": 2400000 },
    "history": [
      { "transactionId": "txn_1", "amount": 300000, "transactionDate": "2026-08-14", "reportId": "rpt_1" }
    ]
  }
}
```

**Response Error:**
- `404 Not Found`: `id` donatur tidak ditemukan

---

## Ringkasan Endpoint V4

| Method | Path                                   | Fungsi                                   | Akses Publik |
| ------ | -------------------------------------- | ----------------------------------------- | ------------ |
| POST   | `/api/attachments/:id/extract`         | Memicu ekstraksi data (vision-LLM)        | **Tidak**    |
| GET    | `/api/reports/:id/transactions`        | Daftar transaksi — tanpa sesi hanya `isVerified=true`, dengan sesi semua | Ya (terbatas tanpa sesi) |
| PATCH  | `/api/transactions/:id`                | Edit transaksi sebelum konfirmasi         | **Tidak**    |
| POST   | `/api/transactions/:id/confirm`        | Konfirmasi transaksi + assign donatur (V5)| **Tidak**    |
| DELETE | `/api/transactions/:id`                | Hapus transaksi (hanya jika belum verified)| **Tidak**   |

## Ringkasan Endpoint V5

| Method | Path                     | Fungsi                                      | Akses Publik |
| ------ | ------------------------ | -------------------------------------------- | ------------ |
| GET    | `/api/dashboard/trend`   | Data tren pemasukan/pengeluaran (F-014)      | Ya           |
| GET    | `/api/donors`            | Daftar donatur + agregat anonim (F-015)      | Ya           |
| GET    | `/api/donors/:id`        | Riwayat transaksi satu donatur (F-015)       | Ya           |

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
