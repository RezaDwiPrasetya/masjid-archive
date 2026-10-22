# 08. User Flow

## Arsitektur Alur: Dua Dunia (Dunia Publik vs Ruang Kerja DKM)

```
Pengunjung Membuka Web (URL Utama /)
  │
  ├─► [Publik / Jamaah — Tanpa Login]
  │     ├── 1. Lobi Transparansi: Ringkasan 3 Pilar Kas (Operasional, Pembangunan, Sosial)
  │     ├── 2. Widget Cek Infaq: Masukkan Nama Donatur / Kode Resi
  │     ├── 3. Rekening Resmi & QRIS: Informasi transfer terverifikasi DKM
  │     └── 4. Unduh Laporan: Buletin keuangan berkala (PDF A4 mading)
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
2. Melihat sambutan hangat Masjid Al-Luqman dan ringkasan kas 3 pilar yang bersahabat.
3. Donatur dapat langsung mengetik namanya di kolom "Cek Riwayat Infaq" untuk memastikan uang infaqnya sudah tercatat secara sah.
4. Jemaah yang ingin bersedekah dapat memindai QRIS resmi DKM atau menyalin nomor rekening resmi BSI/Muamalat atas nama DKM Masjid Al-Luqman.
5. Jemaah dapat mengunduh salinan berkas PDF laporan bulanan resmi.

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
| **Jamaah / Publik (Tanpa Login)** | 1. **Beranda** (`/`)<br>2. **Donatur** (`/donatur`)<br>3. **Pengeluaran** (`/pengeluaran`)<br>4. **Cari** (`/cari`) | Hanya 4 menu terbuka. Menu internal (`Dashboard`, `Keuangan`) disembunyikan agar tampilan bersih dan tidak membingungkan. |
| **Staf DKM (BENDAHARA / ADMIN)** | 1. **Beranda** (`/`)<br>2. **Unggah** (`/unggah`)<br>3. **Dashboard** (`/dashboard`)<br>4. **Keuangan** (`/keuangan`)<br>5. **Donatur** (`/donatur`)<br>6. **Pengeluaran** (`/pengeluaran`)<br>7. **Cari** (`/cari`) | Menu operasional (`Unggah`, `Dashboard`, `Keuangan`) terbuka penuh untuk kebutuhan kerja pembukuan dan cetak buletin. |
| **Administrator Sistem (ADMIN)** | Tambahan: 8. **Pengguna** (`/pengguna`) | Menu pengelolaan hak akses seluruh akun pengurus DKM. |


