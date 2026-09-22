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
| initialBalance | decimal | Optional (V4) | Saldo lalu / saldo awal kas masjid yang tertulis di kertas laporan minggu ini |
| finalBalance | decimal | Optional (V4) | Saldo kas akhir yang tertulis di kertas laporan setelah mutasi |

> **Perubahan dari V1:** field `photoUrl` dihapus dari `Report` — sebuah laporan kini bisa memiliki banyak file lewat entity `Attachment` di bawah, bukan satu foto tunggal.

> **Perubahan dari V4 awal:** `initialBalance` dan `finalBalance` sempat disimpan di `Attachment`. Ini dipindahkan ke `Report` di migration `20260922012300_move_balance_to_report` karena saldo kas mingguan adalah properti **laporan** (satu laporan = satu minggu = satu saldo awal/akhir), bukan properti **file lampiran**. Penyimpanan di `Attachment` ambigu ketika satu laporan memiliki lebih dari satu foto.

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
| extractionModel | text | Optional (V4) | Nama model yang dipakai saat ekstraksi (mis. `gemini-3.6-flash`), untuk audit. Jika tampil badge "Model Cadangan" di UI, artinya model utama gagal dan sistem otomatis beralih ke model fallback |
| extractionRawResponse | json | Optional (V4) | Respons mentah lengkap dari vision-LLM untuk satu kali pemanggilan ekstraksi — dipakai untuk debug/audit dan sebagai sumber saat parsing ulang jika diperlukan, tanpa perlu memanggil API lagi |
| extractionError | text | Optional (V4) | Pesan error singkat & ramah pengguna saat `extractionStatus = failed`; dikosongkan lagi (`null`) begitu ekstraksi ulang berhasil |
| extractedAt | timestamp | Optional (V4) | Waktu ekstraksi terakhir dijalankan |
| uploadedAt | timestamp | Yes | |

> **Catatan V4:** `extractionStatus` sengaja bukan `pending` di kondisi awal, untuk menghindari kesan "menunggu diproses otomatis". Nilai `not_extracted` menandaskan bahwa ekstraksi murni aksi manual yang dipicu bendahara, sejalan dengan keputusan alur kerja V4 (tombol "Ekstrak Data", bukan otomatis saat upload).

### Transaction (Data Transaksi) — V4, diperluas V5

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
| donorNameRaw | text | Optional (V5) | Nama donatur mentah — hasil ekstraksi vision-LLM (jika ada nama tertulis di baris transaksi) atau input manual bendahara saat review. Bernilai `null` untuk transaksi bertipe `pengeluaran` atau pemasukan tanpa nama tertulis |
| donorId | reference ke Donor | Optional (V5) | Diisi lewat proses fuzzy matching terhadap `donorNameRaw` saat transaksi dikonfirmasi. **Tetap `null`** jika `donorNameRaw` kosong atau teksnya cocok pola anonim (mis. "Hamba Allah", "Anonim", "Tanpa Nama") — donasi anonim sengaja TIDAK dijadikan entity `Donor` individual |
| isVerified | boolean, default false | Yes | Menandai apakah baris ini sudah dikonfirmasi manual oleh bendahara — baris yang belum diverifikasi **tidak dihitung** dalam dashboard V5 |
| verifiedById | reference ke User | Optional | Siapa yang mengonfirmasi baris ini; diisi otomatis dari sesi aktif saat tombol "Konfirmasi" ditekan |
| verifiedAt | timestamp | Optional | Kapan verifikasi dilakukan |

> **Catatan V4:** dokumen versi sebelumnya menyimpan `rawExtractedText` per baris `Transaction`. Ini dipindahkan ke level `Attachment` (`extractionRawResponse`) karena satu pemanggilan ekstraksi bisa menghasilkan banyak baris `Transaction` sekaligus — menyimpan payload mentah di tiap baris akan redundan. Baris `Transaction` sekarang murni berisi data yang sudah diparsing/terstruktur.

> **Catatan V5:** `donorNameRaw` ditambahkan sebagai perluasan **aditif** (tidak mengubah apa pun) dari schema ekstraksi V4 — `responseSchema` Gemini yang sudah ada di 12-Technical-Specification.md ditambah satu field opsional baru `donorName` per baris transaksi. Ini tidak menyentuh ulang alur ekstraksi V4 yang sudah selesai & di-push, cuma menambah satu kolom baru yang dibaca kalau ada.

### Donor (Donatur) — V5

Entity global (tidak terikat ke satu `Report`) — satu donatur bisa muncul lintas banyak laporan/minggu, sehingga `totalContribution` bisa dihitung akumulatif dari waktu ke waktu.

| Field | Type | Required | Catatan |
|---|---|---|---|
| id | identifier | Yes | |
| name | text | Yes | Nama tampilan (canonical) — diambil dari kemunculan pertama `donorNameRaw` yang berhasil di-*match*/dibuat |
| normalizedName | text, unique | Yes | Versi ternormalisasi dari `name` (lowercase, whitespace dirapikan, prefix gelar dihapus) — dipakai sebagai kunci pencocokan fuzzy, BUKAN ditampilkan ke pengguna |
| contact | text | Optional | Diisi manual oleh pengurus jika diperlukan (belum ada sumber otomatis untuk ini) |

