# 08. User Flow

## Arsitektur Alur: Dua Dunia (Portal Publik vs Cockpit Pengurus DKM)

```
Pengunjung Membuka Web
  │
  ├─► [Publik / Jamaah & Tamu — Beranda Portal Publik /]
  │     ├── 1. Identitas & Amanah DKM: Salam takzim, emblem Masjid Al-Luqman & ikrar transparansi kas umat
  │     ├── 2. Saldo Kas Terkonsolidasi: Nilai total dana umat beserta rincian kas fisik brankas vs kas rekening bank/QRIS
  │     ├── 3. Alokasi Pengeluaran Umat: Kartu naratif penyaluran dana riil bulan berjalan (Operasional, Sosial, Honor, dll)
  │     ├── 4. Widget Cek Infaq Mandiri: Pencarian cepat riwayat infaq jamaah dengan tanggal riil dokumen asli tanpa login
  │     ├── 5. Rekening & QRIS Resmi: Pilihan penyaluran infaq & sedekah ke rekening syariah resmi atas nama DKM
  │     └── 6. Arsip Laporan Kas Mingguan: Galeri pindaian otentik buku kas fisik pekanan per tahun
  │
  └─► [Tombol 'Akses Pengurus' di Pojok Kanan Atas]
        │
        ▼
     Login Google OAuth (NextAuth)
        │
        ├─► [Role: null / Akun Baru / Jamaah]
        │     └── Halaman /pending (Status: "Menunggu Verifikasi Admin DKM")
        │           ├── Informasi profil akun Google
        │           ├── Petunjuk aktivasi ke pengurus DKM
        │           └── Tombol "Kembali ke Beranda Publik" / "Keluar"
        │
        └─► [Role: BENDAHARA / ADMIN]
              └── Smart Redirect Otomatis ke Dashboard Staf (/dashboard)
                    ├── 1. Hero Cockpit: Saldo terverifikasi, tanggal laporan mutakhir, dan pintasan (+ Unggah Baru & Lihat Portal Publik)
                    ├── 2. Tren Arus Kas Interaktif: Grafik Recharts (Bulanan/Tahunan), toggle granularitas, & selector periode
                    ├── 3. Tombol Ekspor & Cetak: Cetak Laporan (A4) untuk mading masjid & Ekspor Buku Kas Excel (.xlsx)
                    ├── 4. Distribusi Belanja Analitik: Kartu alokasi belanja reaktif sesuai filter periode terpilih
                    └── 5. Navigasi Kerja Pengurus: Unggah (/unggah), Keuangan (/keuangan), Donatur (/donatur), Pengeluaran (/pengeluaran), & Pengguna (/pengguna)
```

## Detailed Flow

### 1. Alur Jamaah & Publik (Beranda - Portal Transparansi Kas)
1. Pengunjung membuka alamat utama (`/`).
2. Disambut dengan identitas hangat Masjid Al-Luqman, pernyataan amanah pembukuan kas, serta angka total saldo kas terkonsolidasi (kas tunai fisik di brankas vs kas di rekening bank/QRIS).
3. Meninjau **Distribusi Penyaluran Kas Umat** bulan berjalan yang disajikan secara naratif dan ramah jemaah (bebas dari instrumen grafik teknis yang rumit), lengkap dengan tautan rincian ke `/pengeluaran`.
4. Jamaah/donatur dapat mengecek riwayat infaq secara mandiri melalui kolom pencarian tanpa perlu login, mencocokkan tanggal lembar kas fisik aslinya.
5. Tersedia informasi rekening bank syariah resmi dan kode QRIS DKM bagi jamaah yang hendak menyalurkan infaq secara digital.
6. Jamaah dapat menelusuri arsip pindaian buku kas mingguan per tahun buku.

### 2. Alur Staf Pengurus DKM (Dashboard - Cockpit Analitik & Operasional)
1. Staf membuka web dan menekan tombol **"Akses Pengurus"** (atau langsung mengakses `/login`).
2. Masuk menggunakan akun Google terdaftar.
3. Sistem memeriksa sesi dan hak akses di `app/auth/post-login`:
   - Pengurus dengan role `BENDAHARA` atau `ADMIN` langsung diarahkan ke **Dashboard Pengurus** (`/dashboard`).
   - Apabila staf sedang membuka alamat utama (`/`), sistem otomatis mengalihkannya ke `/dashboard`, kecuali jika staf sengaja mengklik tautan **"Lihat Beranda Publik"** (`/?view=public`).
4. Pada `/dashboard`, staf memperoleh instrumen analitik lengkap:
   - Pantauan saldo dan tanggal laporan mutakhir.
   - Pintasan cepat `+ Unggah Laporan Baru` dan `Lihat Portal Publik`.
   - Visualisasi tren arus kas masuk vs keluar berbasis grafik batang Recharts dengan switch bulanan/tahunan.
   - Tombol **Cetak Laporan (A4)** siap tempel di papan mading dan tombol **Ekspor Excel (.xlsx)**.
   - Analisis alokasi pengeluaran per kategori yang reaktif mengikuti filter periode aktif.
5. Staf berpindah ke ruang kerja operasional melalui menu sidebar: `/unggah` (digitalisasi dokumen AI), `/keuangan` (rekonsiliasi mutasi kas/bank), atau `/pengguna` (khusus Admin).

### 3. Alur Calon Staf / Pending Approval
1. Pengguna login menggunakan Google namun belum di-assign role oleh Administrator.
2. Endpoint `app/auth/post-login` mendeteksi `role === null` dan mengarahkan ke `/pending`.
3. Halaman `/pending` menampilkan pemberitahuan yang santun dan opsi kembali ke beranda publik atau logout.
4. Administrator melalui menu `/pengguna` dapat meng-upgrade akun tersebut menjadi `BENDAHARA` atau `ADMIN`. Setelah di-upgrade, pada login berikutnya staf langsung diarahkan ke `/dashboard`.

## Struktur Navigasi Berdasarkan Hak Akses

| Peran Pengguna | Menu Navigasi yang Ditampilkan | Keterangan |
| :--- | :--- | :--- |
| **Jamaah / Publik (Tanpa Login)** | 1. **Beranda** (`/`)<br>2. **Donatur** (`/donatur`)<br>3. **Pengeluaran** (`/pengeluaran`)<br>4. **Cari** (`/cari`) | Menampilkan Portal Transparansi Kas publik yang ramah jamaah dengan saldo terkonsolidasi, narasi alokasi belanja, cek infaq mandiri, rekening resmi, dan arsip mingguan. Instrumen grafik dan tombol ekspor disembunyikan agar tampilan bersih dan humanis. |
| **Staf DKM (BENDAHARA / ADMIN)** | 1. **Dashboard** (`/dashboard`)<br>2. **Unggah** (`/unggah`)<br>3. **Keuangan** (`/keuangan`)<br>4. **Donatur** (`/donatur`)<br>5. **Pengeluaran** (`/pengeluaran`)<br>6. **Cari** (`/cari`) | Cockpit kerja pengurus diawali dengan Dashboard analitik (`/dashboard`), alat digitalisasi dokumen (`Unggah`), manajemen kas & mutasi bank (`Keuangan`), dan penelusuran transaksi. Di bagian footer sidebar tersedia tautan cepat *"Lihat Beranda Publik"* (`/?view=public`). |
| **Administrator Sistem (ADMIN)** | Tambahan: 7. **Pengguna** (`/pengguna`) | Menu pengelolaan hak akses seluruh akun pengurus DKM. |


