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

### Attachment (Lampiran File) — V2, diperluas V4

Satu `Report` memiliki banyak `Attachment` (gambar, PDF, atau Excel).

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| reportId | reference ke Report | Yes | |
| fileUrl | text | Yes | URL publik dari Supabase Storage |
| fileType | enum (image / pdf / excel) | Yes | Menentukan cara ekstraksi data di V4 |
| originalFileName | text | Yes | Nama file asli saat diunggah |
| fileSizeBytes | number | Yes | |
| extractionStatus | enum (`not_extracted` / `processing` / `done` / `failed`) | V4 | Default `not_extracted` — **tidak** dimulai otomatis saat upload. Berubah ke `processing` hanya saat bendahara menekan tombol "Ekstrak Data" secara manual |
| extractionModel | text | Optional (V4) | Nama model yang dipakai saat ekstraksi (mis. `gemini-2.0-flash-lite`), untuk audit jika model diganti di kemudian hari |
| extractionRawResponse | json | Optional (V4) | Respons mentah lengkap dari vision-LLM untuk satu kali pemanggilan ekstraksi — dipakai untuk debug/audit dan sebagai sumber saat parsing ulang jika diperlukan, tanpa perlu memanggil API lagi |
| extractionError | text | Optional (V4) | Pesan error singkat & ramah pengguna saat `extractionStatus = failed`; dikosongkan lagi (`null`) begitu ekstraksi ulang berhasil |
| extractedAt | timestamp | Optional (V4) | Waktu ekstraksi terakhir dijalankan |
| initialBalance | decimal | Optional (V4) | Saldo awal / saldo lalu kas masjid yang tertulis di kertas laporan |
| finalBalance | decimal | Optional (V4) | Saldo kas akhir yang tertulis di kertas laporan setelah mutasi |
| uploadedAt | timestamp | Yes | |

> **Catatan V4:** `extractionStatus` sengaja bukan `pending` di kondisi awal, untuk menghindari kesan "menunggu diproses otomatis". Nilai `not_extracted` menandaskan bahwa ekstraksi murni aksi manual yang dipicu bendahara, sejalan dengan keputusan alur kerja V4 (tombol "Ekstrak Data", bukan otomatis saat upload).

### Transaction (Data Transaksi) — V4

Hasil ekstraksi dari vision-LLM (gambar) atau parsing (PDF/Excel). Satu `Attachment` bisa menghasilkan banyak `Transaction` (satu baris per pemasukan/pengeluaran yang terdeteksi).

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| attachmentId | reference ke Attachment | Yes | Sumber data mentah (lihat `extractionRawResponse` di Attachment untuk payload lengkapnya) |
| reportId | reference ke Report | Yes | Denormalisasi untuk mempermudah query tren per periode |
| type | enum (pemasukan / pengeluaran) | Yes | |
| amount | decimal | Yes | |
| description | text | Optional | Hasil ekstraksi, bisa berantakan/perlu dirapikan manual |
| transactionDate | date | Optional | Tanggal transaksi jika berhasil diekstrak |
| donorId | reference ke Donor | Optional | Baru relevan mulai V5 |
| isVerified | boolean, default false | Yes | Menandai apakah baris ini sudah dikonfirmasi manual oleh bendahara — baris yang belum diverifikasi **tidak dihitung** dalam dashboard V5 |
| verifiedById | reference ke User | Optional | Siapa yang mengonfirmasi baris ini; diisi otomatis dari sesi aktif saat tombol "Konfirmasi" ditekan |
| verifiedAt | timestamp | Optional | Kapan verifikasi dilakukan |

> **Catatan V4:** dokumen versi sebelumnya menyimpan `rawExtractedText` per baris `Transaction`. Ini dipindahkan ke level `Attachment` (`extractionRawResponse`) karena satu pemanggilan ekstraksi bisa menghasilkan banyak baris `Transaction` sekaligus — menyimpan payload mentah di tiap baris akan redundan. Baris `Transaction` sekarang murni berisi data yang sudah diparsing/terstruktur.

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
 └── Transaction (satu user bisa memverifikasi banyak transaksi, via verifiedById)
 └── Account / Session (satu user bisa memiliki beberapa sesi/akun OAuth)

Report
 ├── Attachment (satu laporan punya banyak lampiran file)
 └── Transaction (satu laporan punya banyak transaksi hasil ekstraksi, denormalisasi dari Attachment)

Attachment
 └── Transaction (satu lampiran diekstrak jadi banyak transaksi)

Donor
 └── Transaction (satu donatur bisa muncul di banyak transaksi/laporan)
```

## Database Rules

- Satu `Report` wajib punya minimal 1 `Attachment`
- `reportDate` harus hari Jumat, dan tidak boleh duplikat antar laporan
- `year`, `month`, `weekOfMonth` selalu diturunkan dari `reportDate`, tidak diinput manual
- `Attachment.extractionStatus` (V4) dimulai dari `not_extracted`, hanya berubah ke `processing` saat dipicu manual oleh bendahara, lalu ke `done`/`failed`
- Ekstraksi ulang (re-extract) pada `Attachment` yang sudah `done` akan menghapus `Transaction` lama yang belum diverifikasi (`isVerified = false`) dari attachment tersebut sebelum menyimpan hasil baru — `Transaction` yang sudah `isVerified = true` tidak boleh terhapus otomatis oleh proses re-extract, harus dihapus manual jika memang perlu
- `Transaction` (V4) yang `isVerified = false` tidak dihitung dalam kalkulasi tren/dashboard di V5
- `Donor` (V5) dicocokkan berdasarkan nama (fuzzy matching sederhana), bisa digabung manual oleh bendahara jika ada duplikat/typo

## Notes

Struktur ini modular per fase:
- **V2** fokus pada `Attachment`.
- **V3** fokus merombak `User` dan menambah infrastruktur NextAuth (`Account`, `Session`).
- **V4** menambahkan field ekstraksi di `Attachment` dan entity `Transaction` baru.
- **V5** baru membutuhkan `Donor`.
Sehingga tidak perlu migrasi besar ulang tiap fase, cukup menambah tabel/kolom baru.
