# 09. Feature Specification

## Feature List

| ID | Feature | Priority | Status |
|---|---|---|---|
| F-001 | Unggah Laporan | Must | ✅ Done (V1) |
| F-002 | Arsip Laporan (browse per periode) | Must | ✅ Done (V1) |
| F-003 | Cari Arsip | Must | ✅ Done (V1) |
| F-004 | Detail Laporan | Should | ✅ Done (V1) |
| F-005 | Multi-File Upload per Laporan | Must | Planned (V2) |
| F-006 | Tampilan Multi-Lampiran di Detail Laporan | Must | Planned (V2) |
| F-007 | Validasi Tipe & Ukuran File per Jenis | Must | Planned (V2) |
| F-008 | Hapus Lampiran Sebelum Submit | Should | Planned (V2) |

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
- [ ] Bisa memilih 3+ file sekaligus dalam satu form
- [ ] Bisa kombinasi tipe file berbeda dalam satu submit
- [ ] Semua file yang dipilih berhasil tersimpan sebagai lampiran terpisah

### F-006 — Tampilan Multi-Lampiran di Detail Laporan

**Objective:** Menampilkan seluruh lampiran sebuah laporan dengan cara yang sesuai tipe filenya masing-masing.
**User:** Pengurus DKM
**Output:**
- Gambar → ditampilkan sebagai foto (bisa diperbesar)
- PDF → kartu dengan ikon PDF, nama file asli, tombol "Buka" dan "Unduh"
- Excel → kartu dengan ikon Excel, nama file asli, tombol "Unduh"
**Acceptance Criteria:**
- [ ] Semua lampiran dari satu laporan tampil, tidak ada yang hilang
- [ ] Preview/ikon sesuai dengan tipe file masing-masing
- [ ] Tombol unduh berfungsi untuk semua tipe file

### F-007 — Validasi Tipe & Ukuran File per Jenis

**Objective:** Mencegah file yang tidak didukung atau terlalu besar merusak sistem atau membengkakkan storage.
**Business Rules:**
| Tipe File | Ekstensi Diterima | Ukuran Maksimum |
|---|---|---|
| Gambar | .jpg, .jpeg, .png | 5 MB |
| PDF | .pdf | 10 MB |
| Excel | .xlsx, .xls | 5 MB |
**Acceptance Criteria:**
- [ ] File dengan ekstensi di luar daftar ditolak dengan pesan jelas
- [ ] File yang melebihi ukuran maksimum ditolak dengan pesan jelas

### F-008 — Hapus Lampiran Sebelum Submit

**Objective:** Memberi kesempatan bendahara membatalkan salah satu file yang sudah dipilih sebelum submit final.
**User:** Bendahara DKM
**Acceptance Criteria:**
- [ ] Klik hapus pada satu file menghilangkannya dari daftar, tanpa mempengaruhi file lain
