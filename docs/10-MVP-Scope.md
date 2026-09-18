# 10. MVP Scope

## V1 — Arsip Visual Dasar (Selesai)

### MVP Objective (V1)

Membuktikan bahwa bendahara mau dan mampu mengarsipkan laporan mingguan lewat foto + tanggal, dan pengurus lain benar-benar terbantu mencari arsip lama lewat filter periode.

### Must Have (V1)
- Unggah laporan (foto + tanggal)
- Arsip tersusun otomatis per Tahun > Bulan
- Pencarian dengan filter Tahun/Bulan
- Halaman konfirmasi setelah upload berhasil

### Should Have (V1)
- Halaman detail laporan (foto ukuran penuh + unduh)

### MVP Success Criteria (V1)
- [x] Bendahara berhasil mengunggah minimal satu laporan mingguan tanpa bantuan
- [x] Pengurus lain berhasil menemukan laporan tertentu lewat pencarian/filter

---

## V2 — Multi-Format Upload (Selesai)

### MVP Objective (V2)

Membuktikan bahwa satu laporan mingguan bisa memiliki lebih dari satu lampiran file, dengan tipe file yang lebih beragam (gambar, PDF, Excel) — sebagai fondasi sebelum data di dalamnya bisa diekstrak (V4).

### Must Have (V2)
- Form Unggah mendukung multi-file selection
- Mendukung tipe file: gambar (jpg/png), PDF, Excel (.xlsx)
- Validasi tipe file & ukuran maksimum per file
- Halaman Detail Laporan menampilkan daftar semua lampiran, dengan preview berbeda per tipe
- Tombol hapus lampiran individual (baik saat pra-unggah maupun pada laporan yang sudah terunggah)
- Fitur tambah lampiran susulan pada laporan yang sudah ada

### Should Have (V2)
- Reorder/urutan tampilan lampiran
- Indikator progres upload per file

### Could Have (V2)
- Preview thumbnail untuk halaman pertama PDF

### Not Now (V2 — tetap di luar scope, ini scope V3+)
- Autentikasi SSO & Manajemen Pengguna — scope V3
- Ekstraksi data dari file (OCR/parsing) — scope V4
- Analitik/tren/dashboard — scope V5

### MVP Core Flow (V2)

Bendahara membuka form Unggah → memilih beberapa file sekaligus (kombinasi gambar/PDF/Excel) → mengisi tanggal laporan → submit → seluruh file tersimpan sebagai lampiran-lampiran yang terhubung ke satu laporan → pengurus lain membuka Detail Laporan dan melihat semua lampiran itu.

### MVP Success Criteria (V2)
- [x] Bendahara berhasil mengunggah 1 laporan dengan kombinasi minimal 2 tipe file berbeda dalam sekali submit
- [x] Semua lampiran tersimpan dan bisa diakses kembali dari halaman Detail Laporan
- [x] Validasi menolak tipe file yang tidak didukung dengan pesan error yang jelas

---

## V3 — Autentikasi SSO & Role-Based Access (Sedang Dikerjakan)

### MVP Objective (V3)

Membuktikan bahwa sistem dapat mengamankan rute operasional (mutasi data) dan mengelola identitas pengurus menggunakan Google OAuth secara terpusat, membedakan hak akses antara publik dan administrator.

### Must Have (V3)
- Integrasi NextAuth.js (Auth.js) dengan Google Provider
- Penyimpanan data User, Session, dan Account di Vercel Postgres via Prisma Adapter
- Tombol Login/Logout Google di antarmuka
- Proteksi halaman `/unggah` agar hanya bisa diakses oleh pengguna yang login
- Visibilitas tombol aksi (hapus/tambah) di Detail Laporan hanya untuk pengguna yang login

### Should Have (V3)
- Penanganan error saat login gagal
- Fallback avatar jika foto Google gagal dimuat

### MVP Core Flow (V3)

Pengunjung masuk sebagai publik → hanya bisa melihat arsip. Pengurus menekan tombol "Masuk dengan Google" → otorisasi akun Google berhasil → UI menampilkan nama/avatar → menu unggah terbuka → saat mengunggah, ID pengurus otomatis tertaut ke laporan.

### MVP Success Criteria (V3)
- [ ] Pengurus berhasil login menggunakan akun Google dan profilnya tersimpan di database.
- [ ] Pengunjung (publik) tidak dapat memaksa masuk ke rute `/unggah` atau melihat tombol hapus.
- [ ] Endpoint API menolak permintaan (menghasilkan 401 Unauthorized) jika tidak ada sesi yang valid.

---

## Roadmap Fase Berikutnya (Referensi)

| Fase | Fokus |
|---|---|
| V4 | Ekstraksi data (vision-LLM untuk gambar, parsing untuk PDF/Excel) |
| V5 | Financial intelligence: tren, tracking donatur, visualisasi |