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

## V5 — Financial Intelligence (✅ Selesai)

### MVP Objective (V5)

Membuktikan bahwa data transaksi terverifikasi yang sudah terkumpul dari V4 bisa diubah jadi wawasan yang berguna: tren keuangan dari waktu ke waktu dan riwayat kontribusi donatur — ditampilkan terbuka ke publik sebagai kelanjutan digital dari budaya transparansi mading fisik.

### Must Have (V5)
- Dashboard tren keuangan publik dengan toggle "Mingguan"/"Bulanan" (F-014), pakai Recharts/shadcn-ui Charts
- Halaman Daftar Donatur publik: nama, total kontribusi terverifikasi, jumlah kali menyumbang (F-015)
- Halaman Detail Donatur: riwayat transaksi individual dengan tautan ke laporan asalnya
- Kartu agregat "Infaq Anonim" terpisah untuk donasi tanpa nama (F-015)
- Field nama donatur (pre-filled dari ekstraksi) yang bisa diedit bendahara di panel review sebelum konfirmasi (F-016)
- Fuzzy matching otomatis (normalisasi + hapus prefix gelar) saat transaksi dikonfirmasi
- Seluruh perhitungan/tampilan HANYA dari `Transaction.isVerified = true`, tanpa pengecualian

### Should Have (V5)
- Indikator loading/skeleton saat dashboard publik memuat data (karena diakses tanpa auth, kemungkinan traffic lebih variatif)
- Rentang dinamis dashboard: dimulai dari laporan/transaksi pertama yang ada di database hingga maksimal 12 periode (menghindari grafik kosong berlebih di tahap awal)
- Pengelompokan mingguan berbasis `Report.reportDate` (hari Jumat) agar selaras 100% dengan lembar laporan kas fisik

### Could Have (V5)
- Export data tren jadi gambar/PDF untuk dibagikan manual ke grup WA (di luar unduh laporan asli yang sudah ada)
- Pencarian/filter nama donatur di halaman Daftar Donatur (kalau daftarnya sudah cukup panjang)
- Banner informatif non-intrusive bahwa data masih tahap pengumpulan awal (sementara)

### Not Now (V5 — tetap di luar scope, dibahas terpisah nanti)
- UI penggabungan manual `Donor` yang lolos dari fuzzy matching (mis. beda ejaan total, "Kosasih" vs "Kosasi") — untuk V5 awal, penggabungan seperti ini belum ada alur UI-nya; dicatat sebagai keterbatasan yang diterima
- Proyeksi/prediksi kas ke depan (forecasting) — murni tren historis dulu, bukan prediksi
- Filter dashboard berdasarkan rentang tanggal custom (selain toggle Mingguan/Bulanan bawaan) — bisa jadi peningkatan lanjutan
- Notifikasi/alert otomatis (mis. WhatsApp) saat tren pengeluaran melonjak — di luar scope, murni tampilan pasif dulu

### MVP Core Flow (V5)

**Alur bendahara (assign & verifikasi donatur):** Saat mengonfirmasi transaksi bertipe pemasukan di panel review (F-016, kelanjutan dari V4) → bendahara cek/edit nama donatur yang pre-filled dari ekstraksi → tekan "Konfirmasi" → sistem otomatis mencocokkan ke `Donor` yang sudah ada atau membuat baru. Jika terjadi salah konfirmasi, bendahara dapat membatalkan verifikasi atau mengoreksi nama donatur pada transaksi terverifikasi tanpa merusak integritas angka kas.

**Alur publik (jemaah):** Buka halaman dashboard tanpa login → lihat grafik tren pemasukan/pengeluaran mingguan (Jumat) atau bulanan → buka halaman Daftar Donatur → lihat total kontribusi tiap donatur atau klik untuk riwayat detail → lihat kartu "Infaq Anonim" untuk total donasi tanpa nama.

