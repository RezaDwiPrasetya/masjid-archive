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

## V3 — Autentikasi SSO & Role-Based Access (Selesai)

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
- [x] Pengurus berhasil login menggunakan akun Google dan profilnya tersimpan di database.
- [x] Pengunjung (publik) tidak dapat memaksa masuk ke rute `/unggah` atau melihat tombol hapus.
- [x] Endpoint API menolak permintaan (menghasilkan 401 Unauthorized) jika tidak ada sesi yang valid.

---

## V4 — Ekstraksi Data (Vision-LLM) (Selesai)

### MVP Objective (V4)

Membuktikan bahwa foto laporan tulisan tangan bisa diubah jadi data transaksi terstruktur dan saldo kas lewat vision-LLM, dengan alur verifikasi manual yang membuat bendahara tetap merasa punya kendali penuh atas keakuratan data — bukan cuma "percaya mentah-mentah" hasil AI.

### Must Have (V4)
- Tombol "Ekstrak Data" pada lampiran gambar yang berstatus `not_extracted`/`failed` (F-011)
- Pemanggilan vision-LLM (`gemini-3.6-flash` dengan auto-fallback ke `gemini-3.5-flash` dan timeout 25s) yang mengembalikan data transaksi terstruktur serta saldo awal & saldo akhir kas
- Penyimpanan hasil mentah (`extractionRawResponse`) untuk audit/debug
- Daftar transaksi hasil ekstraksi berstatus "Menunggu Verifikasi" dan "Sudah Diverifikasi", dikelompokkan per lampiran (F-012)
- Kemampuan mengedit field transaksi sebelum konfirmasi
- Tombol "Konfirmasi" (menandai `isVerified = true`) dan "Hapus" untuk baris yang belum diverifikasi
- Indikator status ekstraksi per lampiran (`processing`/`done`/`failed`) yang terlihat jelas di UI
- Rekonsiliasi kas mingguan otomatis di sidebar detail laporan (F-013)
- Proteksi re-extract: transaksi yang sudah diverifikasi tidak terhapus otomatis saat ekstrak ulang

### Should Have (V4)
- Tombol "Coba Lagi" saat status `failed`, tanpa perlu reload halaman
- Pesan error yang ramah (bukan error teknis mentah) saat ekstraksi gagal
- Dialog konfirmasi modern (`AlertDialog`) saat menghapus laporan/lampiran yang memiliki transaksi terverifikasi (proteksi 409 Conflict)

### Could Have (V4)
- Highlight/badge jumlah transaksi yang berhasil terdeteksi per lampiran, sebelum dibuka detailnya

### Not Now (V4 — tetap di luar scope, dibahas terpisah nanti)
- Ekstraksi/parsing untuk lampiran PDF dan Excel — ditunda, fokus gambar dulu (lihat catatan scope di 09-Feature-Specification.md)
- Bulk-extract (proses banyak lampiran sekaligus) — satu attachment satu kali proses dulu, demi kesederhanaan & menjaga kuota API gratis
- Financial intelligence (tren, dashboard, donatur) — scope V5, baru relevan setelah data `Transaction` terkumpul & terverifikasi
- Multi-user role granular (Admin vs Guest dengan hak berbeda untuk verifikasi) — semua pengguna yang login diperlakukan setara dulu di V4

### MVP Core Flow (V4)

Bendahara membuka Detail Laporan → menekan "Ekstrak Data" pada lampiran gambar → menunggu status berubah dari `processing` ke `done` → transaksi hasil ekstraksi muncul dalam daftar "Menunggu Verifikasi" → bendahara meninjau tiap baris, mengoreksi jika perlu → menekan "Konfirmasi" satu per satu (atau "Hapus" jika baris tidak valid/duplikat) → saldo kas terhitung otomatis di ringkasan mingguan → transaksi yang sudah dikonfirmasi tersimpan sebagai data resmi, siap dipakai di V5.

### MVP Success Criteria (V4)
- [x] Bendahara berhasil mengekstrak minimal satu lampiran gambar dan mendapatkan transaksi dalam status "Menunggu Verifikasi"
- [x] Bendahara berhasil mengedit dan mengonfirmasi transaksi hingga `isVerified = true`
- [x] Kegagalan ekstraksi (mis. foto buram, API error/antrean) ditangani dengan auto-fallback dan pesan jelas, tidak membuat halaman error/crash
- [x] Transaksi yang belum diverifikasi tidak pernah tampak seolah-olah sudah final di UI manapun
- [x] Rekonsiliasi kas mencocokkan saldo kalkulasi dengan saldo fisik yang tertera di dokumen kas secara otomatis

---

## Roadmap Fase Berikutnya (Referensi)

| Fase | Fokus |
|---|---|
| V5 | Financial intelligence: tren, tracking donatur, visualisasi |
| V6 | Multi-tenant (opsional, jangka panjang) |
