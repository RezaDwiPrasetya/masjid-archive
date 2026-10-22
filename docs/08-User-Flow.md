# 08. User Flow

## Arsitektur Alur: Dua Dunia (Dunia Publik vs Ruang Kerja DKM)

```
Pengunjung Membuka Web (URL Utama /)
  │
  ├─► [Publik / Jamaah & Pengurus — Halaman Utama /]
  │     ├── 1. Ringkasan Kas & Tren: Grafik kas masuk & keluar, filter periode terintegrasi (Bulan & Tahun), tombol Cetak Laporan (A4) & Excel
  │     ├── 2. Alokasi Pos Pengeluaran: Distribusi belanja kas per kategori riil (Operasional, Pembangunan, Sosial, dll) terintegrasi dengan filter aktif
  │     ├── 3. Widget Cek Infaq: Pencarian cepat riwayat infaq donatur dengan tanggal riil dokumen asli tanpa login
  │     └── 4. Arsip Laporan: Pindaian buku kas mingguan & buletin berkala DKM
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
              └── Redirect Otomatis ke Workspace Staf (/unggah)
                    ├── 1. Unggah Foto Buku Kas Jumat / Nota / PDF
                    ├── 2. Ekstraksi Multimodal Vision-LLM (Gemini)
                    ├── 3. Review Transaksi & Rekonsiliasi Kas (Side-by-side)
                    ├── 4. Manajemen Kas & Mutasi Bank (/keuangan)
                    └── 5. Kelola Hak Akses Pengguna (/pengguna - Khusus ADMIN)
```

## Detailed Flow

### 1. Alur Jamaah & Publik (Tanpa Hambatan Login)
1. Pengunjung membuka halaman utama (`/`).
2. Melihat identitas DKM Masjid Al-Luqman, total saldo terkonsolidasi (fisik & bank), serta visualisasi interaktif **Ringkasan Kas & Tren** (lengkap dengan filter bulan/tahun terpadu, grafik batang kas masuk & keluar, dan tombol **Cetak Laporan / Excel**).
3. Meninjau **Alokasi Pos Pengeluaran Kas** yang terhubung langsung dengan filter periode aktif, menyajikan persentase dan nominal pembelanjaan per kategori riil (Operasional, Pembangunan, Sosial, Honor, dll) beserta tautan langsung ke halaman `/pengeluaran`.
4. Donatur dapat langsung mengetik namanya di kolom "Cek Riwayat Infaq" untuk memastikan uang infaqnya sudah tercatat secara sah, lengkap dengan tanggal riil dari lembar dokumen kas aslinya.
5. Jemaah & pengurus dapat menelusuri arsip pindaian buku kas mingguan dan mencetak dokumen mading A4 kapan saja.

### 2. Alur Staf Pengurus DKM
1. Staf membuka web dan menekan tombol **"Akses Pengurus"**.
2. Masuk menggunakan akun Google terdaftar.
3. Sistem memeriksa sesi dan hak akses:
   - Jika role terdaftar sebagai `BENDAHARA` atau `ADMIN`, sistem langsung mengarahkan ke halaman `/unggah`.
   - Header menampilkan badge peran pengurus dan tombol keluar.
4. Staf melakukan aktivitas operasional: unggah nota, koreksi entri, verifikasi kas, dan cetak buletin mading.

### 3. Alur Calon Staf / Pending Approval
1. Pengguna login menggunakan Google namun belum di-assign role oleh Administrator.
2. Endpoint `app/auth/post-login` mendeteksi `role === null` dan mengarahkan ke `/pending`.
3. Halaman `/pending` menampilkan pemberitahuan yang santun dan opsi kembali ke beranda publik atau logout.
4. Administrator melalui menu `/pengguna` dapat meng-upgrade akun tersebut menjadi `BENDAHARA` atau `ADMIN`. Setelah di-upgrade, pada login berikutnya staf langsung diarahkan ke workspace operasional.

## Struktur Navigasi Berdasarkan Hak Akses

| Peran Pengguna | Menu Navigasi yang Ditampilkan | Keterangan |
| :--- | :--- | :--- |
| **Jamaah / Publik (Tanpa Login)** | 1. **Beranda** (`/`)<br>2. **Donatur** (`/donatur`)<br>3. **Pengeluaran** (`/pengeluaran`)<br>4. **Cari** (`/cari`) | Hanya 4 menu terbuka. Menampilkan Portal Transparansi Kas publik dengan saldo terkonsolidasi, grafik tren, cetak laporan, dan pencarian infaq terbuka. Menu internal disembunyikan agar tampilan bersih dan terarah. |
| **Staf DKM (BENDAHARA / ADMIN)** | 1. **Unggah** (`/unggah`)<br>2. **Laporan** (`/`)<br>3. **Dashboard** (`/dashboard`)<br>4. **Keuangan** (`/keuangan`)<br>5. **Donatur** (`/donatur`)<br>6. **Pengeluaran** (`/pengeluaran`)<br>7. **Cari** (`/cari`) | Alur kerja operasional terverifikasi diawali dengan digitalisasi fisik (`Unggah`), arsip buletin mingguan (`Laporan`), analitik kas & tren (`Dashboard`), mutasi perbankan/tunai (`Keuangan`), lalu penelusuran transaksi. |
| **Administrator Sistem (ADMIN)** | Tambahan: 8. **Pengguna** (`/pengguna`) | Menu pengelolaan hak akses seluruh akun pengurus DKM. |


