# 09. Feature Specification

## Feature List

| ID | Feature | Priority | Status |
|---|---|---|---|
| F-001 | Unggah Laporan | Must | ✅ Done (V1) |
| F-002 | Arsip Laporan (browse per periode) | Must | ✅ Done (V1) |
| F-003 | Cari Arsip | Must | ✅ Done (V1) |
| F-004 | Detail Laporan | Should | ✅ Done (V1) |
| F-005 | Multi-File Upload per Laporan | Must | ✅ Done (V2) |
| F-006 | Tampilan Multi-Lampiran di Detail Laporan | Must | ✅ Done (V2) |
| F-007 | Validasi Tipe & Ukuran File per Jenis | Must | ✅ Done (V2) |
| F-008 | Manajemen Lampiran (Hapus & Tambah Susulan) | Should | ✅ Done (V2) |
| F-009 | Login Google SSO (NextAuth) | Must | ✅ Done (V3) |
| F-010 | Proteksi Rute & Aksi (Role-Based Access) | Must | ✅ Done (V3) |
| F-011 | Ekstraksi Data Laporan (Vision-LLM) | Must | Planned (V4) |
| F-012 | Review & Verifikasi Transaksi | Must | Planned (V4) |

## Feature Details — V1

### F-001 — Unggah Laporan

**Objective:** Memungkinkan bendahara mengarsipkan foto laporan mingguan dengan cepat.
**User:** Bendahara DKM
**Input:** Foto laporan + tanggal laporan (Jumat)
**Process:** Sistem menyimpan foto, mencatat tanggal, dan menentukan tahun/bulan/minggu arsip secara otomatis dari tanggal tersebut. Validasi mencakup: tanggal harus hari Jumat, tidak boleh duplikat dengan laporan yang sudah ada.
**Output:** Laporan tersimpan dan langsung muncul di halaman Arsip sesuai periodenya.
**Acceptance Criteria:**
- [x] Upload berhasil menampilkan halaman konfirmasi
- [x] Laporan baru langsung terlihat di Arsip

### F-002 — Arsip Laporan

**Objective:** Menampilkan seluruh laporan tersusun rapi berdasarkan periode agar mudah ditelusuri.
**User:** Pengurus DKM
**Process:** Sistem mengelompokkan laporan berdasarkan Tahun > Bulan, ditampilkan dalam bentuk accordion yang bisa dibuka/tutup.
**Acceptance Criteria:**
- [x] Struktur accordion Tahun > Bulan tampil dengan benar
- [x] Jumlah laporan per bulan ditampilkan

### F-003 — Cari Arsip

**Objective:** Membantu pengguna menemukan laporan tertentu dengan cepat.
**User:** Pengurus DKM
**Input:** Kata kunci pencarian, filter Tahun, filter Bulan
**Acceptance Criteria:**
- [x] Hasil pencarian ter-update sesuai filter yang dipilih
- [x] Pesan "tidak ditemukan" muncul jika hasil kosong

### F-004 — Detail Laporan

**Objective:** Menampilkan isi laporan secara jelas dan memungkinkan pengguna mengunduh atau membagikannya.
**User:** Pengurus DKM
**Acceptance Criteria:**
- [x] Foto tampil jelas dalam resolusi penuh
- [x] Tombol unduh berfungsi

---

## Feature Details — V2 (Multi-Format Upload)

### F-005 — Multi-File Upload per Laporan

**Objective:** Memungkinkan bendahara melampirkan lebih dari satu file (kombinasi gambar/PDF/Excel) dalam satu laporan mingguan.
**User:** Bendahara DKM
**Input:** Beberapa file sekaligus, tanggal laporan, pengunggah
**Process:**
- Setiap file yang dipilih ditampilkan sebagai preview/list sebelum submit
- Saat submit, setiap file diunggah ke Supabase Storage secara individual
- Untuk setiap file yang berhasil, satu record `Attachment` dibuat, semuanya terhubung ke satu `Report` yang sama
**Business Rules:**
- Minimal 1 file wajib ada
- Tidak ada batas maksimum jumlah file per laporan
**Acceptance Criteria:**
- [x] Bisa memilih 3+ file sekaligus dalam satu form
- [x] Bisa kombinasi tipe file berbeda dalam satu submit
- [x] Semua file yang dipilih berhasil tersimpan sebagai lampiran terpisah

### F-006 — Tampilan Multi-Lampiran di Detail Laporan

