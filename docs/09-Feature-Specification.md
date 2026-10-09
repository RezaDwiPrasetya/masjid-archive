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
| F-014 | Dashboard Tren Keuangan (Publik) | Must | ✅ Done (V5) |
| F-015 | Tracking & Profil Donatur (Publik) | Must | ✅ Done (V5) |
| F-016 | Assign Nama Donatur saat Review Transaksi | Should | ✅ Done (V5) |
| F-017 | Penyempurnaan Alur Verifikasi (Edit Donatur & Batalkan Verifikasi) | Should | ✅ Done (V5) |
| F-018 | Rincian Transparansi Infaq Anonim (Publik) | Must | ✅ Done (V6) |
| F-019 | Ekstraksi Dokumen Kas PDF (Vision-LLM) | Should | ✅ Done (V6) |
| F-020 | Impor Langsung Dokumen Kas Excel (.xlsx) | Should | ✅ Done (V6) |
| F-021 | Ekspor & Cetak Rekapitulasi Kas (PDF & Excel) | Should | ✅ Done (V6) |
| F-022 | Mobile Responsiveness & Touch Ergonomics | Should | ✅ Done (V6) |
| F-023 | Rekap & Transparansi Pengeluaran Per Kategori (Publik) | Must | ✅ Done (V7) |
| F-024 | Filter Periode Waktu & Analisis Keuangan Berkala | Must | ✅ Done (V8) |
| F-025 | Filter Periode Fiskal & Ekspor Terpadu Tanpa Modal | Must | ✅ Done (V9) |
| F-026 | Unified AppShell & Sinkronisasi Ikon Brand | Should | ✅ Done (V9) |
| F-027 | Cetak & Ekspor Rekapitulasi Kas Tahunan Penuh & Perapihan Toolbar | Must | Planned (V10) |

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

**Objective:** Membantu pengguna menemukan laporan tertentu dengan cepat serta memantau arsip yang paling baru diperbarui.
**User:** Pengurus DKM & Jamaah Publik
**Input:** Kata kunci pencarian, filter Tahun, filter Bulan, opsi Pengurutan (`terbaru_aktivitas`, `tanggal_desc`, `tanggal_asc`)
**Acceptance Criteria:**
- [x] Hasil pencarian ter-update sesuai filter dan kata kunci yang dipilih
- [x] Default pengurutan menampilkan arsip yang paling baru diubah atau ditambahkan (`terbaru_aktivitas`) berdasarkan timestamp terakhir dari laporan, lampiran, maupun verifikasi transaksi
- [x] Tersedia opsi pengurutan alternatif: Tanggal Laporan Terbaru dan Tanggal Laporan Terlama
- [x] Setiap kartu arsip menampilkan tanggal laporan, pengunggah, dan waktu aktivitas pembaruan terakhir
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

### F-010 — Proteksi Rute & Aksi (Role-Based Access Control 3-Tier)

