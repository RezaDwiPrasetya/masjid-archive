# 14. API Specification (Revisi — Penguatan Keamanan & Otorisasi RBAC 3-Tier)

> **Catatan revisi:** Dokumen ini diperbarui untuk mencerminkan sistem otorisasi Role-Based Access Control (RBAC) 3-Tier yang ketat (`ADMIN`, `BENDAHARA`, dan `null` untuk Jamaah/Publik), penutupan celah mutasi data ber-role null, proteksi kebocoran data publik melalui query `select` eksplisit, serta penghapusan total dependensi legacy `iron-session`.

## Overview

API di-implementasi sebagai Next.js Route Handlers (`app/api/**/route.ts`). Keamanan sistem menerapkan prinsip **Least Privilege** dan **Separation of Concerns**:

### Tingkatan Hak Akses (Role Model):
1. **Publik / Jamaah (`role: null` atau tanpa sesi)**:
   - Akses **baca publik** pada laporan keuangan kas, dashboard tren mingguan/bulanan, rekap donatur, rincian pengeluaran per kategori, dan unduhan dokumen resmi (PDF/Excel).
   - Seluruh mutasi data (`POST`, `PATCH`, `DELETE`) **ditolak**.
   - Transaksi draf yang belum diverifikasi (`isVerified: false`) **disembunyikan** otomatis dari endpoint dan halaman web.
2. **Staf Operasional DKM (`role: "BENDAHARA"`)**:
   - Berhak melakukan aksi operasional keuangan: mengunggah berkas laporan (`POST /api/reports`), menambah lampiran, memicu ekstraksi AI vision-LLM, mengonfirmasi/membatalkan verifikasi transaksi, mengedit nama donatur, serta mengklasifikasikan kategori pengeluaran kas.
   - **Dilarang** menghapus laporan kas utama (`DELETE /api/reports/:id`) dan dilarang mengelola peran pengguna.
3. **Administrator Sistem (`role: "ADMIN"`)**:
   - Memiliki wewenang tertinggi: seluruh hak operasional staf, manajemen akun dan hak akses pengguna (`/api/users`), serta hak eksklusif menghapus dokumen laporan kas (`DELETE /api/reports/:id`).

### Format Kode Status HTTP Standar:
- `200 OK` / `201 Created`: Permintaan berhasil diproses.
- `401 Unauthorized`: Endpoint membutuhkan sesi login Google, tetapi tidak ada sesi aktif.
- `403 Forbidden`: Pengguna memiliki sesi login, namun tidak memiliki peran/hak akses yang memadai untuk tindakan tersebut (mis. role `null` mencoba mutasi data, atau `BENDAHARA` mencoba menghapus laporan).
- `404 Not Found`: Entitas tidak ditemukan.
- `409 Conflict`: Terjadi konflik integritas data (mis. tanggal laporan duplikat, atau menghapus laporan yang telah memiliki transaksi terverifikasi tanpa parameter `?force=true`).

Format response standar:

```json
// Sukses
{ "data": ... }

// Error
{ "error": "Pesan error singkat yang ramah pengguna" }
```

---

## Auth (NextAuth.js SSO)

### `GET/POST /api/auth/[...nextauth]`

Endpoint dinamis bawaan NextAuth.js (menggunakan runtime JWT + sinkronisasi role database Prisma). Menangani seluruh alur OAuth Google, callback, dan pembaruan token sesi secara otomatis.

*Catatan: Modul dan endpoint legacy `iron-session` (`/api/auth/login` dan `/api/auth/logout`) telah dihapus secara permanen dari kode sumber dan dependensi.*

---

## Users (Pengurus)

### `GET /api/users`

Daftar pengguna terdaftar di sistem beserta ringkasan jejak audit (`_count` laporan dan verifikasi). Khusus Administrator.

**Response 200**

```json
[
  {
    "id": "clxyz123...",
    "name": "Bapak Kosasih",
    "email": null,
    "image": null,
    "role": "BENDAHARA",
    "_count": {
      "reports": 3,
      "verifiedTransactions": 0
    }
  }
]
```

### `PATCH /api/users`

Memperbarui hak akses (role) pengguna (`ADMIN`, `BENDAHARA`, atau `null` untuk Jamaah). Khusus Administrator.

**Request Body**

```json
{
  "userId": "clxyz123...",
  "role": "BENDAHARA"
}
```

### `DELETE /api/users?userId={id}` *(Issue #054)*