**Objective:** Menampilkan seluruh lampiran sebuah laporan dengan cara yang sesuai tipe filenya masing-masing.
**User:** Pengurus DKM
**Output:**
- Gambar → ditampilkan sebagai foto (bisa diperbesar)
- PDF → kartu dengan ikon PDF, nama file asli, tombol "Buka" dan "Unduh"
- Excel → kartu dengan ikon Excel, nama file asli, tombol "Unduh"
**Acceptance Criteria:**
- [x] Semua lampiran dari satu laporan tampil, tidak ada yang hilang
- [x] Preview/ikon sesuai dengan tipe file masing-masing
- [x] Tombol unduh berfungsi untuk semua tipe file

### F-007 — Validasi Tipe & Ukuran File per Jenis

**Objective:** Mencegah file yang tidak didukung atau terlalu besar merusak sistem atau membengkakkan storage.
**Business Rules:**
| Tipe File | Ekstensi Diterima | Ukuran Maksimum |
|---|---|---|
| Gambar | .jpg, .jpeg, .png | 5 MB |
| PDF | .pdf | 10 MB |
| Excel | .xlsx, .xls | 5 MB |
**Acceptance Criteria:**
- [x] File dengan ekstensi di luar daftar ditolak dengan pesan jelas
- [x] File yang melebihi ukuran maksimum ditolak dengan pesan jelas

### F-008 — Manajemen Lampiran (Hapus & Tambah Susulan)

**Objective:** Memberi kendali penuh kepada bendahara untuk menghapus file yang salah atau menambahkan file yang tertinggal, baik sebelum maupun sesudah laporan diunggah.
**User:** Bendahara DKM
**Acceptance Criteria:**
- [x] Klik hapus pada satu file di form unggah menghilangkannya dari daftar, tanpa mempengaruhi file lain
- [x] Bisa menghapus satu lampiran spesifik pada laporan yang sudah terunggah di halaman Detail
- [x] Bisa menambahkan lampiran baru pada laporan yang sudah ada melalui halaman Detail

---

## Feature Details — V3 (Autentikasi SSO)

### F-009 — Login Google SSO

**Objective:** Menggantikan kredensial statis dengan login akun Google yang aman dan terpusat untuk para pengurus DKM.
**User:** Pengurus DKM
**Process:** Pengguna menekan tombol "Masuk dengan Google". Sistem mengautentikasi via Google OAuth 2.0 dan menyimpan data profil (nama, email, avatar) ke dalam tabel `User` di Vercel Postgres. Sesi dikelola secara otomatis oleh NextAuth.
**Acceptance Criteria:**
- [x] Terdapat tombol "Masuk dengan Google" di menu navigasi bagi pengunjung (Guest).
- [x] Pengguna berhasil login menggunakan akun Google dan data profil tersimpan ke dalam database.
- [x] Avatar dan nama Google pengguna tampil di antarmuka jika sesi sedang aktif.
- [x] Sesi login persisten dan pengguna bisa mengakhirinya dengan menekan tombol "Keluar".

### F-010 — Proteksi Rute & Aksi (Role-Based Access)

**Objective:** Mencegah publik mengotak-atik arsip laporan dan membatasi hak akses operasional hanya kepada pengurus yang memiliki sesi login valid.
**User:** Sistem / Publik / Pengurus
**Process:** Proxy Next.js (`proxy.ts`) mencegat *request* ke halaman terproteksi. Komponen antarmuka (UI) mengecek status sesi sebelum merender tombol aksi mutasi.
**Acceptance Criteria:**
- [x] Publik (Guest) tetap bisa mengakses halaman Beranda (Arsip), Pencarian, dan Detail Laporan (mode baca).
- [x] Publik akan diblokir dan dikembalikan ke halaman utama jika mencoba mengakses rute `/unggah`.
- [x] Endpoint API untuk mutasi data (POST / DELETE) merespons dengan status `401 Unauthorized` jika diakses tanpa sesi yang valid.
- [x] Tombol aksi destruktif ("Hapus Laporan", "Hapus Lampiran") dan konstruktif ("+ Tambah Lampiran") disembunyikan dari UI jika pengguna tidak memiliki sesi login aktif.

---

## Feature Details — V4 (Ekstraksi Data)