**Objective:** Mencegah publik dan akun tamu umum memutasi arsip laporan, serta menerapkan pemisahan wewenang yang tegas antara Jamaah, Bendahara (staf operasional), dan Administrator (Ketua DKM).
**User:** Jamaah (`role: null`), Bendahara (`role: "BENDAHARA"`), Administrator (`role: "ADMIN"`)
**Process:**
- Proxy Next.js (`proxy.ts`) mencegat permintaan ke rute terproteksi (`/unggah` dan `/pengguna`) berdasarkan token JWT yang disinkronisasi ke basis data pengguna.
- Helper otorisasi `lib/auth-guard.ts` (`isStaff` dan `isAdmin`) memvalidasi hak akses di setiap Server Component dan API Route Handler.
- Komponen antarmuka (UI) mengecek peran pengguna sebelum merender tombol aksi mutasi.
**Tingkatan Peran:**
1. **Jamaah (`role: null` / Publik)**: Mode baca murni. Transaksi draf disembunyikan. Seluruh mutasi ditolak (`403 Forbidden`). Akses `/unggah` dialihkan ke `/dashboard?error=forbidden`.
2. **Bendahara (`role: "BENDAHARA"`)**: Wewenang operasional pembukuan: unggah laporan, picu ekstraksi OCR AI, konfirmasi/batal verifikasi transaksi, edit donatur & kategori pengeluaran, hapus lampiran berkas unverified. Dilarang menghapus laporan utama atau mengelola akun pengguna (`403 Forbidden`).
3. **Administrator (`role: "ADMIN"`)**: Wewenang penuh staf + manajemen pengguna dan penetapan peran di `/pengguna` + hak eksklusif menghapus laporan kas utama (`DELETE /api/reports/:id`).
**Acceptance Criteria:**
- [x] Publik (Jamaah / role `null`) tetap leluasa mengakses Beranda (Arsip), Pencarian, Detail Laporan terverifikasi, Grafik Tren, dan Transparansi Donatur/Pengeluaran (mode baca).
- [x] Pengguna tanpa sesi atau ber-role `null` diblokir dan dialihkan ke `/dashboard?error=forbidden` jika mencoba mengakses rute `/unggah`.
- [x] Rute `/pengguna` dilindungi ketat dan hanya dapat dibuka oleh akun dengan peran `ADMIN`.
- [x] Seluruh endpoint API mutasi data (POST / PATCH / DELETE) menolak akses tanpa sesi dengan `401 Unauthorized` dan menolak akun login ber-role `null` dengan `403 Forbidden`.
- [x] Aksi hapus dokumen laporan kas (`DELETE /api/reports/:id`) dan tombol "Hapus Laporan" di UI dibatasi secara eksklusif hanya untuk Administrator (`ADMIN`).
- [x] Transaksi draf (`isVerified = false`) disembunyikan secara otomatis dari publik dan akun tamu, hanya dapat dilihat oleh Staf (`ADMIN` atau `BENDAHARA`).
- [x] Data mentah vision-LLM (`extractionRawResponse`, `extractionError`) dan email pengunggah tidak bocor ke publik berkat query `select` eksplisit.

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
- Sistem mengagregasi seluruh `Transaction` dengan `isVerified = true`, dikelompokkan per minggu (berbasis `Report.reportDate` hari Jumat) atau per bulan sesuai toggle yang dipilih
- Grafik dirender pakai Recharts (shadcn/ui Charts) dengan label nominal Rupiah jelas di sumbu Y dan di atas batang (> 0)
- Menampilkan total pemasukan vs pengeluaran per periode, plus saldo akhir kas (dari `Report.finalBalance`) sebagai KPI Card referensi
- Rentang waktu bersifat dinamis: dimulai dari laporan kas pertama yang ada di database hingga maksimal 12 periode (menghindari grafik kosong di awal)
- Tooltip menampilkan rentang tanggal mingguan penuh (mis. "Periode: 12-18 Sep 2026") atau nama bulan penuh ("Periode: September 2026")
- Terdapat banner informatif non-intrusive di bagian atas dashboard saat data masih tahap pengumpulan awal
**Output:** Grafik batang interaktif + KPI cards, dapat diakses siapa pun tanpa login
**Business Rules:**
- Hanya menghitung transaksi `isVerified = true` — tanpa pengecualian
- Tidak ada gating sesi/login untuk mengakses halaman ini
**Acceptance Criteria:**
- [x] Dashboard dapat diakses publik tanpa login
- [x] Toggle "Mingguan"/"Bulanan" mengubah granularitas grafik secara langsung
- [x] Grafik menampilkan rentang dinamis dari data pertama hingga maksimal 12 periode
- [x] Transaksi yang belum diverifikasi tidak pernah memengaruhi angka yang ditampilkan
- [x] Tooltip menampilkan rentang tanggal 7 hari (mingguan) atau nama bulan penuh (bulanan)

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
- [x] Halaman Daftar Donatur dapat diakses publik tanpa login
- [x] Tiap donatur menampilkan total kontribusi terverifikasi & jumlah transaksi
- [x] Detail donatur menampilkan riwayat transaksi individual dengan tautan ke laporan asalnya
- [x] Kartu "Infaq Anonim" menampilkan total agregat tanpa memecah per nama
- [x] Tidak ada satu pun transaksi `isVerified = false` yang bocor ke halaman ini (baik di daftar maupun endpoint API-nya)

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
- [x] Field nama donatur muncul & dapat diedit hanya untuk transaksi tipe `pemasukan`
- [x] Nilai pre-filled dari `donorNameRaw` bisa diubah/dikosongkan sebelum konfirmasi
- [x] Setelah konfirmasi, transaksi tertaut ke `Donor` yang benar (baik yang sudah ada maupun baru dibuat) sesuai aturan matching
- [x] Menuliskan variasi nama seorang donatur yang sudah pernah tercatat (mis. "Bpk Kosasih" setelah sebelumnya "Bapak Kosasih") tidak menciptakan `Donor` duplikat

### F-017 — Penyempurnaan Alur Verifikasi (Edit Donatur & Batalkan Verifikasi)

