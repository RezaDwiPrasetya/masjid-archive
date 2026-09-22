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
| F-011 | Ekstraksi Data Laporan (Vision-LLM) | Must | ✅ Done (V4) |
| F-012 | Review & Verifikasi Transaksi | Must | ✅ Done (V4) |
| F-013 | Ringkasan Kas & Rekonsiliasi Saldo Kas | Should | ✅ Done (V4) |
| F-014 | Dashboard Tren Keuangan (Publik) | Must | Planned (V5) |
| F-015 | Tracking & Profil Donatur (Publik) | Must | Planned (V5) |
| F-016 | Assign Nama Donatur saat Review Transaksi | Should | Planned (V5) |

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

**Objective:** Memungkinkan bendahara mengubah foto laporan (tulisan tangan) menjadi data transaksi terstruktur, saldo awal (saldo lalu), dan saldo akhir kas, tanpa perlu mengetik ulang manual.
**User:** Bendahara DKM
**Input:** Lampiran bertipe gambar yang berstatus `not_extracted` atau `failed`
**Process:**
- Bendahara membuka halaman Detail Laporan, menekan tombol "Ekstrak Data" pada satu lampiran gambar.
- Status `Attachment.extractionStatus` berubah jadi `processing`.
- Server mengirim gambar ke vision-LLM (`gemini-3.6-flash`) dengan prompt terstruktur dan schema JSON (meminta daftar transaksi, serta `initialBalance` dan `finalBalance`).
- Dilengkapi mekanisme timeout 25 detik dan **auto-fallback ke `gemini-3.5-flash`** jika model utama mengalami lonjakan antrean/503 Service Unavailable.
- Respons mentah disimpan ke `Attachment.extractionRawResponse`, lalu diparsing jadi baris-baris `Transaction` baru dengan `isVerified = false`, serta saldo awal & akhir disimpan ke `Attachment`.
- Status berubah jadi `done` (berhasil, transaksi terbentuk) atau `failed` (error koneksi atau gambar tidak terbaca).
**Output:** Daftar transaksi baru (belum diverifikasi) siap ditinjau lewat F-012, serta ringkasan saldo kas pekanan siap ditinjau lewat F-013.
**Business Rules:**
- Ekstraksi dipicu manual per lampiran (tidak otomatis saat upload) untuk efisiensi dan menjaga kendali bendahara.
- Ekstraksi ulang (re-extract) pada attachment yang sudah `done` hanya mengganti transaksi yang belum diverifikasi (`isVerified = false`). Transaksi yang sudah terverifikasi (`isVerified = true`) **dijamin tidak terhapus otomatis**.
**Acceptance Criteria:**
- [x] Tombol "Ekstrak Data" hanya tampil pada lampiran gambar berstatus `not_extracted` atau `failed`.
- [x] Setelah diklik, UI menampilkan status loading/processing, tombol nonaktif sementara proses berjalan.
- [x] Jika berhasil, transaksi baru langsung terlihat di daftar "Menunggu Verifikasi" pada laporan tersebut.
- [x] Jika gagal, status menjadi `failed` dengan pesan error yang jelas dan ramah pengguna, serta tombol berubah jadi "Coba Lagi".
- [x] Deteksi otomatis saldo awal (`initialBalance`) dan saldo akhir kas (`finalBalance`) jika tertulis di dokumen kas.
- [x] Dilengkapi proteksi timeout 25s dan auto-fallback model agar proses tidak menggantung berlarut-larut.

### F-012 — Review & Verifikasi Transaksi