> **Catatan scope:** Fase V4 ini fokus pada lampiran bertipe **gambar** (foto laporan tulisan tangan), karena itu yang jadi bentuk laporan utama DKM saat ini. Parsing terstruktur untuk PDF/Excel disebut di Product Plan sebagai bagian dari visi V4, tapi belum ditetapkan cakupannya di sini — perlu didiskusikan apakah masuk peningkatan berikutnya di V4 atau digeser jadi sub-fase terpisah setelah alur ekstraksi gambar terbukti jalan.

### F-011 — Ekstraksi Data Laporan (Vision-LLM)

**Objective:** Memungkinkan bendahara mengubah foto laporan (tulisan tangan) menjadi data transaksi terstruktur, tanpa perlu mengetik ulang manual.
**User:** Bendahara DKM
**Input:** Lampiran bertipe gambar yang berstatus `not_extracted` atau `failed`
**Process:**
- Bendahara membuka halaman Detail Laporan, menekan tombol "Ekstrak Data" pada satu lampiran gambar
- Status `Attachment.extractionStatus` berubah jadi `processing`
- Server mengirim gambar ke vision-LLM (Gemini) dengan prompt terstruktur, meminta output JSON berisi daftar transaksi (tipe, jumlah, deskripsi, tanggal jika ada)
- Respons mentah disimpan ke `Attachment.extractionRawResponse`, lalu diparsing jadi baris-baris `Transaction` baru dengan `isVerified = false`
- Status berubah jadi `done` (berhasil, minimal 1 transaksi terbentuk) atau `failed` (error API, atau respons tidak bisa diparsing)
**Output:** Daftar transaksi baru (belum diverifikasi) siap ditinjau lewat F-012
**Business Rules:**
- Ekstraksi hanya bisa dipicu satu attachment dalam satu waktu (tidak ada bulk-extract di V4 awal, untuk menjaga kesederhanaan & kuota API gratis)
- Ekstraksi ulang (re-extract) pada attachment yang sudah `done` akan mengganti transaksi lama yang belum diverifikasi; transaksi yang sudah diverifikasi tidak ikut terhapus (lihat Data Model)
**Acceptance Criteria:**
- [ ] Tombol "Ekstrak Data" hanya tampil pada lampiran gambar berstatus `not_extracted` atau `failed`
- [ ] Setelah diklik, UI menampilkan status loading/processing, tombol nonaktif sementara proses berjalan
- [ ] Jika berhasil, transaksi baru langsung terlihat di daftar "Belum Diverifikasi" pada laporan tersebut
- [ ] Jika gagal, status menjadi `failed` dengan pesan error yang jelas (bukan pesan teknis mentah), dan tombol berubah jadi "Coba Lagi"

### F-012 — Review & Verifikasi Transaksi

**Objective:** Memberi bendahara kendali penuh untuk meninjau, mengoreksi, dan mengonfirmasi data hasil ekstraksi sebelum dihitung sebagai data resmi.
**User:** Bendahara DKM
**Input:** Baris `Transaction` dengan `isVerified = false`
**Process:**
- Baris transaksi hasil ekstraksi ditampilkan dalam daftar yang jelas ditandai "Belum Diverifikasi", dikelompokkan per laporan
- Bendahara bisa mengedit field (`type`, `amount`, `description`, `transactionDate`) langsung di daftar tersebut sebelum konfirmasi
- Tombol **"Konfirmasi"**: menandai `isVerified = true`, mencatat `verifiedById` (dari sesi aktif) dan `verifiedAt`
- Tombol **"Hapus"**: membuang baris yang salah/duplikat/tidak relevan (misal LLM salah membaca coretan sebagai transaksi)
**Business Rules:**
- Transaksi yang sudah `isVerified = true` tidak bisa dihapus lewat alur normal ini (butuh aksi terpisah, di luar scope V4 awal, untuk mencegah penghapusan data resmi secara tidak sengaja)
- Transaksi dengan `isVerified = false` tidak muncul di perhitungan mana pun sampai V5 dibangun
**Acceptance Criteria:**
- [ ] Semua transaksi `isVerified = false` tampil jelas ditandai "Belum Diverifikasi", terpisah dari (nanti) yang sudah diverifikasi
- [ ] Bendahara bisa mengedit field transaksi sebelum menekan "Konfirmasi"
- [ ] Menekan "Konfirmasi" mengubah `isVerified` jadi `true` dan mencatat `verifiedById` + `verifiedAt`
- [ ] Menekan "Hapus" pada transaksi yang belum diverifikasi langsung membuang baris tersebut
- [ ] Transaksi yang sudah diverifikasi tidak menampilkan tombol "Hapus" di alur ini