> **Catatan implementasi `totalContribution`:** dihitung **on-the-fly** via agregasi SQL (`SUM(amount) WHERE donorId = X AND isVerified = true`) saat dashboard/profil donatur diakses — **bukan** kolom cache tersimpan. Alasan: volume transaksi sangat kecil (organisasi 1 masjid, transaksi mingguan terbatas), sehingga agregasi on-the-fly nyaris tidak berdampak performa, dan ini menghindari kompleksitas cache-invalidation (harus di-update tiap kali ada transaksi baru/diedit/dihapus) yang tidak sepadan manfaatnya untuk skala ini.

## Aturan Fuzzy Matching Donatur (V5)

Level yang dipakai: **normalisasi standar + pembersihan prefix ringan** (bukan Levenshtein/typo-tolerant penuh):

1. **Normalisasi**: `trim()`, lowercase, rapikan spasi ganda jadi satu spasi
2. **Hapus prefix gelar umum** dari awal string (case-insensitive): `bpk`, `bapak`, `ibu`, `sdr`, `sdri`, `mas`, `mbak`, `h.`, `hj.`, `ust`, `ustadz`, `ustadzah`
3. Hasil akhir dibandingkan **exact match** terhadap `Donor.normalizedName` yang sudah ada
4. **Cocok** → transaksi ditautkan ke `Donor` yang sudah ada
5. **Tidak cocok** → `Donor` baru dibuat, `name` diisi dari teks asli (sebelum normalisasi) sebagai nama tampilan

**Pengecualian donasi anonim:** jika `donorNameRaw` (setelah normalisasi) mengandung pola `hamba allah`, `anonim`, atau `tanpa nama` — transaksi **TIDAK** ditautkan ke entity `Donor` mana pun (`donorId` tetap `null`). Ini sengaja dipisah dari mekanisme fuzzy matching biasa, karena menciptakan satu `Donor` bernama "Hamba Allah" yang menampung banyak orang berbeda justru menyesatkan (seolah-olah satu orang yang rutin menyumbang besar). Total donasi anonim tetap dihitung sebagai agregat terpisah di dashboard (misalnya "Infaq Anonim: Rp X" tanpa profil individual).

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
 └── Transaction (satu donatur bisa muncul di banyak transaksi/laporan, LINTAS periode — donorId nullable untuk donasi anonim)
```

## Database Rules

- Satu `Report` wajib punya minimal 1 `Attachment`
- `reportDate` harus hari Jumat, dan tidak boleh duplikat antar laporan
- `year`, `month`, `weekOfMonth` selalu diturunkan dari `reportDate`, tidak diinput manual
- `Attachment.extractionStatus` (V4) dimulai dari `not_extracted`, hanya berubah ke `processing` saat dipicu manual oleh bendahara, lalu ke `done`/`failed`
- Saat ekstraksi berhasil membaca `initialBalance`/`finalBalance`, nilai disimpan ke **`Report` induk** (bukan `Attachment`) — saldo kas mingguan adalah properti laporan, bukan lampiran individual.
- Ekstraksi ulang (re-extract) pada `Attachment` yang sudah `done` akan menghapus `Transaction` lama yang belum diverifikasi (`isVerified = false`) dari attachment tersebut sebelum menyimpan hasil baru — `Transaction` yang sudah `isVerified = true` tidak boleh terhapus otomatis oleh proses re-extract, harus dihapus manual jika memang perlu
- `Transaction` yang `isVerified = false` tidak dihitung dalam kalkulasi tren/dashboard di V5, **dan tidak boleh terlihat oleh publik lewat endpoint apa pun** (termasuk yang menampilkan agregasi per-donatur)
- **`Donor.normalizedName` bersifat unik** — proses matching WAJIB mengecek keberadaan `normalizedName` yang sama sebelum membuat `Donor` baru, untuk mencegah duplikasi "Bapak Kosasih" dan "Bpk Kosasih" jadi dua entity terpisah
- Penggabungan manual `Donor` (jika bendahara sadar ada 2 entity yang seharusnya sama padahal lolos dari fuzzy matching, mis. beda ejaan total) belum punya alur UI khusus di V5 awal — dicatat sebagai keterbatasan yang diterima untuk saat ini (lihat 10-MVP-Scope.md bagian "Not Now")
- Transaksi dengan `donorNameRaw` yang cocok pola anonim ("hamba allah"/"anonim"/"tanpa nama") **tidak pernah** menghasilkan `Donor` baru, `donorId` tetap `null` selamanya untuk baris tersebut

## Notes

Struktur ini modular per fase:
- **V2** fokus pada `Attachment`.
- **V3** fokus merombak `User` dan menambah infrastruktur NextAuth (`Account`, `Session`).
- **V4** menambahkan field ekstraksi di `Attachment`, entity `Transaction` baru, serta `initialBalance`/`finalBalance` di `Report`.
- **V5** menambahkan entity `Donor`, field `donorNameRaw` di `Transaction` (perluasan aditif dari skema ekstraksi V4), dan aturan fuzzy matching + pengecualian donasi anonim.
Sehingga tidak perlu migrasi besar ulang tiap fase, cukup menambah tabel/kolom baru.