### MVP Success Criteria (V5)
- [x] Dashboard tren dapat diakses publik tanpa login dan menampilkan data yang benar (cocok dengan penjumlahan manual dari laporan yang sudah diverifikasi)
- [x] Toggle Mingguan/Bulanan berfungsi dan mengubah agregasi data secara benar
- [x] Minimal satu donatur berhasil ter-*match* secara otomatis ke entity `Donor` yang sama meski ditulis dengan variasi nama berbeda (mis. "Bpk Kosasih" vs "Bapak Kosasih")
- [x] Donasi anonim ("Hamba Allah") tidak pernah muncul sebagai profil donatur individual, hanya sebagai agregat
- [x] Tidak ada satu pun transaksi `isVerified = false` yang bocor ke dashboard publik maupun halaman donatur, di UI maupun lewat pemanggilan API langsung

---

## V6 — Advanced Transparency & Multimodal Data Pipeline (Selesai)

### MVP Objective (V6)
Menyempurnakan transparansi keuangan hingga ke audit transaksi infaq tanpa nama, serta mengatasi kesenjangan pipeline data dengan mengaktifkan ekstraksi dokumen PDF (via multimodal vision-LLM) dan impor langsung spreadsheet kas Excel (.xlsx) tanpa ketergantungan OCR.