**Objective:** Memberikan fleksibilitas pada bendahara untuk mengoreksi nama donatur atau membatalkan status verifikasi transaksi jika terjadi kekeliruan tanpa merusak integritas kas.
**User:** Bendahara DKM
**Process:**
- **Koreksi Donatur Terverifikasi**: Pada transaksi pemasukan yang sudah berstatus `isVerified = true`, bendahara dapat mengklik tombol edit nama donatur untuk mengoreksi typo atau mengubah nama donatur via endpoint `PATCH /api/transactions/:id/donor`. Sistem memperbarui tautan `Donor` dan menghitung ulang total donatur terkait tanpa mengubah nominal kas.
- **Batalkan Verifikasi**: Pada transaksi yang sudah terverifikasi, bendahara dapat menekan tombol "Batalkan Verifikasi" via `POST /api/transactions/:id/unverify`. Status dikembalikan ke `isVerified = false`, transaksi dikeluarkan dari dashboard publik, dan saldo kas/kontribusi donatur diperbarui secara otomatis.
**Acceptance Criteria:**
- [x] Bendahara dapat mengoreksi nama donatur pada transaksi yang sudah terverifikasi
- [x] Pembatalan verifikasi berhasil mengembalikan transaksi ke antrean verifikasi dan mengeluarkan nominal dari dashboard publik

---

## Feature Details — V7 (Expense Transparency)

### F-023 — Rekap & Transparansi Pengeluaran Per Kategori (Publik)

**Objective:** Melengkapi simetri transparansi keuangan masjid dengan menyediakan halaman publik khusus yang merangkum **pengeluaran kas** per kategori dari waktu ke waktu — menjawab pertanyaan jemaah: *"Uang kas masjid digunakan untuk apa saja?"* — setara dengan halaman Donatur yang menjawab *"Siapa yang menyumbang?"*.
**User:** Publik (jemaah), Pengurus DKM, Bendahara DKM
**Process:**
- **Input kategori (Bendahara):** Pada panel review transaksi (`TransactionReviewPanel`), transaksi bertipe `pengeluaran` menampilkan dropdown **Kategori** yang bisa dipilih sebelum atau sesudah dikonfirmasi. Kategori bersifat opsional (boleh kosong / "Tidak Dikategorikan").
  - Set kategori yang tersedia (tetap, tidak bisa ditambah pengguna):
    - `operasional` — Tagihan listrik, air, internet
    - `honor` — Honor khotib, imam, marbot, ustadz
    - `sosial` — Santunan fakir miskin, anak yatim, bantuan warga
    - `pembangunan` — Renovasi, pembelian material, peralatan masjid
    - `konsumsi` — Konsumsi rapat DKM, acara pengajian
    - `administrasi` — ATK, cetak dokumen, biaya admin bank
    - `lainnya` — Pengeluaran yang tidak masuk kategori di atas
- **Halaman publik `/pengeluaran`:** Menampilkan ringkasan dan rincian pengeluaran terverifikasi.
  - **Kartu KPI**: Total pengeluaran keseluruhan & jumlah transaksi pengeluaran
  - **Breakdown per Kategori**: Progress bar / treemap visual nominal per kategori (diurutkan terbesar ke terkecil)
  - **Tabel Rincian**: Daftar seluruh transaksi pengeluaran terverifikasi (tanggal, deskripsi, kategori, nominal, link ke laporan asal), dengan filter per kategori
**Business Rules:**
- MUTLAK hanya menampilkan transaksi `isVerified = true` dan `type = "pengeluaran"`.
- Field `category` pada skema bersifat **opsional (nullable)** — transaksi lama yang belum dikategorikan ditampilkan dengan label "Tidak Dikategorikan" tanpa error.
- Perubahan kategori pada transaksi yang sudah terverifikasi hanya bisa dilakukan oleh pengguna login (bendahara/admin), tidak memengaruhi status `isVerified` atau field finansial lainnya.
- Set kategori bersifat **enum tetap** di aplikasi (tidak disimpan sebagai tabel terpisah di database) — sesuai kebutuhan DKM Al-Luqman, tidak perlu manajemen kategori dinamis.
- Halaman publik bisa diakses tanpa login.
**Schema Change:**
- Tambah field `category String?` pada model `Transaction` di `schema.prisma`.
- Nilai valid: `operasional`, `honor`, `sosial`, `pembangunan`, `konsumsi`, `administrasi`, `lainnya`, `null`.
- Migration additive — tidak mengubah field yang sudah ada, semua data lama tetap valid (category = null).
**Acceptance Criteria:**
- [x] Field dropdown Kategori muncul di panel review untuk transaksi bertipe `pengeluaran` (tersembunyi untuk `pemasukan`)
- [x] Kategori dapat diubah pada transaksi pengeluaran yang sudah terverifikasi oleh pengguna login
- [x] Halaman `/pengeluaran` dapat diakses publik tanpa login
- [x] Kartu KPI total pengeluaran & jumlah transaksi tampil akurat
- [x] Breakdown per kategori diurutkan dari nominal terbesar ke terkecil
- [x] Tabel rincian dapat difilter per kategori
- [x] Transaksi tanpa kategori ditampilkan dengan label "Tidak Dikategorikan", tidak error
- [x] Tidak ada transaksi `isVerified = false` yang bocor ke halaman ini
- [x] Link ke laporan asal pada tiap baris transaksi berfungsi