**Objective:** Memberi bendahara kendali penuh untuk meninjau, mengoreksi, dan mengonfirmasi data hasil ekstraksi sebelum dihitung sebagai data resmi kas masjid.
**User:** Bendahara DKM
**Input:** Baris `Transaction` hasil ekstraksi
**Process:**
- Baris transaksi hasil ekstraksi ditampilkan dalam dua kelompok jelas: "Menunggu Verifikasi" dan "Sudah Diverifikasi".
- Bendahara bisa mengedit field (`type`, `amount`, `description`, `transactionDate`) langsung di daftar tersebut sebelum konfirmasi.
- Tombol **"Konfirmasi"**: menandai `isVerified = true`, mencatat `verifiedById` (dari sesi aktif pengurus) dan `verifiedAt`. Menggunakan pola *server-first verification* dengan penanganan error jaringan lengkap.
- Tombol **"Hapus"**: membuang baris yang salah/duplikat/tidak relevan (misal LLM salah membaca coretan atau baris duplikat saat re-extract) dengan dialog konfirmasi modern `AlertDialog`.
**Business Rules:**
- Transaksi dengan `isVerified = false` tidak dihitung dalam saldo resmi maupun tren di V5.
- Transaksi yang sudah `isVerified = true` tidak menampilkan tombol edit/hapus di alur biasa untuk mencegah ketidaksengajaan.
- Jika pengguna ingin menghapus lampiran atau laporan yang memuat transaksi terverifikasi, sistem mengembalikan proteksi `409 Conflict` dan mewajibkan konfirmasi dua langkah via `AlertDialog`.
**Acceptance Criteria:**
- [x] Semua transaksi `isVerified = false` tampil jelas ditandai "Menunggu Verifikasi", terpisah dari yang sudah diverifikasi.
- [x] Bendahara bisa mengedit field transaksi sebelum menekan "Konfirmasi".
- [x] Menekan "Konfirmasi" mengubah `isVerified` jadi `true` dan mencatat `verifiedById` + `verifiedAt`.
- [x] Menekan "Hapus" memunculkan dialog konfirmasi `AlertDialog` sebelum menghapus baris transaksi yang belum diverifikasi.
- [x] Transaksi yang sudah diverifikasi tidak menampilkan tombol "Hapus" atau "Edit" di alur peninjauan standar.
- [x] Sinkronisasi instan state React via `useEffect` saat terjadi mutasi atau ekstrak ulang.

### F-013 — Ringkasan Kas Pekan Ini & Rekonsiliasi Saldo Kas

**Objective:** Menyajikan rekapitulasi mutasi kas mingguan dan mencocokkan perhitungan sistem dengan angka saldo yang tertulis di buku kas fisik.
**User:** Bendahara & Pengurus DKM
**Output:**
- Widget "Ringkasan Kas Pekan Ini" di bilah samping (sidebar) detail laporan.
- Komponen rincian:
  - **Saldo Lalu**: Saldo kas periode sebelumnya (dari `initialBalance` catatan fisik).
  - **Pemasukan**: Total pemasukan dari transaksi yang telah diverifikasi.
  - **Pengeluaran**: Total pengeluaran dari transaksi yang telah diverifikasi.
  - **Selisih Pekan Ini**: `Pemasukan - Pengeluaran`.
  - **Saldo Kas Akhir**: `Saldo Lalu + Selisih Pekan Ini`.
- **Indikator Rekonsiliasi Otomatis**:
  - Lencana hijau **"Perhitungan buku kas seimbang"** jika saldo akhir kalkulasi cocok dengan `finalBalance` yang tertulis di kertas.
  - Peringatan warna amber jika terdapat selisih, menampilkan angka selisih secara transparan untuk membantu bendahara menemukan kesalahan pencatatan.
**Acceptance Criteria:**
- [x] Ringkasan kas tampil otomatis jika terdapat data transaksi terverifikasi atau saldo awal/akhir dari lampiran.
- [x] Kalkulasi matematis akurat dan hanya menghitung transaksi yang telah diverifikasi (`isVerified = true`).
- [x] Lencana rekonsiliasi kas mendeteksi kecocokan angka saldo fisik secara otomatis.

---

## Feature Details — V5 (Financial Intelligence)

> **Catatan scope:** V5 murni membaca data yang sudah ada dari V4 (`Transaction`, `Report`) — tidak ada perubahan pada alur ekstraksi/verifikasi. Semua kalkulasi dan tampilan di sini **hanya** menghitung dari `Transaction.isVerified = true`, tidak ada pengecualian.

### F-014 — Dashboard Tren Keuangan (Publik)

