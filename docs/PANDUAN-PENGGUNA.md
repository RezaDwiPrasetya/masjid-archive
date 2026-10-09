# Panduan Pengguna — Masjid Archive
### Sistem Arsip & Manajemen Keuangan DKM Masjid Al-Luqman

> **Versi Sistem**: V9 (0.9.0 — Feature-Complete)  
> **Terakhir diperbarui**: 9 Oktober 2026  
> **Disusun oleh**: Reza Dwi Prasetya — PKL PT Gothru Media Indonesia

---

## Daftar Isi

1. [Tentang Sistem Ini](#1-tentang-sistem-ini)
2. [Hak Akses Pengguna (Role)](#2-hak-akses-pengguna-role)
3. [Cara Login](#3-cara-login)
4. [Navigasi Utama](#4-navigasi-utama)
5. [Arsip Laporan](#5-arsip-laporan--halaman-utama)
6. [Dashboard Keuangan](#6-dashboard-keuangan)
7. [Halaman Pengeluaran](#7-halaman-pengeluaran--rekapitulasi-per-kategori)
8. [Halaman Donatur](#8-halaman-donatur)
9. [Pencarian Arsip](#9-pencarian-arsip)
10. [Mengunggah Laporan Baru](#10-mengunggah-laporan-baru)
11. [Detail Laporan & Ekstraksi AI](#11-detail-laporan--ekstraksi-ai)
12. [Verifikasi & Rekonsiliasi Transaksi](#12-verifikasi--rekonsiliasi-transaksi)
13. [Cetak & Ekspor Rekapitulasi Kas](#13-cetak--ekspor-rekapitulasi-kas)
14. [Manajemen Pengguna](#14-manajemen-pengguna)
15. [Pertanyaan Umum (FAQ)](#15-pertanyaan-umum-faq)

---

## 1. Tentang Sistem Ini

**Masjid Archive** adalah sistem informasi berbasis web yang dirancang khusus untuk **DKM Masjid Al-Luqman**, Kelurahan Soklat, Kecamatan Subang.

Sistem ini menggantikan ketergantungan pada buku kas fisik yang rentan hilang atau rusak — **tanpa mengubah cara kerja bendahara sehari-hari**. Bendahara tetap merekap manual di buku kas, kemudian memotret atau memindai dokumen tersebut lalu mengunggah salinannya ke sistem.

### Apa yang bisa dilakukan sistem ini?

| Fitur | Siapa yang Bisa |
|---|---|
| Melihat arsip laporan keuangan mingguan | Semua orang (tanpa login) |
| Melihat dashboard tren kas & grafik | Semua orang (tanpa login) |
| Melihat rekapitulasi & transparansi pengeluaran per kategori | Semua orang (tanpa login) |
| Melihat daftar donatur & infaq anonim | Semua orang (tanpa login) |
| Mencari arsip laporan berdasarkan periode | Semua orang (tanpa login) |
| Mengunggah laporan baru | Bendahara & Administrator |
| Mengekstrak data dari foto/PDF/Excel via AI | Bendahara & Administrator |
| Memverifikasi & merekonsiliasi transaksi | Bendahara & Administrator |
| Mengklasifikasi & mengedit kategori pengeluaran | Bendahara & Administrator |
| Mencetak & mengunduh rekap kas (PDF & Excel) | Semua orang (tanpa login) |
| Menghapus laporan kas utama | Administrator saja |
| Mengelola akun dan hak akses pengguna | Administrator saja |

---

## 2. Hak Akses Pengguna (Role)

Sistem menggunakan tiga tingkatan akses:

### 👤 Jamaah (Publik / Read-only)
- Tidak perlu login.
- Dapat melihat seluruh arsip laporan, dashboard keuangan, rekapitulasi pengeluaran per kategori, dan data donatur yang sudah terverifikasi.
- **Tidak dapat** mengubah data apa pun.

### 💼 Bendahara
- Perlu login dengan akun Google yang memiliki role `BENDAHARA`.
- Dapat mengunggah laporan (`/unggah`), mengekstrak data via AI, memverifikasi transaksi kas, mengedit nama donatur, mengelola kategori pengeluaran, dan menghapus berkas lampiran yang belum terverifikasi.
- **Tidak dapat** menghapus laporan kas utama (`DELETE /api/reports/:id`) dan tidak dapat mengelola akun pengguna lain.

### 🛡️ Administrator
- Perlu login dengan akun Google yang memiliki role `ADMIN`.
- Memiliki seluruh akses operasional Bendahara **ditambah** hak eksklusif menghapus dokumen laporan kas (`DELETE /api/reports/:id`) serta kewenangan penuh mengelola akun pengguna di menu `/pengguna` (menetapkan role dan menghapus akun yang tidak memiliki riwayat audit finansial).
- Menu **Pengguna** di navigasi dan tombol **Hapus Laporan** di halaman Detail Laporan hanya muncul khusus untuk Administrator.

> **Catatan**: Role ditetapkan secara manual oleh Administrator melalui menu Pengguna. Seseorang yang login pertama kali otomatis masuk sebagai Jamaah (read-only) sampai diberi role oleh Admin.

---

## 3. Cara Login

Login diperlukan untuk mengakses fitur operasional (unggah, ekstraksi, verifikasi, kelola kategori, cetak).

### Langkah Login

1. Buka aplikasi di browser.
2. Klik tombol **"Masuk"** yang terletak di bagian bawah sidebar (desktop) atau pojok kanan atas (mobile).
3. Pilih akun Google Anda dari daftar yang muncul.
4. Sistem akan memverifikasi akun Anda secara otomatis.

### Setelah Login Berhasil

- Nama dan foto profil Google Anda akan ditampilkan di sidebar.
- Menu **Unggah** akan dapat diakses (jika role Anda adalah Bendahara atau Admin).
- Menu **Pengguna** akan muncul di navigasi (jika role Anda adalah Admin).

### Cara Logout

Klik nama/foto profil Anda di sidebar, kemudian pilih **"Keluar"**.

> **Penting**: Jika setelah login Anda melihat pesan *"Akses Ditolak"* saat membuka menu Unggah, berarti role akun Anda belum disetel. Hubungi Administrator untuk mendapatkan akses Bendahara.

---

## 4. Navigasi Utama

Sistem dapat diakses melalui navigasi di sidebar (desktop) atau bilah navigasi bawah (mobile/tablet).

### Menu Navigasi

| Menu | Ikon | Halaman | Tersedia untuk |
|---|---|---|---|
| **Laporan** | 📁 | `/` — Arsip laporan mingguan | Semua |
| **Dashboard** | 📊 | `/dashboard` — Grafik tren kas | Semua |
| **Pengeluaran** | 🧾 | `/pengeluaran` — Rekap pengeluaran per kategori | Semua |
| **Donatur** | 🤝 | `/donatur` — Daftar donatur & infaq anonim | Semua |
| **Cari** | 🔍 | `/cari` — Pencarian arsip | Semua |
| **Unggah** | ➕ | `/unggah` — Unggah laporan baru | Bendahara & Admin |
| **Pengguna** | 👥 | `/pengguna` — Manajemen akun | Admin saja |

---

## 5. Arsip Laporan — Halaman Utama

**Alamat**: `/` (halaman utama)

Halaman ini menampilkan seluruh arsip laporan kas mingguan yang telah diunggah, dikelompokkan secara otomatis berdasarkan **Tahun → Bulan → Minggu**.

### Cara Membaca Arsip

- Laporan ditampilkan dalam bentuk kartu, diurutkan dari yang terbaru.
- Setiap kartu menampilkan:
  - **Tanggal laporan** (hari Jumat)
  - **Periode** (Minggu ke-N, Bulan, Tahun)
  - **Jumlah lampiran** yang terlampir
- Klik kartu laporan untuk membuka **Halaman Detail Laporan**.

### Filter Arsip

Anda dapat menyaring tampilan arsip berdasarkan:
- **Tahun** — pilih dari daftar tahun yang tersedia
- **Bulan** — pilih bulan tertentu dalam tahun yang dipilih

---

## 6. Dashboard Keuangan

**Alamat**: `/dashboard`

Halaman publik yang menampilkan ringkasan dan tren keuangan kas masjid berdasarkan transaksi yang sudah terverifikasi.

### Konten Halaman Dashboard

#### 1. Kartu Saldo Kas Terkini
Menampilkan angka saldo kas akhir fisik dari laporan kas mingguan terbaru yang telah terverifikasi sebagai acuan utama kas masjid saat ini.

#### 2. Toolbar Periode Fiskal & Ekspor Terpadu (Zero-Modal)
Di bagian atas area grafik kas, terdapat bilah alat terpadu yang memadukan filter waktu dan tombol ekspor langsung yang rapi:
- **Selector Bulan**: Memilih bulan spesifik (`Semua Bulan`, atau `Januari` s/d `Desember`).
- **Selector Tahun**: Memilih tahun fiskal yang tersedia di arsip pembukuan kas.
- **Dua Tombol Aksi Langsung**:
  - **Cetak Laporan**: Membuka pratinjau dokumen resmi A4 berkop surat DKM Al-Luqman siap cetak (lengkap dengan opsi unduh PDF dan cetak printer). Secara cerdas menyesuaikan dengan mode yang aktif:
    - Jika mode **Mingguan** aktif: membuka pratinjau **Laporan Kas Bulanan** (`/laporan/cetak/bulanan`) sesuai bulan dan tahun terpilih.
    - Jika mode **Tahunan** aktif: membuka pratinjau **Laporan Kas Tahunan Penuh** (`/laporan/cetak/tahunan`) yang merekap seluruh 12 bulan (Januari s/d Desember) di tahun tersebut.
  - **Excel**: Mengunduh berkas spreadsheet `.xlsx` resmi (rekap bulanan saat mode Mingguan aktif, atau rekap tahunan penuh saat mode Tahunan aktif).
  *(Tombol direct download PDF yang redundan telah dihilangkan agar antarmuka lebih bersih dan tidak membingungkan pengguna).*

#### 3. Tiga Kartu Ringkasan Indikator Keuangan (KPI)
Tiga kartu di bawah toolbar yang otomatis terhitung ulang mengikuti filter periode yang dipilih:
- **Total Pemasukan**: Akumulasi infaq, donatur, dan penerimaan kas pada periode aktif.
- **Total Pengeluaran**: Akumulasi seluruh pos belanja operasional kas pada periode aktif.
- **Arus Kas Bersih**: Selisih bersih pemasukan dikurangi pengeluaran (surplus bernilai positif/hijau, defisit bernilai negatif/merah).

#### 4. Grafik Tren Kas Interaktif
Grafik batang interaktif membandingkan **Pemasukan** (hijau) dan **Pengeluaran** (merah):
- **Mode Mingguan**: Memplot pekan-pekan (hari Jumat) spesifik di dalam bulan dan tahun yang dipilih, bukan rolling-window acak.
- **Mode Tahunan**:
  - Pada layar komputer/laptop (desktop ≥ 768px): Menampilkan 12 batang bulan penuh (Januari s/d Desember).
  - Pada layar ponsel pintar (mobile < 768px): Menyediakan toggle cepat **Semester 1** (`Jan - Jun`) dan **Semester 2** (`Jul - Des`) agar tampilan grafik tetap lega, proporsional, dan nyaman disentuh jari tanpa tumpang tindih label teks.
- **Touch Tooltip**: Sentuh atau arahkan kursor ke batang grafik untuk melihat rincian angka pemasukan dan pengeluaran pada periode terkait.

> **Info**: Seluruh data yang ditampilkan di dashboard hanya berasal dari transaksi dengan status **terverifikasi** (`isVerified = true`). Data draft yang belum dikonfirmasi bendahara tidak pernah ditampilkan ke publik.

---

## 7. Halaman Pengeluaran — Rekapitulasi Per Kategori

**Alamat**: `/pengeluaran`

Halaman publik yang menyajikan transparansi alokasi dana kas masjid dengan mengelompokkan seluruh pengeluaran terverifikasi ke dalam kategori fungsional.

### 1. Bar Filter Periode Waktu (PeriodFilterBar)

Di bagian atas halaman, terdapat bilah filter waktu terpadu:
- **Tombol Preset Instan**:
  - **Semua Waktu**: Menampilkan seluruh data pengeluaran sepanjang sejarah arsip kas.
  - **Tahun Ini**: Menyaring pengeluaran pada tahun kalender berjalan.
  - **Bulan Ini**: Menyaring pengeluaran pada bulan dan tahun berjalan saat ini.
- **Selector Manual**:
  - Dropdown **Tahun**: Memilih tahun tertentu (misal `2026`).
  - Dropdown **Bulan**: Memilih bulan tertentu (`Semua Bulan`, atau `Januari` s/d `Desember`).
*(Seluruh kartu KPI, bar visual proporsi alokasi, dan tabel rincian mutasi otomatis terhitung ulang secara instan mengikuti periode yang dipilih).*

### 2. Tiga Kartu Indikator Utama (KPI)

| Kartu | Penjelasan |
|---|---|
| **Total Pengeluaran** | Akumulasi pengeluaran terverifikasi pada periode waktu yang dipilih |
| **Kategori Terbesar** | Kategori dengan alokasi pengeluaran tertinggi beserta badge persentase proporsinya terhadap total |
| **Total Transaksi** | Jumlah frekuensi transaksi pengeluaran yang telah diverifikasi pada periode terpilih |

### 3. Bar Proporsi Alokasi Dana (Visual Breakdown)

Di bawah kartu KPI, terdapat bilah kemajuan (*progress bar*) multi-warna yang memvisualisasikan komposisi persentase pengeluaran:
- Setiap warna mewakili kategori tertentu (misalnya hijau untuk Operasional, oranye untuk Honor, biru untuk Pembangunan, dsb.).
- Di bawah bar terdapat ringkasan persentase dan nominal per kategori yang memudahkan jamaah membaca porsi penggunaan kas secara sekilas pada periode terkait.

### 4. Filter Kategori Interaktif (Chips)

Anda dapat menyaring rincian transaksi dengan menekan tombol kategori:
- **Semua Kategori** — Menampilkan seluruh transaksi pengeluaran.
- **Operasional** — Biaya listrik PLN, air PDAM, kebersihan, perawatan rutin sarana masjid.
- **Honor / Imam & Khotib** — Insentif imam rawatib, penceramah Jumat/kajian, dan muadzin.
- **Sosial & Santunan** — Bantuan mustahik, anak yatim, dhuafa, dan tanggap darurat warga sekitar.
- **Pembangunan & Sarpras** — Renovasi fisik bangunan, perbaikan atap, sound system, karpet, AC.
- **Konsumsi Kegiatan** — Konsumsi buka puasa bersama, konsumsi kajian rutin, dan hari besar Islam.
- **Administrasi & ATK** — Kertas kas, kwitansi, amplop infaq, banner/spanduk pengumuman.
- **Lain-lain** — Pengeluaran insidental yang tidak tergolong ke pos utama di atas.
- **Belum Dikategorikan** — Transaksi pengeluaran masa lampau yang belum diberi kategori oleh bendahara.

### 5. Pencarian Cepat & Pengurutan

- **Kolom Cari Transaksi**: Mengetik kata kunci untuk memfilter deskripsi pengeluaran secara instan.
- **Pengurutan (Sort)**:
  - **Tanggal Terbaru / Terlama** — Menelusuri pengeluaran secara kronologis.
  - **Nominal Terbesar / Terkecil** — Menemukan pos pengeluaran bernilai signifikan.

### 6. Tabel Rincian Pengeluaran Terverifikasi

Menampilkan daftar detail setiap transaksi:
- **Tanggal Transaksi**
- **Keterangan / Uraian Kebutuhan**
- **Badge Kategori** (dengan warna identitas khas per kategori)
- **Nominal (Rp)**

---

## 8. Halaman Donatur

**Alamat**: `/donatur`

Halaman transparansi keuangan yang menampilkan informasi donatur dan infaq masjid.

### 1. Bar Filter Periode Waktu (PeriodFilterBar)

Sama seperti pada halaman pengeluaran, di bagian atas halaman Donatur tersedia filter waktu terpadu:
- **Preset Instan**: **Semua Waktu**, **Tahun Ini**, dan **Bulan Ini**.
- **Selector Manual**: Dropdown **Tahun** dan **Bulan**.
*(Seluruh angka pada kartu KPI Donatur Terdata, Infaq Anonim, serta peringkat kontribusi donatur di bawahnya akan menyesuaikan dengan periode yang dipilih).*

### 2. Dua Kartu KPI Utama

| Kartu | Isi |
|---|---|
| **Donatur Terdata** | Jumlah donatur yang teridentifikasi + total kontribusi terverifikasi pada periode terpilih |
| **Infaq Anonim (Tromol / Kotak Amal)** | Total nominal + jumlah transaksi dari kotak amal dan donasi tanpa nama pada periode terpilih |

### 3. Melihat Rincian Infaq Anonim

1. Klik tombol **"Lihat Rincian"** pada kartu Infaq Anonim.
2. Dialog akan terbuka dan memuat daftar seluruh transaksi infaq anonim terverifikasi pada periode terkait.
3. Setiap baris menampilkan: **keterangan transaksi**, **tanggal**, **tautan ke laporan asal**, dan **nominal**.
4. Jika ada lebih dari 5 transaksi, kotak pencarian akan muncul untuk memudahkan filter.
5. Klik tautan **laporan** pada baris transaksi untuk membuka laporan fisik asal transaksi tersebut.

### 4. Daftar Profil Donatur

Di bawah kartu KPI terdapat daftar profil seluruh donatur teridentifikasi, diurutkan berdasarkan **total kontribusi tertinggi ke terendah** pada periode yang dipilih. Donatur teratas mendapat badge peringkat emas (#1).

- Gunakan **kotak pencarian** di atas daftar untuk mencari nama donatur tertentu.
- Klik nama donatur untuk membuka halaman **Detail Profil Donatur** (`/donatur/[id]`) yang berisi riwayat transaksi lengkap donatur tersebut.

---

## 9. Pencarian Arsip

**Alamat**: `/cari`

Memungkinkan pencarian arsip laporan berdasarkan kata kunci dan filter periode.

### Cara Mencari & Mengurutkan

1. **Kata Kunci**: Ketik kata kunci pada kolom pencarian (misalnya: nama pengurus pengunggah atau tanggal laporan).
2. **Filter Periode**: Gunakan filter **Tahun** dan **Bulan** untuk mempersempit arsip yang ditampilkan.
3. **Pengurutan (Sort)**:
   - **Terakhir Diubah / Ditambahkan** *(Default)*: Menampilkan laporan yang paling baru disentuh (baru diunggah, baru diekstrak AI, atau baru diverifikasi transaksinya) di urutan paling awal.
   - **Tanggal Laporan (Terbaru)**: Mengurutkan secara kronologis kalender dari tanggal buku kas terbaru ke terlama.
   - **Tanggal Laporan (Terlama)**: Mengurutkan secara kronologis kalender dari tanggal buku kas paling lampau ke terbaru.
4. **Hasil Pencarian**: Ditampilkan dalam bentuk kartu visual foto dengan label pekan, nama pengunggah, serta tanggal aktivitas pembaruan terakhir.
5. Klik kartu arsip untuk membuka halaman **Detail Laporan**.

---

## 10. Mengunggah Laporan Baru

**Alamat**: `/unggah`  
**Akses**: Bendahara & Administrator

Halaman untuk mengunggah dokumen kas mingguan baru ke sistem arsip.

### Format File yang Didukung

| Tipe File | Format | Batas Ukuran |
|---|---|---|
| Foto buku kas | `.jpg` / `.png` | Maks. 5 MB per file |
| Dokumen kas | `.pdf` | Maks. 10 MB per file |
| Spreadsheet kas | `.xlsx` / `.xls` | Maks. 5 MB per file |

### Langkah Mengunggah

#### Langkah 1 — Pilih File

- **Cara 1**: Klik area *drop zone* bertanda awan panah ke atas, lalu pilih file dari perangkat Anda.
- **Cara 2**: Seret (*drag and drop*) file langsung ke area tersebut.
- Anda dapat memilih **beberapa file sekaligus** dalam sekali unggah (kombinasi foto, PDF, dan Excel diperbolehkan).

Setelah file dipilih, daftar file terpilih akan muncul di bawah drop zone beserta nama dan ukuran masing-masing file.

- Untuk **menghapus** file yang tidak jadi diunggah: klik ikon **✕** di sebelah kanan nama file.
- Untuk **menambah** file lagi: klik tautan **"+ Tambah berkas lain"** di bawah daftar.

#### Langkah 2 — Isi Tanggal Laporan

Pada bagian **Detail Laporan**, isi kolom **Tanggal Laporan** dengan tanggal saat laporan ini dibacakan di hadapan jamaah — biasanya **hari Jumat**.

> **Penting**: Tanggal laporan harus berupa hari Jumat. Sistem menggunakan tanggal ini untuk mengelompokkan laporan secara otomatis berdasarkan periode mingguan.

#### Langkah 3 — Simpan

Klik tombol **"Simpan ke Arsip (N file)"** di bagian bawah halaman.

- Tombol ini hanya aktif jika minimal satu file sudah dipilih.
- Jika unggah berhasil, akan muncul banner hijau **"Laporan Berhasil Disimpan"** beserta tautan ke halaman Arsip.
- Jika ada error, pesan kesalahan akan ditampilkan di atas tombol simpan.

### Pesan Error yang Mungkin Muncul

| Pesan | Penyebab | Solusi |
|---|---|---|
| "Tipe file tidak didukung" | Format file selain JPG/PNG/PDF/XLSX/XLS | Konversi file ke format yang didukung |
| "Melebihi batas ukuran" | File terlalu besar | Kompres atau pecah file menjadi beberapa bagian |
| "Pilih minimal satu file" | Belum ada file dipilih saat klik Simpan | Pilih file terlebih dahulu |
| "Tanggal laporan wajib diisi" | Kolom tanggal belum diisi | Isi tanggal laporan |

---

## 11. Detail Laporan & Ekstraksi AI

**Alamat**: `/laporan/[id]`  
**Akses**: Melihat — semua orang | Ekstraksi — Bendahara & Administrator

Halaman ini menampilkan detail satu laporan mingguan beserta seluruh lampirannya dan panel review transaksi.

### Bagian-bagian Halaman Detail

#### A. Informasi Laporan
- Tanggal laporan (hari Jumat)
- Periode (Minggu ke-N, Bulan, Tahun)
- Diunggah oleh (nama pengurus)

#### B. Lampiran Dokumen
Setiap lampiran yang terhubung ke laporan ini ditampilkan dalam daftar. Untuk setiap lampiran:

- **Foto (JPG/PNG)**: Ditampilkan sebagai pratinjau gambar yang dapat diperbesar.
- **PDF**: Ditampilkan sebagai pratinjau PDF tersemat langsung di halaman (dapat discroll).
- **Excel**: Ditampilkan sebagai ikon spreadsheet dengan nama file.

**Tombol aksi pada halaman Detail Laporan**:
- **Hapus Laporan 🗑️** (*Khusus Administrator* `ADMIN`): Terletak di bagian atas halaman. Digunakan untuk menghapus dokumen laporan beserta seluruh berkas dan transaksi terkait. Dilengkapi proteksi data terverifikasi (`409 Conflict`).
- **+ Tambah Lampiran** (*Khusus Staf* `ADMIN` & `BENDAHARA`): Menambahkan berkas bukti kas susulan.
- **Ekstrak Data** / **Coba Lagi** (*Khusus Staf* `ADMIN` & `BENDAHARA`): Memulai proses ekstraksi AI pada berkas lampiran.
- **Ekstrak Ulang** (*Khusus Staf* `ADMIN` & `BENDAHARA`): Menjalankan ulang ekstraksi dengan dialog proteksi data kas.
- **Hapus Lampiran** (*Khusus Staf* `ADMIN` & `BENDAHARA`): Menghapus lampiran (hanya jika belum memuat transaksi terverifikasi).

#### C. Rekap Saldo Kas (Sidebar)
Menampilkan ringkasan finansial laporan minggu ini:
- **Saldo Awal** — Saldo kas dari laporan minggu sebelumnya
- **Total Pemasukan** — Jumlah seluruh transaksi pemasukan terverifikasi
- **Total Pengeluaran** — Jumlah seluruh transaksi pengeluaran terverifikasi
- **Saldo Akhir (Sistem)** — Hasil kalkulasi: Saldo Awal + Pemasukan − Pengeluaran
- **Saldo Fisik Tercatat** — Saldo akhir yang tertera di buku kas fisik
- **Status Rekonsiliasi** — Cocok ✅ atau Selisih ⚠️ antara saldo sistem dan saldo fisik

#### D. Panel Review Transaksi
Menampilkan seluruh transaksi yang diekstrak dari lampiran, dikelompokkan menjadi:
- **Menunggu Verifikasi** (draft) — Hasil ekstraksi yang belum dikonfirmasi
- **Sudah Diverifikasi** — Transaksi yang sudah dikonfirmasi bendahara

---

### Proses Ekstraksi Data AI

Fitur ini memungkinkan sistem membaca isi dokumen kas (foto/PDF/Excel) secara otomatis dan mengubahnya menjadi data transaksi terstruktur.

#### Cara Mengekstrak

1. Buka halaman **Detail Laporan**.
2. Pada daftar lampiran, cari lampiran yang berstatus **"Belum diekstrak"**.
3. Klik tombol **"Ekstrak Data"** di sebelah lampiran tersebut.
4. Tunggu proses selesai (status akan berubah menjadi **"Sedang diproses…"**).
5. Setelah berhasil, status berubah menjadi **"Selesai · N transaksi"** dan panel review transaksi akan menampilkan hasilnya.

#### Status Ekstraksi

| Status | Arti |
|---|---|
| 🔘 Belum diekstrak | Lampiran belum pernah diproses AI |
| 🟡 Sedang diproses… | Proses ekstraksi sedang berjalan |
| ✅ Selesai | Ekstraksi berhasil, transaksi tersedia di panel review |
| ❌ Gagal | Ekstraksi gagal — klik **"Coba Lagi"** |

#### Badge Model Cadangan ⚠️
Jika setelah ekstraksi muncul badge **"Model Cadangan"** berwarna kuning, artinya model AI utama (`gemini-3.6-flash`) tidak merespons tepat waktu dan sistem secara otomatis beralih ke model cadangan (`gemini-3.5-flash`). Hasil ekstraksi tetap valid — hanya perlu dicek lebih teliti karena akurasi model cadangan sedikit lebih rendah.

#### Ekstrak Ulang & Dialog Proteksi Duplikasi

Jika Anda menekan tombol **"Ekstrak Ulang"** pada berkas yang sudah pernah diproses:
- **Jika belum ada transaksi terverifikasi**: Sistem akan langsung menghapus draf lama yang belum diverifikasi dan mengekstrak ulang dari nol.
- **Jika SUDAH ada transaksi terverifikasi**: Sistem akan memunculkan **Dialog Konfirmasi Proteksi** untuk mencegah penggandaan data kas, dengan 2 opsi pilihan:
  1. **Reset & Ekstrak Ulang** (Direkomendasikan jika ingin mengulang dari awal): Menghapus seluruh transaksi lama dari berkas ini (termasuk yang terverifikasi) dan menggantikannya dengan hasil ekstraksi baru berstatus draft.
  2. **Simpan Lama & Tambah Draf**: Mempertahankan transaksi lama yang sudah terverifikasi dan menambahkan hasil ekstraksi baru sebagai draft (gunakan opsi ini hanya jika ada baris tambahan baru yang belum terbaca sebelumnya).
  3. **Batal**: Membatalkan proses tanpa mengubah data apapun.

#### Perbedaan per Tipe Lampiran

| Tipe Lampiran | Mekanisme Ekstraksi |
|---|---|
| **Foto (JPG/PNG)** | Dikirim ke Google Gemini AI untuk analisis visual (OCR + pemahaman struktur tabel tulisan tangan) |
| **PDF** | Dikirim ke Google Gemini AI sebagai dokumen multimodal |
| **Excel (.xlsx/.xls)** | Dibaca langsung secara tabular oleh parser server (100% akurasi numerik, tanpa AI) |


---

## 12. Verifikasi & Rekonsiliasi Transaksi

**Akses**: Bendahara & Administrator

Setelah ekstraksi selesai, hasil transaksi berstatus **draft (belum terverifikasi)**. Bendahara wajib memeriksa dan mengonfirmasi setiap transaksi sebelum data dianggap resmi.

### Alur Verifikasi Transaksi

#### Langkah 1 — Periksa Setiap Transaksi Draft

Di bagian **"Menunggu Verifikasi"** pada panel review, setiap baris transaksi menampilkan:
- Jenis transaksi (Pemasukan / Pengeluaran)
- Nominal (Rp)
- Keterangan / deskripsi
- Tanggal transaksi
- Nama donatur (untuk pemasukan)
- **Kategori Pengeluaran** (khusus untuk pengeluaran, default: *Tidak Dikategorikan*)

Bandingkan dengan buku kas fisik untuk memastikan keakuratan.

#### Langkah 2 — Edit Jika Perlu

Jika ada data yang tidak sesuai, klik ikon **pensil ✏️** pada baris transaksi untuk mengedit:
- **Nominal** — ketik nominal yang benar
- **Keterangan** — perbaiki deskripsi transaksi
- **Jenis transaksi** — ganti antara Pemasukan / Pengeluaran
- **Nama donatur** — isi atau perbaiki nama donatur (untuk transaksi pemasukan)
- **Kategori** — pilih pos pengeluaran yang sesuai dari dropdown (Operasional, Honor / Imam & Khotib, Sosial & Santunan, Pembangunan & Sarpras, Konsumsi Kegiatan, Administrasi & ATK, Lain-lain, atau biarkan kosong untuk Tidak Dikategorikan)

Klik **✓ Simpan** setelah selesai mengedit, atau **✗ Batal** untuk membatalkan perubahan.

#### Langkah 3 — Konfirmasi (Verifikasi)

Setelah data sudah benar, klik tombol **"Konfirmasi ✓"** pada baris transaksi.

Saat mengonfirmasi transaksi pemasukan dengan nama donatur:
- Sistem otomatis mencocokkan nama donatur ke profil yang sudah ada (fuzzy matching).
- Jika nama cocok: transaksi terhubung ke profil donatur yang ada.
- Jika nama baru: profil donatur baru dibuat secara otomatis.
- Jika nama terdeteksi anonim (contoh: "Hamba Allah", "Kotak Amal"): tidak dibuat profil donatur, masuk sebagai infaq anonim.

Saat mengonfirmasi transaksi pengeluaran:
- Kategori yang dipilih akan otomatis tersimpan dan langsung tercermin di halaman publik `/pengeluaran`.

#### Langkah 4 — Hapus Jika Tidak Valid

Jika sebuah baris transaksi tidak valid (misalnya duplikat atau hasil baca AI yang keliru), klik tombol **"Hapus 🗑️"** pada baris tersebut.

> **Catatan**: Transaksi yang sudah berstatus **terverifikasi tidak dapat dihapus**.

#### Mengubah Kategori pada Transaksi yang Sudah Diverifikasi

Jika di kemudian hari bendahara menyadari ada pengeluaran terverifikasi yang salah kategori atau masih "Tidak Dikategorikan":
1. Buka halaman **Detail Laporan** terkait.
2. Pada panel review di bagian **"Sudah Diverifikasi"**, cari baris transaksi pengeluaran tersebut.
3. Klik ikon **pensil kecil ✏️** di samping badge kategori (ikon ini hanya muncul jika Anda sudah login).
4. Pilih kategori baru dari menu dropdown yang muncul.
5. Klik tombol **Simpan (✓)** untuk menyimpan perubahan (atau klik **Batal ✕** untuk membatalkan).
6. Sistem akan langsung menyimpan perubahan kategori ke server secara otomatis tanpa mengubah status verifikasi dan tanpa mengganggu saldo kas.

#### Pembatalan Verifikasi

Jika terjadi kesalahan nominal atau jenis transaksi setelah dikonfirmasi, Bendahara dapat membatalkan verifikasi dengan klik ikon **Batalkan Verifikasi** (ikon putar balik) pada baris transaksi yang sudah diverifikasi. Transaksi akan kembali ke status draft dan bisa diedit ulang seluruh field-nya.

### Rekonsiliasi Saldo

Setelah seluruh transaksi selesai diverifikasi, periksa bagian **Rekap Saldo Kas** di sidebar:

- Jika **Saldo Sistem = Saldo Fisik** → muncul label ✅ **Cocok** (rekonsiliasi berhasil)
- Jika ada selisih → muncul label ⚠️ **Selisih Rp X** (ada transaksi yang belum masuk atau nominal yang keliru)

---

## 13. Cetak & Ekspor Rekapitulasi Kas

Sistem menyediakan dua format ekspor resmi yang dapat digunakan untuk ditempel di papan mading fisik masjid atau disimpan sebagai arsip digital:

### A. Ekspor Rekap Mingguan (dari Halaman Detail Laporan)

Pada halaman **Detail Laporan** (`/laporan/:id`), tersedia 3 tombol aksi cepat di bagian atas:
1. **Unduh PDF**: Mengunduh berkas `.pdf` resmi A4 langsung ke perangkat Anda. Berkas otomatis memicu notifikasi unduhan browser dan tercatat di daftar riwayat unduhan (*Downloads*). Sangat praktis untuk pengguna smartphone (HP) agar berkas langsung tersimpan di galeri berkas.
2. **Unduh Excel**: Mengunduh rekapitulasi kas mingguan dalam format spreadsheet `.xlsx`.
3. **Cetak / A4**: Membuka halaman pratinjau cetak berkop surat DKM Al-Luqman. Di halaman ini, Anda dapat:
   - Mengklik **"Unduh PDF"** untuk mengunduh berkas digital, atau
   - Mengklik **"Cetak (Printer)"** untuk mencetak langsung ke kertas fisik via printer yang terhubung. Seluruh tata letak sudah dioptimalkan agar pas 1 lembar A4 tanpa terpotong, dan warna hijau (pemasukan) serta merah (pengeluaran) tetap tampil cerah.

---

### B. Ekspor Rekap Bulanan & Tahunan (Langsung dari Toolbar Dashboard)

Pada dashboard, tombol aksi cetak dan ekspor otomatis menyesuaikan dengan mode grafik yang aktif:
1. Buka halaman **Dashboard** (`/dashboard`).
2. Tentukan periode yang ingin dilaporkan:
   - **Laporan Bulanan**: Pilih tab **Mingguan**, lalu pilih **Bulan** dan **Tahun** yang diinginkan.
   - **Laporan Tahunan**: Pilih tab **Tahunan**, lalu pilih **Tahun** fiskal yang diinginkan.
3. Gunakan dua tombol aksi yang tersedia di toolbar:
   - **Cetak Laporan**: Membuka pratinjau cetak resmi A4 berkop surat DKM Al-Luqman.
     - Pada mode Mingguan: membuka rekapitulasi kas bulanan (`/laporan/cetak/bulanan`).
     - Pada mode Tahunan: membuka rekapitulasi kas tahunan penuh 12 bulan (`/laporan/cetak/tahunan`), lengkap dengan tabel ringkasan akumulasi per bulan (Jan–Des) dan riwayat transaksi tahunan.
     *(Di dalam halaman pratinjau cetak, Anda dapat langsung mengklik tombol **Unduh PDF** untuk menyimpan berkas digital atau **Cetak (Printer)** untuk mencetak fisik).*
   - **Excel**: Mengunduh berkas spreadsheet `.xlsx` resmi (bulanan atau tahunan sesuai mode yang aktif).

> **Catatan Penting**:
> - Seluruh laporan hanya mencakup transaksi dengan status **terverifikasi** (`isVerified = true`). Transaksi draf yang belum diverifikasi tidak pernah dimasukkan ke dalam laporan.
> - Tata letak cetak telah dioptimasi dengan format **A4 Portrait** resmi berkop DKM Masjid Al-Luqman dan kolom pengesahan pengurus.

---

## 14. Manajemen Pengguna

**Alamat**: `/pengguna`  
**Akses**: Administrator saja

Halaman ini hanya terlihat di menu navigasi untuk akun dengan role **ADMIN**.

### Ringkasan Statistik

Di bagian atas halaman terdapat 4 angka statistik:
- **Total Pengguna** — jumlah semua akun terdaftar
- **Administrator** — akun dengan role ADMIN
- **Bendahara** — akun dengan role BENDAHARA
- **Jamaah** — akun yang login tapi belum diberi role (read-only)

### Mencari & Memfilter Pengguna

- **Kotak pencarian** — cari berdasarkan nama atau alamat email
- **Dropdown filter role** — tampilkan hanya Administrator, Bendahara, atau Jamaah

### Mengubah Role (Hak Akses) Pengguna

1. Temukan pengguna yang ingin diubah rolenya di tabel.
2. Pada kolom **"Hak Akses (Role)"**, klik dropdown di baris pengguna tersebut.
3. Pilih role yang diinginkan:
   - **Jamaah (Read-only)** — hanya dapat melihat, tidak bisa unggah/verifikasi
   - **Bendahara (Upload)** — dapat mengunggah laporan dan memverifikasi transaksi
   - **Administrator** — akses penuh termasuk kelola pengguna
4. Perubahan langsung tersimpan secara otomatis (ada banner hijau konfirmasi).

> **Catatan**: Anda tidak dapat mengubah role akun Anda sendiri yang sedang aktif digunakan.

### Menghapus Pengguna

1. Klik tombol **"Hapus"** (ikon tempat sampah) di kolom Aksi pada baris pengguna.
2. Dialog konfirmasi akan muncul.

**Terdapat dua skenario**:

#### Skenario A — Pengguna Tidak Memiliki Riwayat Data
Dialog konfirmasi hapus biasa akan muncul. Klik **"Ya, Hapus Pengguna"** untuk menghapus permanen.

#### Skenario B — Pengguna Memiliki Riwayat Audit (Laporan / Verifikasi)
Dialog **Proteksi Integritas Data** akan muncul dan pengguna **tidak dapat dihapus**. Ini adalah pengaman sistem agar jejak audit kas masjid tetap terlacak.

Solusinya: Ubah saja role pengguna tersebut menjadi **Jamaah (Read-only)** untuk mencabut aksesnya tanpa menghapus riwayat data.

---

## 15. Pertanyaan Umum (FAQ)

**Q: Apakah perlu login untuk melihat arsip laporan?**  
A: Tidak. Seluruh arsip laporan, dashboard keuangan, rekapitulasi pengeluaran per kategori, dan daftar donatur dapat diakses oleh siapa pun tanpa perlu login.

---

**Q: Kenapa setelah login saya tidak bisa mengakses menu Unggah?**  
A: Akun Anda belum mendapatkan role Bendahara atau Admin. Hubungi Administrator DKM untuk mendapatkan akses.

---

**Q: Boleh satu laporan punya lebih dari satu lampiran?**  
A: Ya. Satu laporan mingguan dapat memiliki kombinasi beberapa file: foto, PDF, dan/atau Excel sekaligus.

---

**Q: Apa yang terjadi jika ekstraksi AI gagal?**  
A: Sistem akan menampilkan pesan error yang ramah. Klik **"Coba Lagi"** untuk mengulang proses. Jika foto terlalu buram, pertimbangkan mengambil foto ulang dengan pencahayaan yang lebih baik.

---

**Q: Apakah transaksi yang diekstrak AI langsung menjadi data resmi?**  
A: Tidak. Hasil ekstraksi selalu berstatus **draft** (belum terverifikasi) dan harus dikonfirmasi satu per satu oleh Bendahara. Data draft tidak pernah tampil di dashboard publik, halaman pengeluaran, atau berkas ekspor.

---

**Q: Apakah kategori pengeluaran wajib diisi saat verifikasi transaksi?**  
A: Tidak wajib. Jika tidak dipilih, transaksi tetap dapat diverifikasi dan otomatis berstatus **"Tidak Dikategorikan"**. Kategori ini dapat dilengkapi sewaktu-waktu oleh bendahara langsung dari daftar transaksi terverifikasi.

---

**Q: Mengapa transaksi pemasukan tidak memiliki opsi kategori?**  
A: Klasifikasi kategori dirancang khusus untuk transparansi alokasi belanja kas masjid (operasional, honor, pembangunan, dsb.). Pemasukan kas masjid diklasifikasikan berdasarkan profil donatur perorangan atau infaq anonim (kotak amal/tromol/hamba Allah).

---

**Q: Bisakah bendahara menambah kategori pengeluaran baru sendiri?**  
A: Saat ini terdapat 7 kategori standar (`Operasional`, `Honor / Imam & Khotib`, `Sosial & Santunan`, `Pembangunan & Sarpras`, `Konsumsi Kegiatan`, `Administrasi & ATK`, `Lain-lain`) yang dirancang mencakup seluruh kebutuhan kas DKM Al-Luqman. Pengeluaran insidental yang tidak tercantum dapat dikelompokkan ke pos **"Lain-lain"** dengan rincian kebutuhan ditulis jelas pada kolom keterangan.

---

**Q: Nama donatur ditulis berbeda-beda di setiap laporan, apakah akan terhitung terpisah?**  
A: Tidak, selama variasinya tidak terlalu jauh. Sistem menggunakan **fuzzy matching** (normalisasi nama dan penghapusan gelar seperti "H.", "Bpk.", "Ibu") sehingga "H. Supriyadi", "Bpk Supriyadi", dan "Supriyadi" akan dihitung sebagai satu profil donatur yang sama.

---

**Q: Bagaimana cara membatalkan verifikasi transaksi yang salah dikonfirmasi?**  
A: Buka Detail Laporan terkait → temukan transaksi di bagian "Sudah Diverifikasi" → klik ikon **Batalkan Verifikasi** (ikon putar balik) pada baris transaksi tersebut. Transaksi akan kembali ke status draft.

---

**Q: Apakah saldo kas diperbarui secara otomatis?**  
A: Ya. Rekap Saldo Kas di sidebar halaman Detail Laporan dikalkulasi secara otomatis dari seluruh transaksi terverifikasi. Demikian juga grafik di Dashboard dan total di halaman Pengeluaran, yang selalu mencerminkan data terverifikasi terkini.

---

**Q: Apakah data infaq anonim ("Hamba Allah", "Kotak Amal") tercatat?**  
A: Ya, namun tidak dibuat sebagai profil donatur. Semua infaq anonim dikelompokkan ke kartu **"Infaq Anonim (Tromol / Kotak Amal)"** di halaman Donatur dan dapat dilihat rinciannya melalui tombol **"Lihat Rincian"**.

---

**Q: Mengapa angka pemasukan/pengeluaran menjadi dobel (2x lipat) dan saldo kas akhir berselisih setelah saya melakukan Ekstrak Ulang?**  
A: Hal ini terjadi jika Anda melakukan ekstraksi ulang pada berkas yang sebelumnya sudah memiliki transaksi terverifikasi, lalu Anda mengonfirmasi kembali draf baru tersebut sehingga transaksinya tercatat ganda.  
**Cara memperbaikinya**:
1. Buka Detail Laporan terkait.
2. Di daftar **Transaksi Kas**, temukan baris-baris duplikat (misalnya yang memiliki tanggal konfirmasi terbaru).
3. Klik tombol **"Batalkan Verifikasi"** pada baris duplikat tersebut.
4. Setelah statusnya kembali ke *"Menunggu Verifikasi"*, klik tombol **Hapus (ikon tempat sampah)**.
5. Setelah baris duplikat dihapus, rekap kas di sidebar akan kembali seimbang dan cocok ✅ secara otomatis.

---

*Panduan ini disusun berdasarkan implementasi sistem Masjid Archive versi V7 (Feature-Complete), status Oktober 2026.*  
*Untuk pertanyaan teknis, hubungi: **Reza Dwi Prasetya** — Engineer & Developer Masjid Archive.*