---

## Feature Details — V6 (Advanced Transparency & Multimodal Pipeline)

### F-018 — Rincian Transparansi Infaq Anonim (Publik)

**Objective:** Membuka transparansi penuh bagi jemaah untuk melihat rincian riwayat transaksi yang tergolong "Infaq Anonim" (seperti kotak amal, tromol Jumat, dan hamba Allah) tanpa membuat entitas profil `Donor` individual.
**User:** Publik (jemaah), Pengurus DKM
**Process:**
- Pada kartu "Infaq Anonim" di halaman `/donatur`, pengguna dapat mengklik tombol aksi/interaksi "Lihat Rincian".
- Membuka dialog/modal responsif yang menampilkan daftar ledger terverifikasi: Tanggal Transaksi, Keterangan Asli (mis. "Kotak Amal Jumat", "Tromol Pintu Utara", "Infaq Hamba Allah"), Tautan Laporan Pekanan Asal, dan Nominal Transaksi (Rp).
- Data diambil dari endpoint publik `GET /api/donors/anonymous/transactions`.
**Business Rules:**
- MUTLAK hanya menampilkan transaksi `isVerified = true`.
- Transaksi bertipe `pemasukan` dengan `donorId = null`.
- TIDAK membuat record baru di tabel `Donor` (tetap berpegang pada aturan arsitektur data model V5).
**Acceptance Criteria:**
- [x] Kartu Infaq Anonim di `/donatur` memiliki tombol interaksi untuk membuka modal rincian.
- [x] Modal menampilkan tabel/list transaksi anonim dengan format uang rapi (tabular-nums), tanggal, dan deskripsi asli.
- [x] Data yang disajikan 100% konsisten dengan nilai agregat kartu Infaq Anonim.
- [x] Tidak ada transaksi unverified (`isVerified = false`) yang bocor ke modal rincian.

### F-019 — Ekstraksi Dokumen Kas PDF (Vision-LLM)

**Objective:** Memungkinkan bendahara mengekstrak data kas mingguan yang diunggah dalam format dokumen PDF (misalnya hasil scan printer DKM) menggunakan kapabilitas multimodal Google Gemini secara langsung.
**User:** Bendahara DKM
**Process:**
- Pada halaman detail laporan, tombol "Ekstrak Data" diizinkan aktif untuk lampiran dengan `fileType = "pdf"`.
- Sistem mengirimkan buffer dokumen PDF dengan MIME `application/pdf` ke Google Gemini via `inlineData`.
- Hasil ekstraksi transaksi dan saldo kas diproses dan disajikan di `TransactionReviewPanel` persis seperti ekstraksi foto gambar.
**Business Rules:**
- Mempertahankan fallback otomatis ke model cadangan jika model utama sibuk.
- File PDF yang diproses dibatasi maksimal 10 MB (sesuai limit upload yang sudah berlaku).
**Acceptance Criteria:**
- [x] Endpoint `/api/attachments/:id/extract` menerima dan memproses lampiran bertipe `pdf`.
- [x] Review panel transaksi menampilkan hasil ekstraksi dokumen PDF dengan status "Menunggu Verifikasi".
- [x] Tampilan dokumen PDF tersemat (`<iframe>` 65vh) muncul di halaman detail laporan.

### F-020 — Direct Parser Impor Dokumen Kas Excel (.xlsx)

**Objective:** Memungkinkan bendahara mengimpor data transaksi langsung dari file spreadsheet Excel buku kas tanpa melalui OCR, memberikan akurasi 100% tanpa risiko salah baca karakter tulisan tangan.
**User:** Bendahara DKM
**Process:**
- Sistem membaca sheet tabel kas dari file `.xlsx` / `.xls` yang diunggah.
- Memetakan kolom tanggal, uraian/deskripsi, pemasukan, dan pengeluaran ke dalam draft `Transaction` (`isVerified = false`).
- Bendahara meninjau baris yang diimpor di `TransactionReviewPanel` sebelum mengonfirmasi verifikasi.
**Acceptance Criteria:**
- [x] Sistem mem-parsing file `.xlsx` menjadi baris draft transaksi.
- [x] Transaksi hasil impor muncul di review panel untuk diverifikasi oleh bendahara.
- [x] Panel detail laporan menyajikan UI impor tabular spreadsheet dengan tombol aksi terpadu.

