# 14. API Specification

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

## Reports (Laporan)

### `GET /api/reports`

List laporan, terkelompok Tahun → Bulan (untuk Arsip Laporan), atau hasil filter (untuk Cari Arsip).

**Query params**

| Param     | Tipe   | Wajib | Keterangan                                    |
| --------- | ------ | ------ | ----------------------------------------------- |
| `year`    | number | tidak | filter tahun                                  |
| `month`   | number | tidak | filter bulan                                  |
| `keyword` | string | tidak | cari berdasarkan tanggal/teks terkait laporan |

**Response 200 (contoh tanpa filter — dikelompokkan)**

```json
{
  "data": [
    {
      "year": 2024,
      "months": [
        {
          "month": 10,
          "reports": [
            {
              "id": "rpt_1",
              "reportDate": "2024-10-25",
              "weekOfMonth": 4,
              "photoUrl": "/uploads/reports/rpt_1.jpg",
              "uploadedAt": "2024-10-25T10:00:00Z",
              "uploadedBy": { "id": "usr_1", "name": "Bapak Kosasih" }
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

*(UI menampilkan state "Belum ada laporan" atau "Laporan tidak ditemukan" tergantung konteks — lihat wireframe.)*

### `POST /api/reports`

Unggah laporan baru. `multipart/form-data`.

**Form fields**

| Field          | Tipe                | Wajib |
| -------------- | -------------------- | ----- |
| `photo`        | file (jpg/png)      | Yes   |
| `reportDate`   | date (`YYYY-MM-DD`) | Yes   |
| `uploadedById` | string (User id)    | Yes   |

Server menghitung `year`, `month`, `weekOfMonth` otomatis dari `reportDate` (tidak diterima dari client).

**Response 201**

```json
{
  "data": {
    "id": "rpt_25",
    "reportDate": "2024-10-25",
    "photoUrl": "/uploads/reports/rpt_25.jpg",
    "year": 2024, "month": 10, "weekOfMonth": 4
  }
}
```

**Response 400** (validasi gagal — foto/tanggal kosong, format salah)

```json
{ "error": "Foto dan tanggal laporan wajib diisi" }
```

**Response 500** (gagal upload — koneksi/server)

```json
{ "error": "Gagal mengunggah foto. Periksa koneksi internet Anda dan coba lagi." }
```

### `GET /api/reports/:id`

Detail satu laporan (untuk halaman Detail Laporan).

**Response 200**

```json
{
  "data": {
    "id": "rpt_1",
    "reportDate": "2024-10-04",
    "weekOfMonth": 1,
    "photoUrl": "/uploads/reports/rpt_1.jpg",
    "uploadedAt": "2024-10-04T09:00:00Z",
    "uploadedBy": { "id": "usr_1", "name": "Bapak Kosasih", "role": "Bendahara 2" }
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
| POST   | `/api/reports`     | Unggah laporan baru            | #006, #007, #008, #010 |
| GET    | `/api/reports/:id` | Detail laporan                 | #021                   |