Menghapus akun pengguna permanen dengan proteksi jejak audit keuangan:
- **Dilarang**: Menghapus akun admin sendiri (`400 Bad Request`).
- **Dilarang**: Menghapus pengguna yang memiliki riwayat `reports > 0` atau `verifiedTransactions > 0` (`400 Bad Request: HAS_AUDIT_HISTORY`) demi menjaga keutuhan bukti audit kas.
- **Diizinkan**: Menghapus akun bersih yang tidak memiliki riwayat laporan kas (mis. akun jamaah yang tidak sengaja login).

**Response 200 (Berhasil)**
```json
{
  "success": true,
  "message": "Pengguna Bapak Cecep berhasil dihapus."
}
```

**Response 400 (Ditolak karena Riwayat Audit)**
```json
{
  "code": "HAS_AUDIT_HISTORY",
  "error": "Pengguna tidak dapat dihapus karena memiliki riwayat 3 unggahan laporan dan 0 transaksi terverifikasi. Demi menjaga keutuhan jejak audit, pengguna ini tidak dapat dihapus. Silakan ubah perannya menjadi Jamaah jika ingin mencabut akses."
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
              "uploadedBy": { "name": "Bapak Kosasih" },
              "attachments": [
                {
                  "id": "att_1",
                  "fileType": "image",
                  "originalFileName": "foto-kas.jpg",
                  "fileSizeBytes": 204800,
                  "fileUrl": "https://[supabase-url]/storage/v1/object/public/report-photos/foto.jpg",
                  "uploadedAt": "2026-08-14T10:00:00Z"
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
*Catatan Keamanan (Data Hardening):* Query `GET /api/reports` menggunakan `select` eksplisit. Informasi sensitif seperti ID/email pengunggah (`uploadedBy`) dan data teknis LLM (`extractionRawResponse`, `extractionModel`, `extractionError`) tidak dibocorkan ke publik. Untuk staf yang sedang login, field metadata proses seperti `extractionStatus` tetap disertakan.

### `POST /api/reports`

Unggah laporan baru dengan banyak file pendukung. `multipart/form-data`.
**Wajib: Khusus Staf DKM (`ADMIN` atau `BENDAHARA`). Akses tanpa sesi mengembalikan `401 Unauthorized`, sedangkan akun Google ber-role `null` (Jamaah) mengembalikan `403 Forbidden`.**

**Form fields**

| Field          | Tipe                | Wajib | Keterangan |
| -------------- | ------------------- | ----- | ---------- |
| `files`        | array of files      | Yes   | Mendukung `.jpg`, `.png`, `.pdf`, `.xlsx`. Minimal 1 file. |
| `reportDate`   | date (`YYYY-MM-DD`) | Yes   | Tanggal laporan mingguan (harus hari Jumat). |

*Catatan Keamanan: Field `uploadedById` dilarang dikirim dari klien. Server mengekstrak ID pengguna secara langsung dan aman dari token sesi NextAuth terverifikasi.*

**Logika Transaksi Server-Side:**
1. **Validasi Otorisasi**: Periksa sesi NextAuth dan validasi `isStaff(session)`. Tolak `401` jika tanpa sesi, atau `403 Forbidden` jika bukan pengurus.
2. Validasi file: Ekstrak file dari *form data* dan validasi tipe/ukuran.
3. Cek duplikat `reportDate` di Vercel Postgres (kembalikan `409` jika duplikat).
4. `Promise.all` unggah seluruh *file* secara paralel ke **Supabase Storage**.
5. Jika berhasil, susun data lampiran dan eksekusi `prisma.$transaction` untuk *insert* ke tabel `Report` (dengan `uploadedById` dari sesi) DAN `Attachment` (dengan `extractionStatus` default `not_extracted`) secara atomik di **Vercel Postgres**.
6. Jika transaksi database gagal atau ada upload Supabase yang *error*, server otomatis membersihkan (`storage.remove()`) file yang sempat terunggah agar tidak terjadi *orphan files* di bucket.

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

**Response Error:**
- `401 Unauthorized`: Belum login ke sistem.
- `403 Forbidden`: Login sebagai Jamaah (`role: null`) — tidak memiliki hak unggah laporan kas.
- `400 Bad Request`: Validasi tipe file/ukuran gagal atau format tanggal salah.
- `409 Conflict`: Laporan untuk tanggal tersebut sudah tersimpan di arsip.
- `500 Internal Server Error`: Gagal transaksi penyimpanan database/storage.

### `GET /api/reports/:id`

Detail satu laporan (untuk halaman Detail Laporan). Dapat diakses oleh publik (mode baca).

**Response 200 (Publik)**

```json
{
  "data": {
    "id": "rpt_1",
    "reportDate": "2026-08-14",
    "year": 2026,
    "month": 8,
    "weekOfMonth": 2,
    "uploadedAt": "2026-08-14T09:00:00Z",
    "initialBalance": 1485000,
    "finalBalance": 1605000,
    "uploadedBy": { "name": "Bapak Kosasih" },
    "attachments": [
      {
        "id": "att_1",
        "fileType": "pdf",
        "originalFileName": "laporan-rekap.pdf",
        "fileSizeBytes": 1200000,
        "fileUrl": "https://[supabase-url]/...",
        "uploadedAt": "2026-08-14T09:00:00Z"
      }
    ]
  }
}
```
*Catatan Keamanan & Hak Akses:*
- **Akses Publik**: Query menggunakan `select` ketat tanpa memaparkan email/role pengunggah maupun dump teknis AI.
- **Akses Staf (`ADMIN`/`BENDAHARA`)**: Menambahkan field teknis lampiran: `extractionStatus`, `extractionModel`, `extractionError`, dan `extractedAt` untuk kebutuhan antarmuka ekstraksi. Field mentah `extractionRawResponse` tetap ditahan di server dan tidak pernah dikirim ke browser.

### `DELETE /api/reports/:id`

Menghapus seluruh laporan beserta lampiran file di Supabase Storage dan seluruh data transaksi terkait di database.
**Wajib: Khusus Administrator (`role: ADMIN`).**
*Akun dengan peran `BENDAHARA` atau `null` akan ditolak dengan status `403 Forbidden`.*

**Query params:**
- `force` (boolean, opsional): Jika `true`, memaksa penghapusan meskipun terdapat transaksi yang sudah diverifikasi.

**Logika Server-Side:**
1. Validasi sesi dan hak akses: `!session` → `401`, `!isAdmin(session)` → `403 Forbidden: Hanya Administrator yang dapat menghapus laporan kas`.
2. Cek keberadaan transaksi terverifikasi (`isVerified = true`) pada laporan ini.
3. Jika ada dan `force !== "true"`, sistem mengembalikan `409 Conflict` dengan payload `{ error: "...", hasVerifiedTransactions: true, verifiedCount: X }`.
4. Jika tidak ada transaksi terverifikasi atau `force === "true"`: hapus seluruh file lampiran dari Supabase Storage dan hapus record laporan via `prisma.report.delete` (cascade delete di Postgres).

**Response 200**
```json
{ "data": { "id": "rpt_1", "deleted": true } }
```

**Response Error:**
- `401 Unauthorized`: Belum login ke sistem.
- `403 Forbidden`: Pengguna bukan Administrator (misal peran `BENDAHARA` atau `null`).
- `404 Not Found`: Laporan tidak ditemukan.
- `409 Conflict`: Memiliki transaksi terverifikasi, butuh konfirmasi lanjutan (`?force=true`).

### `DELETE /api/attachments/:id`

Menghapus satu file lampiran tertentu dari suatu laporan.
**Wajib: Khusus Staf DKM (`ADMIN` atau `BENDAHARA`). Akses tanpa sesi mengembalikan `401`, role `null` mengembalikan `403 Forbidden`.**

**Query params:**
- `force` (boolean, opsional): Jika `true`, memaksa penghapusan meskipun terdapat transaksi yang sudah diverifikasi pada lampiran ini.

**Logika Server-Side:**
1. Validasi otorisasi: `!session` → `401`, `!isStaff(session)` → `403 Forbidden`.
2. Cek keberadaan transaksi terverifikasi (`isVerified = true`) pada lampiran ini.
3. Jika ada dan `force !== "true"`, sistem mengembalikan `409 Conflict` dengan payload `{ error: "...", hasVerifiedTransactions: true, verifiedCount: X }`.
4. Jika tidak ada transaksi terverifikasi atau `force === "true"`: hapus file dari Supabase Storage dan hapus record attachment via `prisma.attachment.delete`.

**Response Error:**
- `401 Unauthorized`: Belum login ke sistem.
- `403 Forbidden`: Peran tidak memadai (misal role `null`).
- `409 Conflict`: Memiliki transaksi terverifikasi, butuh konfirmasi lanjutan (`?force=true`).

---

## Ekstraksi Data (V4)

### `POST /api/attachments/:id/extract`

Memicu ekstraksi data transaksi dari satu lampiran bergambar/PDF (Gemini Vision) atau Excel (Parser tabular).
**Wajib: Khusus Staf DKM (`ADMIN` atau `BENDAHARA`). Akses tanpa sesi mengembalikan `401`, role `null` mengembalikan `403 Forbidden`.**

**Request Body (Opsional):**
```json
{
  "replaceVerified": false // boolean (default: false). Jika true, semua transaksi lama (termasuk yang terverifikasi) akan direset/dihapus sebelum transaksi baru dimasukkan.
}
```

**Logika Server-Side:**
1. Validasi sesi dan peran staf (`isStaff(session)`). Tolak `401` jika tanpa sesi, `403` jika role `null`.
2. Ambil `Attachment` sesuai `:id`. Tolak `400` jika `fileType` tidak didukung, atau `409` jika `extractionStatus` sedang `processing` (mencegah trigger ganda).
3. Update `extractionStatus` → `processing`.
4. Jalankan ekstraksi/parsing sesuai jenis berkas.
5. **Sukses**:
   - Jika `replaceVerified = true`: Hapus seluruh transaksi lama pada attachment ini (baik `isVerified = true` maupun `false`) untuk mencegah duplikasi nilai saat ekstrak ulang.
   - Jika `replaceVerified = false` (default): Hapus transaksi lama yang **belum diverifikasi** (`isVerified = false`). Transaksi yang sudah `isVerified = true` tetap dipertahankan.
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
- `401 Unauthorized`: Belum login.
- `403 Forbidden`: Akun tidak memiliki peran staf (`role: null`).
- `400 Bad Request`: Lampiran bukan bertipe gambar/PDF/Excel yang valid.
- `409 Conflict`: Lampiran sedang dalam status `processing`.
- `502 Bad Gateway`: Gemini API tidak bisa dihubungi sama sekali (bukan gagal parsing — itu masuk kategori `extractionStatus: "failed"` di atas).

---

## Review & Verifikasi Transaksi (V4)

### `GET /api/reports/:id/transactions`

Daftar transaksi untuk satu laporan tertentu — dipakai UI review di halaman Detail Laporan dan tabel publik.

**Aturan Otorisasi Filter Data:**
- **Akses Publik / Jamaah (`role: null` atau tanpa sesi)**: Sistem **hanya mengembalikan transaksi terverifikasi** (`isVerified: true`). Seluruh transaksi draf disembunyikan secara otomatis demi menjaga kerahasiaan proses verifikasi kas.
- **Akses Staf DKM (`ADMIN` atau `BENDAHARA`)**: Sistem mengembalikan seluruh transaksi (baik terverifikasi maupun draf yang belum dikonfirmasi) untuk keperluan peninjauan bendahara.

**Response 200 (Staf DKM — Termasuk Draf)**

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

Mengedit field transaksi hasil ekstraksi sebelum dikonfirmasi. **Khusus Staf DKM (`ADMIN` atau `BENDAHARA`). Hanya diizinkan jika `isVerified = false`.**

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
- `401 Unauthorized`: Belum login.
- `403 Forbidden`: Akun bukan staf DKM (`role: null`).
- `409 Conflict`: Transaksi sudah `isVerified = true`, tidak bisa diedit lewat endpoint ini.

### `POST /api/transactions/:id/confirm`

Mengonfirmasi satu baris transaksi sebagai data resmi. **Khusus Staf DKM (`ADMIN` atau `BENDAHARA`).**

**Body (opsional, V5)**

```json
{ "donorNameRaw": "Bapak Kosasih" }
```

`donorNameRaw` hanya relevan untuk transaksi bertipe `pemasukan`. Boleh dikosongkan (`null`/tidak dikirim) jika transaksi memang tidak punya nama donatur tertulis.

**Logika Server-Side:**
1. Validasi sesi dan hak staf (`isStaff(session)`). Tolak `401` jika tanpa sesi, `403` jika role `null`.
2. Jika `donorNameRaw` dikirim dan tidak kosong:
   - Normalisasi nama (lihat `normalizeDonorName()` di 12-Technical-Specification.md)
   - Jika hasil normalisasi cocok pola anonim ("hamba allah"/"anonim"/"tanpa nama") → `donorId` tetap `null`
   - Jika tidak, cari `Donor.normalizedName` yang cocok persis → tautkan; jika tidak ada, buat `Donor` baru
3. Set `isVerified = true`, `verifiedById` dari `session.user.id`, `verifiedAt = now()`

**Response 200**

```json
{
  "data": {
    "id": "txn_1",
    "isVerified": true,
    "verifiedBy": "Bapak Kosasih",
    "verifiedAt": "2026-09-21T10:00:00Z",
    "donorId": "dnr_1",
    "donorNameRaw": "Bapak Kosasih",
    "donor": { "id": "dnr_1", "name": "Bapak Kosasih" },
    "matchingResult": {
      "status": "existing",
      "donorName": "Bapak Kosasih"
    }
  }
}
```

*Keterangan `matchingResult.status`: `"existing"` (ditautkan ke donatur yang sudah ada), `"created"` (donatur baru dibuat), `"anonymous"` (terdeteksi anonim, `donorId: null`), atau `"none"` (transaksi pengeluaran atau tanpa input donatur).*

**Response Error:**
- `401 Unauthorized`: Belum login.
- `403 Forbidden`: Akun bukan staf DKM (`role: null`).
- `409 Conflict`: Transaksi sudah dikonfirmasi sebelumnya.

### `DELETE /api/transactions/:id`

Menghapus baris transaksi yang tidak valid (salah baca, duplikat, dll). **Khusus Staf DKM (`ADMIN` atau `BENDAHARA`).**

**Logika Server-Side:**
1. Validasi sesi dan peran staf (`isStaff(session)`). Tolak `401` jika tanpa sesi, `403` jika role `null`.
2. Jika `transaction.isVerified === true`, tolak dengan `403 Forbidden` (transaksi terverifikasi tidak boleh dihapus demi integritas saldo).
3. Hapus baris transaksi via `prisma.transaction.delete`.

**Response 200**

```json
{ "data": { "id": "txn_1", "deleted": true } }
```

**Response Error:**
- `401 Unauthorized`: Belum login.
- `403 Forbidden`: Bukan staf DKM, atau mencoba menghapus transaksi yang sudah terverifikasi.
- `404 Not Found`: Transaksi tidak ditemukan.

### `POST /api/transactions/:id/unverify` (Issue #051)

Membatalkan status verifikasi transaksi yang sebelumnya telah dikonfirmasi. Mengembalikan `isVerified = false`, memperbarui total donatur (jika transaksi memiliki donatur), dan otomatis mengeluarkan transaksi dari dashboard publik.

**Auth:** Khusus Staf DKM (`ADMIN` atau `BENDAHARA`). Tolak `401` jika tanpa sesi, `403` jika role `null`.

**Response 200**

```json
{
  "data": {
    "id": "txn_1",
    "isVerified": false,
    "verifiedById": null,
    "verifiedAt": null
  }
}
```

### `PATCH /api/transactions/:id/donor` (Issue #051)

Mengedit nama donatur khusus pada transaksi pemasukan yang sudah berstatus `isVerified = true` tanpa mengubah nominal kas ataupun integritas pembukuan lainnya.

**Auth:** Khusus Staf DKM (`ADMIN` atau `BENDAHARA`). Tolak `401` jika tanpa sesi, `403` jika role `null`.

**Body Request**

```json
{
  "donorNameRaw": "Bapak Kosasih"
}
```

**Response 200**

```json
{
  "data": {
    "id": "txn_1",
    "donorNameRaw": "Bapak Kosasih",
    "donorId": "dnr_1",
    "donor": {
      "id": "dnr_1",
      "name": "Bapak Kosasih"
    }
  }
}
```

---

## Financial Intelligence (V5)

> Seluruh endpoint di bagian ini **tidak memerlukan sesi NextAuth** (publik), tetapi setiap query di dalamnya **selalu** memfilter `isVerified: true` tanpa pengecualian — tidak ada parameter atau kondisi apa pun yang membuka akses ke transaksi belum terverifikasi dari endpoint-endpoint ini.

### `GET /api/dashboard/trend` (Revisi Issue #053)

Data tren pemasukan/pengeluaran untuk grafik dashboard publik (F-014).
- **Pengelompokan Mingguan:** Berbasis `Report.reportDate` (hari Jumat) sehingga selaras 100% dengan lembar laporan kas fisik mingguan.
- **Rentang Dinamis:** Dimulai dari laporan pertama di database hingga maksimal `periods` periode terakhir (menghindari deretan batang kosong Rp 0 di awal).
- **Database Kosong:** Jika tidak ada transaksi terverifikasi, mengembalikan `{ data: { granularity, points: [] } }`.

**Query params**

| Param | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `granularity` | `"weekly"` \| `"monthly"` | tidak (default `"weekly"`) | Menentukan pengelompokan periode (mingguan Jumat atau bulanan) |
| `periods` | number | tidak (default `12`) | Jumlah periode maksimum yang ditampilkan |

**Response 200 (Contoh Mingguan Berbasis Jumat)**

```json
{
  "data": {
    "granularity": "weekly",
    "points": [
      { "period": "2026-04-03", "pemasukan": 440000, "pengeluaran": 720000 },
      { "period": "2026-07-31", "pemasukan": 370000, "pengeluaran": 250000 },
      { "period": "2026-09-18", "pemasukan": 470000, "pengeluaran": 150000 }
    ]
  }
}
```

### `GET /api/donors`

Daftar seluruh donatur beserta total kontribusi terverifikasi (F-015), dengan dukungan filter periode waktu (F-024, V8). Mencakup satu entri agregat khusus untuk donasi anonim.

**Parameter Query (opsional — V8, Issue #66):**
- `year` (number, opsional): Filter transaksi pada tahun tertentu (contoh: `2026`).
- `month` (number, 1–12, opsional): Filter transaksi pada bulan tertentu (harus disertai atau bersama `year`). Jika dikosongkan, mencakup seluruh bulan pada tahun tersebut.

**Response 200**

```json
{
  "data": {
    "donors": [
      { "id": "dnr_1", "name": "Bapak Kosasih", "totalContribution": 2400000, "donationCount": 8 }
    ],
    "anonymous": { "totalContribution": 1150000, "donationCount": 14 },
    "period": {
      "year": 2026,
      "month": 9
    }
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

### `GET /api/donors/anonymous/transactions` (V6 — Issue #054, Diperluas V8 — Issue #66)

Mengambil daftar seluruh transaksi terverifikasi yang masuk ke dalam kategori "Infaq Anonim" (pemasukan tanpa identitas donatur, `donorId = null`). Digunakan untuk modal audit transparansi publik di halaman `/donatur`.

**Parameter Query (opsional):**
- `year` (number, opsional — V8): Filter tahun transaksi.
- `month` (number, 1–12, opsional — V8): Filter bulan transaksi.
- `limit` (number, default: 100, max: 200): Jumlah baris yang diambil.
- `offset` (number, default: 0): Paginasi data.

**Response 200**

```json
{
  "data": {
    "totalContribution": 1150000,
    "donationCount": 14,
    "transactions": [
      {
        "id": "txn_anon_1",
        "amount": 250000,
        "description": "Kotak Amal Jumat Pekan ke-2",
        "transactionDate": "2026-08-07T00:00:00.000Z",
        "reportId": "rpt_1",
        "reportDate": "2026-08-07T00:00:00.000Z"
      }
    ]
  }
}
```

**Aturan Bisnis:**
- MUTLAK hanya mengembalikan transaksi dengan `isVerified = true`, `type = "pemasukan"`, dan `donorId = null`.
- Jika `year` / `month` disediakan, hanya memperhitungkan transaksi pada rentang periode tersebut.
- Diurutkan dari transaksi terbaru (`transactionDate` atau `createdAt` DESC).
- Dapat diakses secara publik tanpa autentikasi (publik read-only).

---

### `GET /api/expenses` (V7 — Issue #059, Diperluas V8 — Issue #66)

Mengambil agregasi pengeluaran kas masjid per kategori fungsional untuk transaksi terverifikasi (`isVerified = true`). Digunakan oleh halaman publik `/pengeluaran` untuk merender KPI, grafik proporsi, dan chip filter, dengan dukungan filter periode waktu (Tahun & Bulan).

**Akses**: Publik (read-only)

**Parameter Query (opsional — V8, Issue #66):**
- `year` (number, opsional): Filter tahun pengeluaran (contoh: `2026`).
- `month` (number, 1–12, opsional): Filter bulan pengeluaran. Jika kosong, menghitung agregasi sepanjang tahun tersebut.

**Response 200**

```json
{
  "data": {
    "totalExpense": 7850000,
    "totalCount": 24,
    "period": {
      "year": 2026,
      "month": 9
    },
    "byCategory": [
      {
        "category": "operasional",
        "label": "Operasional",
        "totalAmount": 3200000,
        "count": 8,
        "percentage": 40.76
      },
      {
        "category": null,
        "label": "Tidak Dikategorikan",
        "totalAmount": 500000,
        "count": 2,
        "percentage": 6.37
      }
    ]
  }
}
```

**Aturan Bisnis:**
- Mengelompokkan transaksi `pengeluaran` terverifikasi berdasarkan nilai `category`.
- Jika `year` / `month` disediakan, hanya memperhitungkan transaksi pengeluaran pada rentang waktu tersebut.
- Menghitung persentase terhadap `totalExpense` secara matematis aman (fallback `0` jika `totalExpense === 0`).
- Mengembalikan daftar terurut descending berdasarkan `totalAmount`.
- Transaksi dengan `category = null` diberi label `"Tidak Dikategorikan"`.

---

### `GET /api/expenses/transactions` (V7 — Issue #059, Diperluas V8 — Issue #66)

Mengambil daftar rincian transaksi pengeluaran terverifikasi dengan dukungan filter kategori, periode waktu (tahun/bulan), pencarian teks, dan paginasi.

**Akses**: Publik (read-only)

**Parameter Query (opsional):**
- `year` (number, opsional — V8): Filter tahun pengeluaran.
- `month` (number, 1–12, opsional — V8): Filter bulan pengeluaran.
- `category` (string, opsional): Filter kategori tertentu (mis. `operasional`) atau `uncategorized` untuk transaksi bernilai `category: null`. Kosongkan untuk semua kategori.
- `search` (string, opsional): Pencarian berbasis teks pada kolom `description` (case-insensitive).
- `limit` (number, default: 50, max: 200): Jumlah baris per halaman.
- `offset` (number, default: 0): Offset paginasi.

**Response 200**

```json
{
  "data": {
    "total": 12,
    "transactions": [
      {
        "id": "clxyz999...",
        "amount": 750000,
        "description": "Pembayaran Listrik PLN Masjid",
        "transactionDate": "2026-10-02T00:00:00.000Z",
        "category": "operasional",
        "categoryLabel": "Operasional",
        "reportId": "rpt_1",
        "reportDate": "2026-10-02T00:00:00.000Z"
      }
    ]
  }
}
```

**Aturan Bisnis:**
- MUTLAK membatasi query hanya pada `type: "pengeluaran"` dan `isVerified: true`.
- Transaksi draf / belum terverifikasi TIDAK PERNAH dikembalikan ke publik.

---

### `PATCH /api/transactions/:id/category` (V7 — Issue #059)

Mengubah kategori fungsional pada transaksi pengeluaran yang **sudah berstatus terverifikasi** tanpa membatalkan status verifikasi atau mengganggu keutuhan nominal finansial.

**Akses**: Khusus Staf DKM (`ADMIN` atau `BENDAHARA`). Akses tanpa sesi mengembalikan `401 Unauthorized`, sedangkan akun Google ber-role `null` (Jamaah) mengembalikan `403 Forbidden`.

**Request Body:**

```json
{
  "category": "pembangunan"
}
```
*(Nilai `category` bisa salah satu enum valid atau `null` untuk mengosongkan kategori).*

**Response 200**

```json
{
  "data": {
    "id": "clxyz999...",
    "category": "pembangunan",
    "updatedAt": "2026-10-06T09:55:00.000Z"
  }
}
```

**Response Error:**
- `401 Unauthorized`: Belum login ke sistem
- `403 Forbidden`: Akun bukan staf pengurus DKM (`role: null`)
- `400 Bad Request`: Transaksi bukan tipe `pengeluaran` atau nilai enum kategori tidak valid
- `404 Not Found`: ID transaksi tidak ditemukan

---

## Ekspor Rekapitulasi Kas (F-021, V6 & V7 Refinement)

### `GET /api/reports/:id/export/excel`
Unduh rekapitulasi pembukuan kas mingguan terverifikasi dalam format spreadsheet Excel (`.xlsx`). Akses Publik.

**Response 200:**
- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`: `attachment; filename="Kas-Masjid-Al-Luqman-YYYY-MM-DD.xlsx"`

---

### `GET /api/reports/export/monthly/excel`
Unduh rekapitulasi pembukuan kas bulanan terverifikasi dalam format spreadsheet Excel (`.xlsx`). Akses Publik.
- **Query Params:** `year` (number), `month` (1–12)

**Response 200:**
- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`: `attachment; filename="Rekap-Kas-Bulanan-Al-Luqman-YYYY-MM.xlsx"`

---

### `GET /api/reports/:id/export/pdf`
Unduh rekapitulasi pembukuan kas mingguan terverifikasi dalam format dokumen PDF vektor resmi A4 (`.pdf`). Menghasilkan file lampiran langsung sehingga memicu notifikasi unduhan browser dan masuk ke riwayat unduhan. Akses Publik.

**Response 200:**
- `Content-Type`: `application/pdf`
- `Content-Disposition`: `attachment; filename="Kas-Masjid-Al-Luqman-YYYY-MM-DD.pdf"`

---

### `GET /api/reports/export/monthly/pdf`
Unduh rekapitulasi pembukuan kas bulanan terverifikasi dalam format dokumen PDF vektor resmi A4 (`.pdf`). Lengkap dengan Kop DKM, kartu ringkasan saldo, tabel mutasi kas, dan kolom tanda tangan pengesahan. Akses Publik.
- **Query Params:** `year` (number), `month` (1–12)

**Response 200:**
- `Content-Type`: `application/pdf`
- `Content-Disposition`: `attachment; filename="Rekap-Kas-Bulanan-Al-Luqman-YYYY-MM.pdf"`

---

## Matriks Hak Akses & Ringkasan Seluruh Endpoint API (RBAC 3-Tier)

Tabel berikut merangkum seluruh endpoint backend di `app/api/` beserta batasan otorisasi dan penanganan status kode HTTP yang berlaku secara presisi:

| Method | Path | Deskripsi Fungsional | Akses Minimal | Tanpa Sesi | Role `null` (Jamaah) |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Auth** | | | | | |
| `GET/POST` | `/api/auth/[...nextauth]` | Handlers SSO OAuth Google & token sesi JWT | Publik | `200` | `200` |
| **Pengguna** | | | | | |
| `GET` | `/api/users` | Daftar akun, peran, dan riwayat audit | **ADMIN** | `401` | `403` |
| `PATCH` | `/api/users` | Ubah peran pengguna (`ADMIN`, `BENDAHARA`, `null`) | **ADMIN** | `401` | `403` |
| `DELETE` | `/api/users` | Hapus akun pengguna (dilindungi proteksi riwayat audit) | **ADMIN** | `401` | `403` |
| **Laporan & Lampiran** | | | | | |
| `GET` | `/api/reports` | Daftar laporan kas mingguan (select aman tanpa AI dump) | Publik | `200` | `200` |
| `POST` | `/api/reports` | Unggah laporan baru dan berkas fisik ke Supabase | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| `GET` | `/api/reports/:id` | Detail laporan dan metadata berkas | Publik | `200` | `200` |
| `DELETE` | `/api/reports/:id` | Hapus laporan beserta seluruh transaksi & storage | **ADMIN** | `401` | `403` |
| `POST` | `/api/reports/:id/attachments` | Tambah berkas lampiran baru ke laporan | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| `DELETE` | `/api/attachments/:id` | Hapus satu berkas lampiran tertentu | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| **Ekstraksi AI & Mutasi Transaksi** | | | | | |
| `POST` | `/api/attachments/:id/extract` | Picu ekstraksi OCR Vision-LLM Gemini | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| `GET` | `/api/reports/:id/transactions` | Daftar transaksi (publik/null: hanya verified; staf: +draf) | Publik (terfilter) | `200` | `200` (verified) |
| `PATCH` | `/api/transactions/:id` | Koreksi transaksi sebelum verifikasi | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| `DELETE` | `/api/transactions/:id` | Hapus transaksi unverified / draf | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| `POST` | `/api/transactions/:id/confirm` | Verifikasi transaksi & tautkan donatur | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| `POST` | `/api/transactions/:id/unverify` | Batalkan verifikasi transaksi kas | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| `PATCH` | `/api/transactions/:id/donor` | Edit nama donatur transaksi terverifikasi | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| `PATCH` | `/api/transactions/:id/category` | Klasifikasi kategori pengeluaran kas | **Staf** (`ADMIN`/`BENDAHARA`) | `401` | `403` |
| **Financial Intelligence & Ekspor** | | | | | |
| `GET` | `/api/dashboard/trend` | Data grafik tren kas mingguan Jumat / bulanan | Publik | `200` | `200` |
| `GET` | `/api/donors` | Daftar donatur agregat & anonim (filter tahun/bulan) | Publik | `200` | `200` |
| `GET` | `/api/donors/:id` | Riwayat transaksi infaq per donatur | Publik | `200` | `200` |
| `GET` | `/api/donors/anonymous/transactions` | Rincian transaksi infaq anonim terverifikasi | Publik | `200` | `200` |
| `GET` | `/api/expenses` | Agregasi persentase pengeluaran per kategori | Publik | `200` | `200` |
| `GET` | `/api/expenses/transactions` | Rincian transaksi pengeluaran per kategori | Publik | `200` | `200` |
| `GET` | `/api/reports/:id/export/pdf` | Unduh file resmi PDF A4 laporan mingguan | Publik | `200` | `200` |
| `GET` | `/api/reports/:id/export/excel` | Unduh spreadsheet Excel laporan mingguan | Publik | `200` | `200` |
| `GET` | `/api/reports/export/monthly/pdf` | Unduh file resmi PDF A4 rekapitulasi bulanan | Publik | `200` | `200` |
| `GET` | `/api/reports/export/monthly/excel` | Unduh spreadsheet Excel rekapitulasi bulanan | Publik | `200` | `200` |