### F-021 — Ekspor & Unduh Rekapitulasi Kas Mingguan & Bulanan (Cetak PDF & Excel)

**Objective:** Memfasilitasi transparansi fisik DKM Masjid Al-Luqman untuk mencetak laporan pembukuan kas mingguan dan bulanan ke mading/papan pengumuman masjid serta mengunduh arsip dokumen PDF dan spreadsheet Excel secara instan.
**User:** Publik (jemaah), Pengurus DKM
**Process:**
- **Ekspor Mingguan**: Pada halaman detail laporan (`/laporan/:id`), pengguna dapat memilih:
  1. "Unduh PDF" via `GET /api/reports/:id/export/pdf` (unduhan langsung berkas PDF resmi murni vektor, memicu notifikasi unduhan browser & tercatat di history unduhan).
  2. "Unduh Excel" via `GET /api/reports/:id/export/excel`.
  3. "Cetak / A4" untuk membuka tampilan siap cetak A4 formal ke printer fisik via `window.print()`.
- **Ekspor Bulanan**: Pada dashboard publik (`/dashboard`), pengguna dapat menekan tombol "Ekspor Rekap Bulanan" untuk memilih periode bulan/tahun lalu:
  1. Mengunduh PDF resmi via `GET /api/reports/export/monthly/pdf?year=YYYY&month=M`.
  2. Mengunduh spreadsheet Excel via `GET /api/reports/export/monthly/excel?year=YYYY&month=M`.
  3. Membuka pratinjau cetak A4 mading via `/laporan/cetak/bulanan?year=YYYY&month=M`.
**Business Rules:**
- Seluruh data transaksi yang diekspor/dicetak MUTLAK hanya berstatus `isVerified = true`.
- Tampilan cetak menggunakan aturan `@media print` dengan ukuran baku `@page { size: A4 portrait; margin: 8mm 10mm 10mm 10mm; }`.
- Preservasi warna cetak diaktifkan via `print-color-adjust: exact !important;` agar angka pemasukan (hijau) dan pengeluaran (merah) tidak dipudarkan menjadi hitam-putih.
- Elemen baris tabel dan blok tanda tangan dilindungi dengan `break-inside-avoid` agar tidak terpotong secara janggal di tengah halaman.
- Berkas PDF unduhan langsung dikirim dengan header HTTP `Content-Disposition: attachment` agar memicu notifikasi unduhan browser dan masuk ke folder unduhan perangkat pengguna secara otomatis.
**Acceptance Criteria:**
- [x] Dokumen kas mingguan dapat diunduh langsung dalam format Excel (.xlsx) dan PDF (.pdf).
- [x] Halaman cetak mingguan menyediakan format A4 resmi dengan Kop DKM, tabel mutasi kas, dan kolom tanda tangan pengesahan pas 1 lembar (15–25 transaksi).
- [x] Dashboard memiliki tombol dialog untuk mengekspor rekapitulasi kas bulanan ke PDF, Excel (.xlsx), dan format cetak fisik.
- [x] Data transaksi unverified (`isVerified = false`) tidak pernah muncul di berkas ekspor maupun cetakan.
- [x] Warna merah (pengeluaran) dan hijau (pemasukan) tetap tampil konsisten saat dicetak atau diunduh sebagai PDF.
- [x] Unduhan PDF langsung memunculkan notifikasi download di peramban desktop maupun ponsel pintar.

### F-022 — Mobile Responsiveness & Touch Optimization System

**Objective:** Memastikan sistem Masjid Archive dapat diakses dengan nyaman, proporsional, dan tanpa tumpang tindih elemen visual pada perangkat smartphone (mobile portrait 360px - 430px) bagi jemaah umum maupun pengurus DKM.
**User:** Publik (jemaah), Pengurus DKM
**Process:**
- **1. Dashboard Chart Mobile Refinement**:
  - Pada mobile (`< 640px`), label nominal uang di atas bar mingguan disembunyikan untuk menghilangkan tabrakan teks `Rp xxx rb` secara horizontal. Rincian nilai disajikan via touch tooltip yang interaktif dan responsif.
  - Lebar Y-axis dirampingkan ke ~50px agar chart batang memiliki ruang horizontal maksimal.
  - Sumbu X tanggal mingguan diatur interval dan margin-nya agar tidak berdesakan.
