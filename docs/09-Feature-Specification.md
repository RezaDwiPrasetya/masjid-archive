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
| F-009 | Login Google SSO (NextAuth) | Must | Planned (V3) |
| F-010 | Proteksi Rute & Aksi (Role-Based Access) | Must | Planned (V3) |

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
- [ ] Terdapat tombol "Masuk dengan Google" di menu navigasi bagi pengunjung (Guest).
- [ ] Pengguna berhasil login menggunakan akun Google dan data profil tersimpan ke dalam database.
- [ ] Avatar dan nama Google pengguna tampil di antarmuka jika sesi sedang aktif.
- [ ] Sesi login persisten dan pengguna bisa mengakhirinya dengan menekan tombol "Keluar".

### F-010 — Proteksi Rute & Aksi (Role-Based Access)

**Objective:** Mencegah publik mengotak-atik arsip laporan dan membatasi hak akses operasional hanya kepada pengurus yang memiliki sesi login valid.
**User:** Sistem / Publik / Pengurus
**Process:** Next.js Middleware mencegat *request* ke halaman terproteksi. Komponen antarmuka (UI) mengecek status sesi sebelum merender tombol aksi mutasi.
**Acceptance Criteria:**
- [ ] Publik (Guest) tetap bisa mengakses halaman Beranda (Arsip), Pencarian, dan Detail Laporan (mode baca).
- [ ] Publik akan diblokir dan dikembalikan ke halaman utama jika mencoba mengakses rute `/unggah`.
- [ ] Endpoint API untuk mutasi data (POST / DELETE) merespons dengan status `401 Unauthorized` jika diakses tanpa sesi yang valid.
- [ ] Tombol aksi destruktif ("Hapus Laporan", "Hapus Lampiran") dan konstruktif ("+ Tambah Lampiran") disembunyikan dari UI jika pengguna tidak memiliki sesi login aktif.