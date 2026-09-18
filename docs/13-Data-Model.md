# 13. Data Model

## Entities

### User & Auth (NextAuth.js SSO) — V3

Untuk mendukung Google SSO melalui `@auth/prisma-adapter`, tabel `User` dirombak dan ditambahkan tiga tabel infrastruktur standar NextAuth.

**1. User (Pengurus DKM)**
| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| name | text | Optional | Nama profil dari akun Google |
| email | text, unique | Yes | Email akun Google |
| emailVerified | timestamp | Optional | Standar NextAuth |
| image | text | Optional | URL avatar dari Google |
| role | text | Optional | 'Admin' / 'Guest' (dikelola manual oleh Superadmin nanti) |

**2. Infrastruktur NextAuth (Wajib untuk Prisma Adapter)**
*   **Account**: Menyimpan informasi token akses OAuth dari Google.
*   **Session**: Mengelola masa aktif login pengguna di peramban.
*   **VerificationToken**: Tabel standar NextAuth untuk verifikasi *magic link* (meski saat ini fokus pada Google OAuth).

### Report (Laporan Mingguan)

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| reportDate | date (tanggal Jumat laporan) | Yes | |
| year / month / weekOfMonth | number (diturunkan otomatis dari reportDate) | Yes | |
| uploadedAt | timestamp | Yes | |
| uploadedById | reference ke User | Yes | Terhubung langsung ke ID User dari hasil login Google SSO |

> **Perubahan dari V1:** field `photoUrl` dihapus dari `Report` — sebuah laporan kini bisa memiliki banyak file lewat entity `Attachment` di bawah, bukan satu foto tunggal.

### Attachment (Lampiran File) — V2

Satu `Report` memiliki banyak `Attachment` (gambar, PDF, atau Excel).

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| reportId | reference ke Report | Yes | |
| fileUrl | text | Yes | URL publik dari Supabase Storage |
| fileType | enum (image / pdf / excel) | Yes | Menentukan cara ekstraksi data di V4 |
| originalFileName | text | Yes | Nama file asli saat diunggah |
| fileSizeBytes | number | Yes | |
| extractionStatus | enum (pending / processing / done / failed) | Direncanakan (V4) | Status proses OCR/parsing |
| uploadedAt | timestamp | Yes | |

### Transaction (Data Transaksi Mentah) — Direncanakan V4

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
| isVerified | boolean, default false | Yes | Menandai apakah data hasil ekstraksi sudah dikonfirmasi manual — data yang belum diverifikasi tidak dihitung dalam dashboard V5 |
| rawExtractedText | text | Optional | Teks mentah hasil ekstraksi, untuk audit/debug |

### Donor (Donatur) — Direncanakan V5

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| name | text | Yes | |
| contact | text | Optional | |
| totalContribution | decimal (computed/cached) | — | Keputusan teknis (on-the-fly vs cache) diambil saat implementasi V5 |

## Relationships

```text
User
 └── Report (satu user mengunggah banyak laporan)
 └── Account / Session (satu user bisa memiliki beberapa sesi/akun OAuth)

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
- `Attachment.extractionStatus` (V4) dimulai dari `pending`, diproses asinkron, diupdate ke `done`/`failed`
- `Transaction` (V4) yang `isVerified = false` tidak dihitung dalam kalkulasi tren/dashboard di V5
- `Donor` (V5) dicocokkan berdasarkan nama (fuzzy matching sederhana), bisa digabung manual oleh bendahara jika ada duplikat/typo

## Notes

Struktur ini modular per fase:
- **V2** fokus pada `Attachment`.
- **V3** fokus merombak `User` dan menambah infrastruktur NextAuth (`Account`, `Session`).
- **V4** baru membutuhkan `Transaction`.
- **V5** baru membutuhkan `Donor`.
Sehingga tidak perlu migrasi besar ulang tiap fase, cukup menambah tabel baru.