- **2. Mobile Bottom Navigation**:
  - Standarisasi tap target minimal 44px–48px yang thumb-friendly.
  - Padding horizontal dinamis dan penyesuaian font label pada perangkat HP kecil (≤ 380px) agar menu (hingga 6 item admin) tetap proporsional dan tidak terpotong.
- **3. Halaman Donatur & Dialog**:
  - Proporsi kartu agregat KPI (Donatur Terdata & Infaq Anonim) diatur seimbang dengan gap vertikal rapi di mobile.
  - Modal ledger rincian infaq anonim dan dialog ekspor bulanan menyesuaikan lebar viewport HP (`w-[95vw] sm:max-w-lg`) tanpa horizontal overflow.
- **4. Penanganan Tabel Kas & Review**:
  - Tabel daftar pengguna dan panel review transaksi dilengkapi pembungkus scroll responsif yang intuitif di perangkat mobile.
### F-023 — Rekap & Transparansi Pengeluaran Per Kategori

**Objective:** Menyediakan transparansi alokasi belanja kas masjid dengan mengelompokkan transaksi pengeluaran terverifikasi ke dalam kategori fungsional baku serta menyajikannya di halaman publik `/pengeluaran`.
**User:** Publik (jemaah), Bendahara DKM
**Process:**
- Field `category String?` pada model `Transaction` menyimpan salah satu dari 7 kategori baku: `operasional`, `honor`, `sosial`, `pembangunan`, `konsumsi`, `administrasi`, `lainnya`, atau `null` ("Tidak Dikategorikan").
- Bendahara memilih kategori pengeluaran saat review draf atau mengeditnya in-place via ikon pensil ✏️ pada transaksi yang sudah terverifikasi tanpa merusak saldo kas.
- Halaman publik `/pengeluaran` menampilkan 3 kartu KPI, visual breakdown bar multi-warna, filter chips kategori, pencarian deskripsi, dan tabel rincian transaksi terverifikasi.
**Acceptance Criteria:**
- [x] Migrasi schema `Transaction.category` berhasil dan aman untuk data historis.
- [x] Endpoint publik `GET /api/expenses` dan `GET /api/expenses/transactions` menyajikan agregasi dan rincian transaksi pengeluaran terverifikasi.
- [x] Endpoint mutasi `PATCH /api/transactions/:id/category` terproteksi sesi pengurus.
- [x] Halaman `/pengeluaran` responsif full-width dan menu navigasi terpasang di desktop & mobile.

---

### F-024 — Filter Periode Waktu & Analisis Keuangan Berkala (Donatur & Pengeluaran)

**Objective:** Menyediakan kemampuan pemfilteran periode waktu (Tahun & Bulan, disertai preset cepat "Semua Waktu", "Tahun Ini", "Bulan Ini") pada halaman publik Donatur (`/donatur`) dan Pengeluaran (`/pengeluaran`) agar informasi keuangan tetap kontekstual, terfokus, dan relevan seiring bertambahnya arsip tahunan kas DKM Masjid Al-Luqman.
**User:** Publik (jemaah), Pengurus DKM
**Process:**
- **Komponen Bar Filter Periode (`PeriodFilterBar`)**:
  - Ditempatkan di header halaman `/pengeluaran` dan `/donatur`.
  - Tombol preset cepat: `Semua Waktu`, `Tahun Ini`, `Bulan Ini`.
  - Selector manual: Dropdown `Tahun` (mengambil tahun yang memiliki transaksi aktif di arsip) dan Dropdown `Bulan` (`Semua Bulan`, `Januari` s/d `Desember`).
- **Reaktivitas Halaman Pengeluaran (`/pengeluaran`)**:
  - Saat periode dipilih, parameter query `year` dan `month` diteruskan ke `GET /api/expenses` dan `GET /api/expenses/transactions`.
  - Tiga kartu KPI (Total Pengeluaran, Jumlah Transaksi, Kategori Terbesar) menghitung ulang sesuai periode tersebut.
  - Bar proporsi persentase alokasi dana multi-warna menghitung komposisi pengeluaran pada periode terpilih.
  - Tabel rincian hanya menampilkan transaksi pengeluaran pada rentang waktu yang dipilih.
