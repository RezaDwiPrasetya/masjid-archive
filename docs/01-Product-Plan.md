# 01. Product Plan

## Product Vision

Mengubah arsip laporan keuangan masjid dari sekadar salinan visual pasif menjadi **platform manajemen keuangan masjid yang cerdas** — mampu membaca, mengekstrak, dan menganalisis data dari laporan yang diunggah (foto, PDF, Excel), sehingga pengurus tidak hanya menyimpan riwayat, tapi juga mendapatkan wawasan (tren, tracking donatur, visualisasi keuangan) tanpa perlu mencatat ulang data secara manual.

## Product Goal

1. **Mempertahankan** kemudahan alur kerja bendahara yang sudah terbukti di MVP (foto/unggah laporan tanpa mengubah cara pencatatan manual sehari-hari)
2. **Menambahkan lapisan kecerdasan**: sistem mengekstrak data mentah dari file yang diunggah (vision-LLM untuk gambar, parsing untuk PDF/Excel), sehingga data laporan tidak lagi sekadar "gambar", tapi juga **data terstruktur** yang bisa diolah — dengan tetap membuka ruang **verifikasi manual** oleh bendahara sebelum data dianggap final
3. **Menyediakan wawasan**: tren pemasukan/pengeluaran dari waktu ke waktu, tracking kontribusi donatur, visualisasi (grafik/dashboard) — ditampilkan secara terbuka ke jemaah, sejalan dengan budaya transparansi yang sudah ada lewat mading fisik
4. **Mendukung banyak pengguna** dengan peran berbeda (bukan lagi 1 kredensial bersama), termasuk manajemen profil pengurus
5. Menjaga potensi **skalabilitas & monetisasi** — desain data & arsitektur mempertimbangkan kemungkinan dipakai lebih dari satu masjid di masa depan (multi-tenant), meski belum jadi prioritas fase awal

## Target User

- **Bendahara** (primary): mencatat transaksi manual di buku kas, menyusun laporan mingguan, memasang di mading, dan mengunggah salinannya ke sistem; kini juga mendapat manfaat dari wawasan otomatis (tren, ringkasan)
- **Pengurus DKM lain**: bisa melihat dashboard/tren tanpa harus menelusuri laporan satu per satu; turut membagikan laporan ke jemaah lewat kanal komunikasi (WhatsApp)
- **Donatur/jemaah**: sejak V5, memiliki akses langsung ke dashboard tren keuangan dan riwayat donasi tanpa perlu login — kelanjutan digital dari budaya transparansi mading fisik yang sudah berjalan sejak awal

## Problem

- Riwayat transaksi keuangan DKM sebelumnya hanya tersimpan di buku kas fisik yang terus menumpuk, menyulitkan pencarian laporan lama dan berisiko hilang/rusak
- Data di dalam laporan (angka pemasukan/pengeluaran, nama donatur) tidak bisa dianalisis karena masih berupa gambar/scan, bukan data terstruktur
- Pengurus tidak punya cara cepat melihat tren keuangan dari waktu ke waktu tanpa membuka & menjumlahkan laporan manual satu-satu
- Sistem kredensial bersama (1 akun untuk semua) tidak mencerminkan struktur organisasi yang sebenarnya (ada peran berbeda: Bendahara 1, Bendahara 2, Pengurus lain)
- Transparansi ke jemaah selama ini terbatas pada mading fisik yang cuma bisa dilihat sesaat di lokasi — tidak ada cara jemaah melihat tren keuangan masjid dari waktu ke waktu

## Value Proposition

Bendahara tetap bekerja seperti biasa (mencatat manual, lalu unggah foto/file laporan), tapi sistem sekarang bekerja lebih keras di baliknya — mengarsipkan laporan secara aman, membantu membaca angka darinya lewat vision-LLM, dan menyajikannya sebagai data yang bisa dicari & dianalisis. Bendahara tetap memegang kendali penuh: hasil ekstraksi ditinjau dan dikonfirmasi secara manual sebelum dihitung dalam insight (tren, grafik, ringkasan donatur) — sehingga otomatisasi mempercepat pekerjaan tanpa mengorbankan akurasi. Insight yang terkumpul kemudian ditampilkan terbuka lewat dashboard publik, memperluas jangkauan transparansi yang selama ini terbatas pada mading fisik.

## Strategi Peluncuran (Bertahap)

| Fase | Fokus | Status |
|---|---|---|
| **V1** | Arsip visual dasar: unggah foto, arsip per periode, cari, detail, auth sederhana | ✅ Selesai |
| **V2** | Dukungan multi-format file per laporan (gambar, PDF, Excel); satu laporan bisa punya beberapa lampiran | ✅ Selesai |
| **V3** | Autentikasi & Manajemen Pengguna (SSO): Login Google OAuth, keamanan rute, role-based access | ✅ Selesai |
| **V4** | Ekstraksi data: vision-LLM untuk gambar (dipicu manual oleh bendahara), data mentah tersimpan sebagai `Transaction`, menunggu verifikasi manual sebelum final | ✅ Selesai |
| **V5** | Financial intelligence: tren keuangan (mingguan/bulanan), tracking & riwayat donatur, dashboard publik — seluruhnya dihitung hanya dari transaksi yang sudah terverifikasi | ✅ Selesai |
| **V6** | Advanced Transparency & Multimodal Data Pipeline: Rincian transparansi infaq anonim (audit kotak amal/hamba Allah), ekstraksi lampiran PDF via vision-LLM, direct parser spreadsheet kas Excel (.xlsx) | 🟡 In Progress |

## Out of Scope

- Integrasi pembayaran online / donasi digital langsung — belum masuk scope manapun saat ini
- Multi-masjid / multi-tenant — tetap out of scope untuk fase dekat, diprioritaskan eksklusif untuk Masjid Al-Luqman

## Success Metrics

| Metric | Target |
|---|---|
| Laporan mingguan berhasil diunggah per bulan | Sesuai jumlah laporan Jumat aktual DKM |
| Waktu pencarian arsip lama | Berkurang dibanding cara manual di buku |
| Adopsi sistem login mandiri (V3) | 100% pengurus aktif menggunakan akun Google pribadi/DKM untuk unggah laporan |
| Akurasi ekstraksi data vision-LLM (V4 & V6) | Cukup akurat untuk angka besar, koreksi manual tetap dimungkinkan lewat alur verifikasi sebelum data dianggap final |
| Adopsi fitur dashboard/tren oleh pengurus & jemaah (V5) | Dievaluasi lewat user testing setelah dashboard publik dirilis |
| Transparansi donasi anonim & ragam dokumen (V6) | Jemaah dapat melihat rincian riwayat infaq kotak amal/anonim; bendahara dapat mengekstrak PDF & mengimpor Excel |

## Timeline

| Milestone | Status |
|---|---|
| V1 & V2 — MVP & Multi-format | ✅ Selesai, di-deploy ke Vercel |
| V3 — Google SSO Auth | ✅ Selesai (branch `feature/v3-auth`) |
| V4 — Ekstraksi Data (Vision-LLM) | ✅ Selesai |
| V5 — Financial Intelligence (Dashboard Publik) | ✅ Selesai |
| Redesign UI Batch 1, 2, 3 | ✅ Selesai, di-merge ke `main` |
| V6 — Advanced Transparency & Multimodal Pipeline | ✅ Selesai (Issue #054-#057) |