**Objective:** Menyajikan visualisasi tren pemasukan/pengeluaran kas masjid dari waktu ke waktu, sebagai kelanjutan digital dari transparansi mading fisik yang sudah berjalan.
**User:** Publik (jemaah), Pengurus DKM
**Input:** Toggle granularitas ("Mingguan" / "Bulanan")
**Process:**
- Sistem mengagregasi seluruh `Transaction` dengan `isVerified = true`, dikelompokkan per minggu atau per bulan sesuai toggle yang dipilih
- Grafik dirender pakai Recharts (atau shadcn/ui Charts yang berbasis Recharts)
- Menampilkan total pemasukan vs pengeluaran per periode, plus saldo akhir kas (dari `Report.finalBalance`) sebagai referensi
**Output:** Grafik batang/garis interaktif, dapat diakses siapa pun tanpa login
**Business Rules:**
- Hanya menghitung transaksi `isVerified = true` — tanpa pengecualian
- Tidak ada gating sesi/login untuk mengakses halaman ini
**Acceptance Criteria:**
- [ ] Dashboard dapat diakses publik tanpa login
- [ ] Toggle "Mingguan"/"Bulanan" mengubah granularitas grafik secara langsung
- [ ] Grafik menampilkan minimal beberapa periode terakhir secara default (rentang pasti ditentukan di 10-MVP-Scope.md)
- [ ] Transaksi yang belum diverifikasi tidak pernah memengaruhi angka yang ditampilkan

### F-015 — Tracking & Profil Donatur (Publik)

**Objective:** Menampilkan daftar donatur beserta riwayat dan total kontribusi mereka dari waktu ke waktu, konsisten dengan budaya keterbukaan nama donatur di mading fisik.
**User:** Publik (jemaah), Pengurus DKM
**Process:**
- Halaman "Daftar Donatur" menampilkan setiap `Donor` beserta total kontribusi terverifikasi (dihitung on-the-fly) dan jumlah kali menyumbang
- Klik satu donatur → menampilkan riwayat transaksi (tanggal, nominal, laporan terkait)
- Donasi yang tertulis anonim ("Hamba Allah"/"Anonim"/"Tanpa Nama") ditampilkan terpisah sebagai **agregat "Infaq Anonim"**, tanpa profil individual
**Output:** Daftar donatur + halaman detail per donatur + satu kartu agregat "Infaq Anonim"
**Business Rules:**
- Hanya transaksi `isVerified = true` yang dihitung ke `totalContribution` maupun riwayat
- Donasi anonim tidak pernah muncul sebagai entitas `Donor` individual (lihat aturan di 13-Data-Model.md)
**Acceptance Criteria:**
- [ ] Halaman Daftar Donatur dapat diakses publik tanpa login
- [ ] Tiap donatur menampilkan total kontribusi terverifikasi & jumlah transaksi
- [ ] Detail donatur menampilkan riwayat transaksi individual dengan tautan ke laporan asalnya
- [ ] Kartu "Infaq Anonim" menampilkan total agregat tanpa memecah per nama
- [ ] Tidak ada satu pun transaksi `isVerified = false` yang bocor ke halaman ini (baik di daftar maupun endpoint API-nya)

### F-016 — Assign/Edit Nama Donatur saat Review Transaksi

**Objective:** Memberi bendahara kendali untuk mengonfirmasi atau mengoreksi nama donatur sebelum transaksi difinalisasi, memicu proses pencocokan (fuzzy matching) ke entity `Donor`.
**User:** Bendahara DKM
**Process:**
- Pada panel review transaksi (`TransactionReviewPanel`), transaksi bertipe `pemasukan` menampilkan field nama donatur yang bisa diedit — pre-filled dari `donorNameRaw` hasil ekstraksi jika ada
- Field ini disembunyikan/tidak relevan untuk transaksi bertipe `pengeluaran`
- Saat bendahara menekan "Konfirmasi", sistem menjalankan proses fuzzy matching (normalisasi + hapus prefix gelar) terhadap `Donor.normalizedName` yang sudah ada — cocok → ditautkan; tidak cocok → `Donor` baru dibuat; kosong/pola anonim → `donorId` tetap `null`
**Business Rules:**
- Fuzzy matching hanya dijalankan sekali, pada saat konfirmasi (bukan tiap kali baris diedit), untuk menghindari donatur baru dibuat berulang-ulang saat bendahara masih mengetik
**Acceptance Criteria:**
- [ ] Field nama donatur muncul & dapat diedit hanya untuk transaksi tipe `pemasukan`
- [ ] Nilai pre-filled dari `donorNameRaw` bisa diubah/dikosongkan sebelum konfirmasi
- [ ] Setelah konfirmasi, transaksi tertaut ke `Donor` yang benar (baik yang sudah ada maupun baru dibuat) sesuai aturan matching
- [ ] Menuliskan variasi nama seorang donatur yang sudah pernah tercatat (mis. "Bpk Kosasih" setelah sebelumnya "Bapak Kosasih") tidak menciptakan `Donor` duplikat