- **Reaktivitas Halaman Donatur (`/donatur`)**:
  - Saat periode dipilih, parameter query `year` dan `month` diteruskan ke `GET /api/donors` dan `GET /api/donors/anonymous/transactions`.
  - Kartu KPI *Donatur Terdata* menghitung jumlah donatur dan total infaq pada periode tersebut.
  - Kartu KPI *Infaq Anonim* menghitung akumulasi tromol/kotak amal pada periode tersebut.
  - Daftar peringkat donatur mengurutkan donatur berdasarkan kontribusi pada periode tersebut.
- **Isolasi Mutlak**:
  - Seluruh query hanya memperhitungkan transaksi dengan status `isVerified = true`.
**Acceptance Criteria:**
- [x] Pengguna publik dapat memilih Tahun & Bulan di halaman `/pengeluaran`, dan angka KPI + grafik proporsi + tabel mencerminkan periode tersebut.
- [x] Pengguna publik dapat memilih Tahun & Bulan di halaman `/donatur`, dan angka KPI + ranking donatur mencerminkan periode tersebut.
- [x] Tombol cepat "Semua Waktu", "Tahun Ini", dan "Bulan Ini" berfungsi mulus.
- [x] Tersedia fallback yang anggun jika pada periode yang dipilih belum ada transaksi (menampilkan status kosong ramah pengguna tanpa crash).
- [x] Seluruh endpoint publik aman dan hanya menyajikan data `isVerified = true`.
- [x] `tsc --noEmit` lolos 0 error dan `npm run lint` lolos 0 error.

---

### F-025 — Filter Periode Fiskal & Ekspor Terpadu Tanpa Modal (Dashboard)

**Objective:** Mengintegrasikan pemilihan periode bulan & tahun langsung di toolbar ringkasan dashboard, menyediakan visualisasi tren kas mingguan/tahunan yang presisi dan proporsional di seluruh ukuran layar, serta memfasilitasi ekspor dokumen (Cetak A4 Mading, PDF resmi, Excel) langsung tanpa hambatan dialog modal (Zero-Modal Export).
**User:** Publik (jemaah), Pengurus DKM
**Process:**
- **Toolbar Terpadu Dashboard**:
  - Selector Bulan (`Semua Bulan`, `Januari` s/d `Desember`) dan Selector `Tahun` ditempatkan sejajar dengan tombol toggle mode grafik (Mingguan vs Tahunan).
  - Selector periode secara instan menyaring metrik ringkasan kartu KPI (Total Pemasukan, Total Pengeluaran, Arus Kas Bersih) dan grafik tren kas.
- **Mode Mingguan Presisi**:
  - Memplot 4 hingga 5 pekan (hari Jumat) yang ada pada bulan dan tahun terpilih, bukan window mundur dinamis yang bergeser.
- **Mode Tahunan Responsif (Semesteran Mobile)**:
  - Layar Desktop (≥ 768px): Menampilkan 12 batang bulan penuh (Jan–Des).
  - Layar Mobile (< 768px): Menyediakan toggle Semester 1 (`Jan - Jun`) dan Semester 2 (`Jul - Des`) agar batang grafik tetap lega, proporsional, dan nyaman disentuh jari.
- **Zero-Modal Export**:
  - Tombol **Cetak (Mading A4)**, **Unduh PDF (.pdf)**, dan **Unduh Excel (.xlsx)** terpasang langsung di samping selector periode.
  - Mengklik tombol ekspor langsung memicu pengunduhan/pratinjau dokumen kas untuk periode aktif saat itu tanpa perantara dialog popup.
**Acceptance Criteria:**
- [x] Selector Bulan dan Tahun terintegrasi langsung di toolbar dashboard utama.
- [x] Mode mingguan memplot Jumat-Jumat spesifik dari bulan & tahun yang dipilih.
- [x] Mode tahunan menampilkan 12 bulan di desktop dan toggle Semester 1 & 2 di layar ponsel.
- [x] Tombol ekspor (Cetak A4, PDF, Excel) dapat dijalankan langsung secara WYSIWYG tanpa modal popup.
- [x] Kartu KPI (Pemasukan, Pengeluaran, Arus Kas Bersih) sinkron dengan filter periode aktif.

---

### F-026 — Unified AppShell & Sinkronisasi Ikon Brand Resmi

**Objective:** Menyelaraskan tata letak antarmuka aplikasi secara universal menggunakan komponen shell terpadu (`AppShell`) dengan navigasi sidebar permanen di desktop, mobile bottom navigation, serta konsistensi identitas visual (logo masjid selaras dengan vektor favicon resmi).
**User:** Seluruh pengguna (Publik, Bendahara, Administrator)
**Process:**
- **Komponen Layout `AppShell` (`components/app-shell.tsx`)**:
  - Membungkus seluruh halaman aplikasi (`/`, `/dashboard`, `/pengeluaran`, `/donatur`, `/cari`, `/unggah`, `/pengguna`).
  - Desktop: Sidebar permanen selebar 260px (`surface-container`) dengan brand header, daftar tautan menu berikon Lucide, dan kartu ringkasan transparansi.
  - Mobile: Bilah navigasi bawah (*bottom bar*) ergonomis dengan target sentuh ≥ 44px dan label teks proporsional.
