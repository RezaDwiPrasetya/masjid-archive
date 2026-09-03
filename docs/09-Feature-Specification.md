# 09. Feature Specification

## Feature List

| ID    | Feature                            | Priority | Status  |
| ----- | ------------------------------------- | -------- | ------- |
| F-001 | Unggah Laporan                     | Must     | Planned |
| F-002 | Arsip Laporan (browse per periode) | Must     | Planned |
| F-003 | Cari Arsip                         | Must     | Planned |
| F-004 | Detail Laporan                     | Should   | Planned |

## Feature Details

### F-001 — Unggah Laporan

**Objective:** Memungkinkan bendahara mengarsipkan foto laporan mingguan dengan cepat.

**User:** Bendahara DKM

**Input:** Foto laporan + tanggal laporan (Jumat)

**Process:** Sistem menyimpan foto, mencatat tanggal, dan menentukan tahun/bulan/minggu arsip secara otomatis dari tanggal tersebut.

**Output:** Laporan tersimpan dan langsung muncul di halaman Arsip sesuai periodenya.

**Business Rules:**

- Foto dan tanggal wajib diisi sebelum bisa disimpan

**Acceptance Criteria:**

- [ ] Upload berhasil menampilkan halaman konfirmasi
- [ ] Laporan baru langsung terlihat di Arsip

---

### F-002 — Arsip Laporan

**Objective:** Menampilkan seluruh laporan tersusun rapi berdasarkan periode agar mudah ditelusuri.

**User:** Pengurus DKM

**Input:** Tidak ada input khusus — sistem menampilkan data yang sudah tersimpan.

**Process:** Sistem mengelompokkan laporan berdasarkan Tahun > Bulan > Minggu, ditampilkan dalam bentuk accordion yang bisa dibuka/tutup.

**Output:** Daftar laporan per periode, siap diklik untuk melihat detail.

**Business Rules:**

- Pengelompokan mengikuti tanggal laporan, bukan tanggal unggah

**Acceptance Criteria:**

- [ ] Struktur accordion Tahun > Bulan tampil dengan benar
- [ ] Jumlah laporan per bulan ditampilkan

---

### F-003 — Cari Arsip

**Objective:** Membantu pengguna menemukan laporan tertentu dengan cepat tanpa harus membuka semua accordion.

**User:** Pengurus DKM

**Input:** Kata kunci pencarian, filter Tahun, filter Bulan

**Process:** Sistem menyaring daftar laporan berdasarkan kombinasi kata kunci dan filter yang dipilih.

**Output:** Daftar laporan yang cocok, ditampilkan dalam bentuk grid card.

**Business Rules:**

- Filter Tahun/Bulan bisa dikombinasikan dengan pencarian kata kunci

**Acceptance Criteria:**

- [ ] Hasil pencarian ter-update sesuai filter yang dipilih
- [ ] Pesan "tidak ditemukan" muncul jika hasil kosong

---

### F-004 — Detail Laporan

**Objective:** Menampilkan isi laporan secara jelas dan memungkinkan pengguna mengunduh atau membagikannya.

**User:** Pengurus DKM

**Input:** Laporan yang dipilih dari Arsip atau hasil pencarian

**Process:** Sistem menampilkan foto laporan ukuran penuh beserta metadata (tanggal, ukuran file).

**Output:** Tampilan detail laporan, tombol unduh dan bagikan.

**Business Rules:**

- Tombol bagikan menghasilkan tautan yang bisa diakses pengurus lain

**Acceptance Criteria:**

- [ ] Foto tampil jelas dalam resolusi penuh
- [ ] Tombol unduh berfungsi
