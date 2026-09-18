# 13. Data Model

## Entities

### User (Pengurus DKM)

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| name | text | Yes | |
| role | text (Bendahara 1 / Bendahara 2 / Pengurus / Admin) | Yes | |
| username | text, unique | Direncanakan (V5) | Untuk login individual |
| passwordHash | text | Direncanakan (V5) | Password di-hash |
| email | text, unique | Optional (V5) | Untuk reset password/notifikasi |
| isActive | boolean, default true | Direncanakan (V5) | Bendahara bisa berganti orang — akun lama dinonaktifkan, bukan dihapus |

### Report (Laporan Mingguan)

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| reportDate | date (tanggal Jumat laporan) | Yes | |
| year / month / weekOfMonth | number (diturunkan otomatis dari reportDate) | Yes | |
| uploadedAt | timestamp | Yes | |
| uploadedById | reference ke User | Yes | |

> **Perubahan dari V1:** field `photoUrl` dihapus dari `Report` — sebuah laporan kini bisa memiliki banyak file lewat entity `Attachment` di bawah, bukan satu foto tunggal.

### Attachment (Lampiran File) — V2

Satu `Report` memiliki banyak `Attachment` (gambar, PDF, atau Excel).

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| reportId | reference ke Report | Yes | |
| fileUrl | text | Yes | URL publik dari Supabase Storage |
| fileType | enum (image / pdf / excel) | Yes | Menentukan cara ekstraksi data di V3 |
| originalFileName | text | Yes | Nama file asli saat diunggah |
| fileSizeBytes | number | Yes | |
| extractionStatus | enum (pending / processing / done / failed) | Direncanakan (V3) | Status proses OCR/parsing |
| uploadedAt | timestamp | Yes | |

### Transaction (Data Transaksi Mentah) — Direncanakan V3

Hasil ekstraksi dari OCR/vision-LLM (gambar) atau parsing (PDF/Excel).

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| attachmentId | reference ke Attachment | Yes | |
| reportId | reference ke Report | Yes | Denormalisasi untuk mempermudah query tren per periode |
| type | enum (pemasukan / pengeluaran) | Yes | |
| amount | decimal | Yes | |
| description | text | Optional | Hasil OCR/parsing, bisa berantakan |
| transactionDate | date | Optional | Tanggal transaksi jika berhasil diekstrak |
| donorId | reference ke Donor | Optional | |
| isVerified | boolean, default false | Yes | Menandai apakah data hasil ekstraksi sudah dikonfirmasi manual — data yang belum diverifikasi tidak dihitung dalam dashboard V4 |
| rawExtractedText | text | Optional | Teks mentah hasil ekstraksi, untuk audit/debug |

### Donor (Donatur) — Direncanakan V4

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| name | text | Yes | |
| contact | text | Optional | |
| totalContribution | decimal (computed/cached) | — | Keputusan teknis (on-the-fly vs cache) diambil saat implementasi V4 |

## Relationships

```
User
 └── Report (satu user mengunggah banyak laporan)

Report
 ├── Attachment (satu laporan punya banyak lampiran file)
 └── Transaction (satu laporan punya banyak transaksi hasil ekstraksi)

Attachment
 └── Transaction (satu lampiran diekstrak jadi banyak transaksi)

Donor
 └── Transaction (satu donatur bisa muncul di banyak transaksi/laporan)
```

## Database Rules

- Satu `Report` wajib punya minimal 1 `Attachment`
- `reportDate` harus hari Jumat, dan tidak boleh duplikat antar laporan
- `year`, `month`, `weekOfMonth` selalu diturunkan dari `reportDate`, tidak diinput manual
- `Attachment.extractionStatus` (V3) dimulai dari `pending`, diproses asinkron, diupdate ke `done`/`failed`
- `Transaction` (V3) yang `isVerified = false` tidak dihitung dalam kalkulasi tren/dashboard di V4
- `Donor` (V4) dicocokkan berdasarkan nama (fuzzy matching sederhana), bisa digabung manual oleh bendahara jika ada duplikat/typo

## Notes

Struktur ini modular per fase — V2 hanya membutuhkan `Attachment`, V3 baru membutuhkan `Transaction`, V4 baru membutuhkan `Donor` — sehingga tidak perlu migrasi besar ulang tiap fase, cukup menambah tabel baru.