- **Sinkronisasi Ikon Brand Resmi (`MasjidEmblem`)**:
  - Mengganti motif generik lama dengan logo resmi kubah masjid hijau dan aksen emas yang selaras 1:1 dengan favicon peramban (`/favicon.svg`).
  - Penyelarasan format judul tab peramban dengan standar Shopee-style (`Masjid Archive | [Nama Halaman]`).
**Acceptance Criteria:**
- [x] Seluruh halaman aplikasi terintegrasi rapi dengan komponen `AppShell`.
- [x] Ikon logo di sidebar desktop dan mobile header identik dengan aset favicon resmi masjid.
- [x] Format judul tab peramban seragam dan profesional di seluruh rute.
- [x] Desain responsif berjalan mulus di resolusi desktop, tablet, dan smartphone.

---

### F-027 — Cetak & Ekspor Rekapitulasi Kas Tahunan Penuh & Perapihan Toolbar

**Objective:** Menyediakan kemampuan mencetak dan mengekspor rekapitulasi pembukuan kas 1 tahun penuh (Januari s/d Desember) secara akurat saat mode tahunan aktif, serta merapikan toolbar ringkasan kas dashboard dengan mengeliminasi tombol PDF yang redundan dan mengganti tombol cetak menjadi "Cetak Laporan".
**User:** Publik (jemaah), Pengurus DKM
**Process:**
- **Perapihan Toolbar Dashboard (`components/dashboard-client.tsx`)**:
  - Menghapus tombol direct download "PDF" dari toolbar.
  - Mengubah tombol "Cetak Mading" menjadi **"Cetak Laporan"** dengan ikon printer.
  - Menghubungkan tombol aksi secara dinamis dengan mode aktif:
    - Mode Mingguan: Tombol "Cetak Laporan" membuka `/laporan/cetak/bulanan?year=YYYY&month=MM` dan tombol "Excel" memicu `/api/reports/export/monthly/excel?year=YYYY&month=MM`.
    - Mode Tahunan: Tombol "Cetak Laporan" membuka `/laporan/cetak/tahunan?year=YYYY` dan tombol "Excel" memicu `/api/reports/export/yearly/excel?year=YYYY`.
- **Halaman Cetak Laporan Tahunan (`/laporan/cetak/tahunan`)**:
  - Halaman siap cetak formal A4 berkop DKM Masjid Al-Luqman.
  - Kartu Ringkasan Keuangan Tahunan: Saldo Awal Tahun, Total Pemasukan Tahunan, Total Pengeluaran Tahunan, dan Saldo Akhir Kas Tahun Berjalan.
  - Tabel Rekapitulasi 12 Bulan (Januari s/d Desember): Jumlah laporan, total pemasukan, total pengeluaran, surplus/defisit bulanan, dan saldo kas per akhir bulan.
  - Tabel Daftar Transaksi Terverifikasi Sepanjang Tahun.
  - Kolom pengesahan tanda tangan Ketua DKM dan Bendahara.
  - Header aksi cetak (`PrintActionBar`) dengan tombol "Kembali", "Unduh PDF", dan "Cetak (Printer)".
- **Endpoint Ekspor PDF & Excel Tahunan**:
  - `GET /api/reports/export/yearly/pdf?year=YYYY`: Berkas vektor PDF resmi tahunan (via `pdf-lib`).
  - `GET /api/reports/export/yearly/excel?year=YYYY`: Berkas spreadsheet Excel rekapitulasi kas tahunan (via `xlsx`).
**Acceptance Criteria:**
- [ ] Tombol PDF redundan dihilangkan dari toolbar dashboard.
- [ ] Tombol cetak berganti nama menjadi "Cetak Laporan" dan mengarah ke rute tahunan saat mode tahunan aktif.
- [ ] Tombol Excel mengekspor data tahunan saat mode tahunan aktif.
- [ ] Halaman `/laporan/cetak/tahunan` memuat data rekap 12 bulan dan seluruh transaksi tahun tersebut (bukan hanya 1 bulan).
- [ ] Endpoint ekspor PDF dan Excel tahunan berfungsi dengan baik menghasilkan unduhan berkas.



