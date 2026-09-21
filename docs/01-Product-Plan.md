# 01. Product Plan

## Product Vision

Mengubah arsip laporan keuangan masjid dari sekadar salinan visual pasif menjadi **platform manajemen keuangan masjid yang cerdas** — mampu membaca, mengekstrak, dan menganalisis data dari laporan yang diunggah (foto, PDF, Excel), sehingga pengurus tidak hanya menyimpan riwayat, tapi juga mendapatkan wawasan (tren, tracking donatur, visualisasi keuangan) tanpa perlu mencatat ulang data secara manual.

## Product Goal

1. **Mempertahankan** kemudahan alur kerja bendahara yang sudah terbukti di MVP (foto/unggah laporan tanpa mengubah cara pencatatan manual sehari-hari)
2. **Menambahkan lapisan kecerdasan**: sistem mengekstrak data mentah dari file yang diunggah (vision-LLM untuk gambar, parsing untuk PDF/Excel), sehingga data laporan tidak lagi sekadar "gambar", tapi juga **data terstruktur** yang bisa diolah — dengan tetap membuka ruang **verifikasi manual** oleh bendahara sebelum data dianggap final
3. **Menyediakan wawasan**: tren pemasukan/pengeluaran dari waktu ke waktu, tracking kontribusi donatur, visualisasi (grafik/dashboard)
4. **Mendukung banyak pengguna** dengan peran berbeda (bukan lagi 1 kredensial bersama), termasuk manajemen profil pengurus
5. Menjaga potensi **skalabilitas & monetisasi** — desain data & arsitektur mempertimbangkan kemungkinan dipakai lebih dari satu masjid di masa depan (multi-tenant), meski belum jadi prioritas fase awal

## Target User

- **Bendahara** (primary): mencatat transaksi manual di buku kas, menyusun laporan mingguan, memasang di mading, dan mengunggah salinannya ke sistem; kini juga mendapat manfaat dari wawasan otomatis (tren, ringkasan)
- **Pengurus DKM lain**: bisa melihat dashboard/tren tanpa harus menelusuri laporan satu per satu; turut membagikan laporan ke jemaah lewat kanal komunikasi (WhatsApp)
- **(Potensial, jangka panjang)** Donatur/jemaah: kemungkinan akses terbatas untuk transparansi (belum masuk scope dekat)

## Problem

- Riwayat transaksi keuangan DKM sebelumnya hanya tersimpan di buku kas fisik yang terus menumpuk, menyulitkan pencarian laporan lama dan berisiko hilang/rusak
- Data di dalam laporan (angka pemasukan/pengeluaran, nama donatur) tidak bisa dianalisis karena masih berupa gambar/scan, bukan data terstruktur
- Pengurus tidak punya cara cepat melihat tren keuangan dari waktu ke waktu tanpa membuka & menjumlahkan laporan manual satu-satu
- Sistem kredensial bersama (1 akun untuk semua) tidak mencerminkan struktur organisasi yang sebenarnya (ada peran berbeda: Bendahara 1, Bendahara 2, Pengurus lain)

## Value Proposition

Bendahara tetap bekerja seperti biasa (mencatat manual, lalu unggah foto/file laporan), tapi sistem sekarang bekerja lebih keras di baliknya — mengarsipkan laporan secara aman, membantu membaca angka darinya lewat vision-LLM, dan menyajikannya sebagai data yang bisa dicari & dianalisis. Bendahara tetap memegang kendali penuh: hasil ekstraksi ditinjau dan dikonfirmasi secara manual sebelum dihitung dalam insight (tren, grafik, ringkasan donatur) — sehingga otomatisasi mempercepat pekerjaan tanpa mengorbankan akurasi.

## Strategi Peluncuran (Bertahap)

| Fase | Fokus | Status |
|---|---|---|
| **V1** | Arsip visual dasar: unggah foto, arsip per periode, cari, detail, auth sederhana | ✅ Selesai |
| **V2** | Dukungan multi-format file per laporan (gambar, PDF, Excel); satu laporan bisa punya beberapa lampiran | ✅ Selesai |
| **V3** | Autentikasi & Manajemen Pengguna (SSO): Login Google OAuth, keamanan rute, role-based access | ✅ Selesai |
| **V4** | Ekstraksi data: vision-LLM untuk gambar (dipicu manual oleh bendahara), parsing terstruktur untuk PDF/Excel → data transaksi, saldo awal/akhir, rekonsiliasi buku kas, dan verifikasi manual | ✅ Selesai |
| **V5** | Financial intelligence: tren keuangan, tracking donatur, visualisasi/dashboard | Direncanakan |
| **V6 (opsional, jangka panjang)** | Multi-tenant — mendukung lebih dari satu masjid, potensi monetisasi | Belum diprioritaskan |

## Out of Scope

- Integrasi pembayaran online / donasi digital langsung — belum masuk scope manapun saat ini
- Multi-masjid / multi-tenant — tetap out of scope untuk fase dekat, dipertimbangkan di V6

## Success Metrics

| Metric | Target |
|---|---|
| Laporan mingguan berhasil diunggah per bulan | Sesuai jumlah laporan Jumat aktual DKM |
| Waktu pencarian arsip lama | Berkurang dibanding cara manual di buku |
| Adopsi sistem login mandiri (V3) | 100% pengurus aktif menggunakan akun Google pribadi/DKM untuk unggah laporan |
| Akurasi ekstraksi data vision-LLM (V4) | Cukup akurat untuk angka besar, koreksi manual tetap dimungkinkan lewat alur verifikasi sebelum data dianggap final |
| Adopsi fitur dashboard/tren oleh pengurus (V5) | Dievaluasi lewat user testing |

## Timeline

| Milestone | Status |
|---|---|
| V1 & V2 — MVP & Multi-format | ✅ Selesai, di-deploy ke Vercel |
| V3 — Google SSO Auth | ✅ Selesai (branch `feature/v3-auth`) |
| V4 — Ekstraksi Data (Vision-LLM) & Verifikasi | ✅ Selesai (branch `feature/v4-extraction`) |
| V5 | Belum mulai |