### Must Have (V6)
- **Rincian Transparansi Infaq Anonim (F-018, Issue #054)**: Modal/drawer publik interaktif pada kartu "Infaq Anonim" di `/donatur`, menampilkan daftar lengkap transaksi terverifikasi tanpa nama profil (tanggal, nominal, deskripsi sumber, tautan laporan asal).
- Seluruh data rincian infaq anonim MUTLAK hanya mengambil transaksi `isVerified = true`.
- Tidak ada entitas profil `Donor` baru yang dibuat untuk donasi anonim.

### Should Have (V6)
- **Ekstraksi Dokumen Kas PDF (F-019, Issue #055)**: Dukungan pengiriman buffer PDF langsung ke Google Gemini multimodal API di `/api/attachments/:id/extract` serta pratinjau tersemat (viewer) di halaman detail laporan.
- **Direct Parser Excel Kas (F-020, Issue #056)**: Parser spreadsheet (.xlsx/.xls) di server yang membaca baris transaksi kas secara deterministik (100% akurasi numerik) dengan fallback AI untuk struktur tabel non-standar.
- **Ekspor & Unduh Rekapitulasi Kas (F-021, Issue #057)**: Fitur ekspor dan unduh rekapitulasi pembukuan kas mingguan dan bulanan dalam format dokumen cetak PDF dan spreadsheet Excel untuk transparansi fisik DKM.

### MVP Core Flow (V6 — Infaq Anonim & Ekspor)
1. Jemaah membuka halaman `/donatur` → melihat kartu KPI "Infaq Anonim" → menekan tombol "Lihat Rincian" → dialog modal terbuka menampilkan tabel riwayat transaksi → jemaah dapat mengklik baris untuk membuka laporan pekanan terkait.
2. Jemaah/Pengurus membuka halaman detail laporan kas atau dashboard → menekan tombol "Cetak / PDF" atau "Unduh Excel" → memperoleh dokumen rekapitulasi kas resmi DKM Al-Luqman siap tempel di papan mading fisik atau diarsipkan dalam spreadsheet.

### MVP Success Criteria (V6)
- [x] Jemaah dapat membuka dialog rincian Infaq Anonim dan melihat riwayat transaksi terverifikasi.
- [x] Total nominal dalam modal rincian 100% klop dengan total pada kartu agregat Infaq Anonim.
- [x] Transaksi `isVerified = false` tidak pernah muncul di modal rincian atau berkas ekspor.
- [x] Desain konsisten dengan tema mading kas masjid (tabular-nums, font Outfit, border outline-variant).
- [x] Dokumen PDF dapat dipratinjau langsung di halaman detail laporan dan diekstrak via Gemini multimodal.
- [x] Berkas spreadsheet Excel (.xlsx/.xls) dapat diimpor langsung secara tabular ke panel review transaksi kas.
- [x] Rekapitulasi kas mingguan dapat diunduh format Excel (.xlsx) dan dicetak format A4 formal kop surat DKM.
- [x] Rekapitulasi kas bulanan dapat diekspor ke Excel (.xlsx) dan dicetak format A4 formal via dialog dashboard.

---

## 8. Pemeliharaan & Polishing (Mobile Responsiveness & Touch Ergonomics — Issue #058)

### Objective
Menyempurnakan kenyamanan penggunaan aplikasi pada perangkat smartphone (mobile portrait 360px - 430px) bagi jemaah dan pengurus DKM, mengatasi tumpang-tindih teks pada grafik mingguan, serta memastikan ergonomi navigasi sentuh (touch targets) yang prima tanpa menambah kompleksitas arsitektur baru.

### Ruang Lingkup Perbaikan (Issue #058)
- **Dashboard Chart Mobile Optimization (F-022)**:
  - Meniadakan tumpang tindih teks nominal uang pada grafik batang mingguan di layar `< 640px`.
  - Mengaktifkan interaktivitas sentuh (touch tooltip) untuk membaca nominal per batang secara jelas.
  - Merampingkan sumbu Y (Y-Axis) dari 80px ke 52px pada layar sempit untuk memaksimalkan visualisasi batang.
- **Mobile Bottom Navigation Ergonomics (F-022)**:
  - Penyesuaian padding dan ukuran label menu navigasi bawah (bottom bar) agar tidak berdesakan dan tidak terpotong pada smartphone kompak (≤ 380px), baik untuk jemaah (5 item) maupun admin (6 item).
  - Standarisasi tap target minimal 44×44px sesuai standar aksesibilitas WCAG.
- **Responsive Modals & Dialogs**:
  - Dialog rincian infaq anonim dan dialog ekspor bulanan menyesuaikan batas layar mobile (`p-4 sm:p-6`) dengan area tombol yang mudah dijangkau satu jempol.

### Kriteria Selesai (Selesai 100%)
- [x] Grafik tren kas mingguan di dashboard mobile bersih tanpa tabrakan teks label di atas batang.
- [x] Touch tooltip pada grafik responsif dan informatif saat disentuh jemaah via smartphone.
- [x] Seluruh menu navigasi bawah terbaca jelas tanpa teks terpotong di layar 360px.
- [x] Dialog dan modal terbuka proporsional dan dapat ditutup/dioperasikan dengan nyaman di mobile.
- [x] Lolos pengujian visual mobile portrait di browser developer tools dan perangkat riil.
---

## V7 — Expense Transparency (Rekap Pengeluaran Per Kategori)

### MVP Objective (V7)

Melengkapi simetri transparansi keuangan masjid. Jika V5 menjawab *"Siapa yang menyumbang?"* (halaman Donatur), maka V7 menjawab *"Uang kas masjid digunakan untuk apa saja?"* dengan halaman publik khusus pengeluaran berdasarkan kategori — sehingga jemaah bisa mengaudit penggunaan dana masjid secara menyeluruh dari dua sisi: penerimaan dan pengeluaran.

### Must Have (V7)
- Tambah field `category` (nullable String) pada model `Transaction` via migration Prisma additive (F-023)
- Dropdown pemilihan kategori di `TransactionReviewPanel` untuk transaksi bertipe `pengeluaran` — tersembunyi untuk `pemasukan`
- Endpoint publik `GET /api/expenses` — agregasi total pengeluaran per kategori (hanya `isVerified=true`, `type=pengeluaran`)
- Endpoint publik `GET /api/expenses/transactions` — daftar rincian transaksi pengeluaran, dengan filter opsional per kategori
- Halaman publik `/pengeluaran` yang bisa diakses tanpa login, menampilkan:
  - Kartu KPI: total pengeluaran kumulatif & jumlah transaksi
  - Breakdown visual nominal per kategori (sorted terbesar ke terkecil)
  - Tabel rincian transaksi dengan filter per kategori dan link ke laporan asal

### Should Have (V7)
- Tombol edit kategori pada transaksi pengeluaran yang sudah terverifikasi (untuk pengguna login), tanpa mengubah `isVerified` atau data finansial
- Filter rentang waktu (bulan/tahun) pada halaman `/pengeluaran`
- Badge kategori yang konsisten secara visual (warna berbeda per kategori) di panel review & halaman publik

### Not Now (V7 — dibahas nanti)
- Manajemen kategori dinamis (tambah/ubah/hapus kategori oleh admin) — set kategori tetap sudah cukup untuk kebutuhan DKM Al-Luqman
- Auto-kategorisasi pengeluaran via AI/Gemini berdasarkan deskripsi transaksi — bisa menjadi enhancement V8
- Budget/anggaran per kategori & notifikasi jika melebihi plafon — di luar scope operasional saat ini
- Ekspor rekap pengeluaran per kategori ke Excel/PDF — bisa ditambahkan setelah halaman stabil

### MVP Core Flow (V7)

**Alur bendahara (kategorisasi):** Di panel review laporan → klik transaksi bertipe `pengeluaran` → pilih kategori dari dropdown (Operasional, Honor, Sosial, dsb.) sebelum atau setelah konfirmasi → kategori tersimpan bersama data transaksi.

**Alur publik (jemaah):** Buka halaman `/pengeluaran` tanpa login → lihat total pengeluaran & breakdown per kategori → klik filter kategori untuk mempersempit daftar → klik link laporan pada baris transaksi untuk melihat bukti fisik buku kas.

### MVP Success Criteria (V7)
- [x] Dropdown kategori muncul di panel review untuk transaksi pengeluaran
- [x] Halaman `/pengeluaran` dapat diakses publik dan menampilkan data yang akurat
- [x] Total pengeluaran per kategori konsisten dengan penjumlahan manual dari laporan
- [x] Transaksi `isVerified=false` tidak pernah bocor ke halaman publik ini
- [x] Transaksi lama tanpa kategori ditampilkan dengan label "Tidak Dikategorikan" tanpa error

---

## V8 — Filter Periode Waktu & Analisis Keuangan Berkala (Selesai)

### MVP Objective (V8)
Menyediakan kemampuan analisis keuangan berkala (bulanan dan tahunan) pada halaman publik Donatur (`/donatur`) dan Pengeluaran (`/pengeluaran`) melalui pemfilteran waktu yang responsif dan terpadu, sehingga data keuangan tetap relevan seiring akumulasi arsip tahunan.

### Must Have (V8)
- Komponen bar filter periode universal (`PeriodFilterBar`) dengan selector Tahun, Bulan, dan tombol preset ("Semua Waktu", "Tahun Ini", "Bulan Ini")
- Ekstensi query param `year` dan `month` pada endpoint donatur (`/api/donors`, `/api/donors/anonymous/transactions`) dan pengeluaran (`/api/expenses`, `/api/expenses/transactions`)
- Reaktivitas instan seluruh indikator KPI, progress bar proporsi pengeluaran, daftar peringkat donatur, dan tabel mutasi
- Pembatasan data mutlak hanya untuk transaksi `isVerified = true`

### MVP Success Criteria (V8)
- [x] Jemaah dapat memilih filter Tahun dan Bulan di halaman `/pengeluaran` dan angka KPI + tabel berubah sesuai periode.
- [x] Jemaah dapat memilih filter Tahun dan Bulan di halaman `/donatur` dan kartu donatur + peringkat donatur berubah dinamis.
- [x] Tombol preset "Semua Waktu", "Tahun Ini", dan "Bulan Ini" bekerja seketika.
- [x] Tampilan fallback kosong ramah pengguna jika periode terpilih belum memiliki catatan kas.

---

## V9 — Filter Periode Fiskal & Ekspor Terpadu Tanpa Modal (Selesai)

### MVP Objective (V9)
Menghadirkan kendali audit fiskal presisi pada dashboard utama dengan memindahkan filter periode langsung ke toolbar ringkasan kas, menyajikan grafik tren mingguan/tahunan yang teratur di seluruh ukuran layar, serta menyediakan ekspor dokumen kas (Cetak A4 Mading, PDF resmi, Excel) tanpa hambatan modal dialog (Zero-Modal Export).

### Must Have (V9)
- Selector Bulan dan Tahun terintegrasi di toolbar dashboard utama berdampingan dengan toggle mode grafik
- Mode Mingguan memplot pekan-pekan (Jumat) spesifik di bulan & tahun terpilih
- Mode Tahunan menampilkan 12 bulan penuh di desktop dan toggle Semester 1 & 2 di mobile (< 768px)
- Tombol Cetak A4, Unduh PDF, dan Unduh Excel terpasang langsung di toolbar dashboard untuk ekspor instan
- Penyelarasan kartu KPI ringkasan kas (Pemasukan, Pengeluaran, Arus Kas Bersih) dengan periode terpilih

### MVP Success Criteria (V9)
- [x] Dashboard toolbar menyediakan selector Bulan & Tahun yang menyaring grafik dan kartu KPI secara terpadu.
- [x] Mode mingguan memplot Jumat-Jumat presisi sesuai kalender bulan terpilih.
- [x] Mode tahunan mobile menyajikan toggle Semester 1 dan 2 agar tampilan grafik tetap proporsional dan tidak bertumpuk.
- [x] Tombol ekspor Cetak A4, Unduh PDF, dan Unduh Excel dapat diklik langsung tanpa popup dialog.
- [x] Format judul tab peramban Shopee-style dan ikon brand AppShell selaras 100% dengan favicon resmi masjid.

---

## V10 — Cetak & Ekspor Kas Tahunan Penuh, Perapihan Toolbar & Lampiran PDF (Selesai)

### MVP Objective (V10)
Menyempurnakan alur kerja pelaporan keuangan dengan menyediakan dokumen cetak dan ekspor kas tahunan penuh (12 bulan) saat mode tahunan aktif di dashboard, merampingkan toolbar dashboard dengan menghapus tombol PDF yang redundan dan menyelaraskan penamaan aksi menjadi "Cetak Laporan", serta menyempurnakan Lampiran PDF resmi menjadi multi-halaman lega dengan word-wrap teks penuh dan border pemisah yang tajam.

### Must Have (V10)
- Tombol aksi di dashboard toolbar disederhanakan menjadi 2 tombol: `Cetak Laporan` dan `Excel`.
- Tombol `Cetak Laporan` secara cerdas mengarahkan ke halaman cetak bulanan (`/laporan/cetak/bulanan`) jika mode Mingguan aktif, atau ke halaman cetak tahunan (`/laporan/cetak/tahunan`) jika mode Tahunan aktif.
- Halaman cetak tahunan (`app/laporan/cetak/tahunan/page.tsx`) menyajikan data rekapitulasi mutasi 12 bulan dan seluruh transaksi kas tahun tersebut dengan kop surat DKM Al-Luqman.
- Endpoint ekspor PDF tahunan (`/api/reports/export/yearly/pdf`) dan Excel tahunan (`/api/reports/export/yearly/excel`).
- Lampiran PDF multi-halaman lega dengan paginasi otomatis, word-wrap tanpa pemotongan "…", header tabel berulang, baris TOTAL tunggal, dan border grid tajam (#c2c9bb).

### MVP Success Criteria (V10)
- [x] Toolbar dashboard bersih tanpa tombol direct download PDF yang membingungkan.
- [x] Saat mode Tahunan dipilih, mengklik "Cetak Laporan" membuka laporan kas 1 tahun penuh (bukan hanya bulan tertentu).
- [x] Tombol Excel mengekspor spreadsheet tahunan saat mode Tahunan aktif.
- [x] Dokumen tahunan menyajikan rekap per bulan (Jan–Des), total pemasukan, total pengeluaran, saldo awal tahun, dan saldo akhir tahun.
- [x] Dokumen PDF tahunan memiliki arsitektur 2-bagian: Halaman 1 sebagai Resume Eksekutif Mading lengkap dengan tanda tangan, Halaman 2+ sebagai Lampiran Mutasi Transaksi Kas (Issue #070).
- [x] Tombol aksi di pratinjau cetak disatukan menjadi 1 tombol tunggal "Cetak Laporan" bebas dari tombol kedua yang redundan (Issue #071).
- [x] Lampiran PDF terpaginasi otomatis multi-halaman tanpa memaksakan 35+ baris ke satu lembar, dengan teks uraian/donatur membungkus rapi (word-wrap) tanpa teks terpotong "…" (Issue #072).
- [x] Garis pemisah baris tabel lampiran PDF (#c2c9bb) tampil jelas dan konsisten tanpa tertimpa latar belakang zebra striping (Issue #072).


