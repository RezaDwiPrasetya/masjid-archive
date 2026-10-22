# 03. User Persona

## Primary Persona

### Name

Bapak Kosasih — Bendahara 2 DKM Masjid Al-Luqman

### Profile

- Age: Dewasa, pengurus aktif DKM
- Occupation: Bendahara 2, mengelola pencatatan keuangan mingguan masjid
- Location/context: Masjid Al-Luqman, Kel. Soklat, Kec. Subang, Kab. Subang
- Experience level: Terbiasa pencatatan manual di buku kas, belum tentu terbiasa dengan aplikasi digital

### Goals

1. Mencatat transaksi keuangan masjid secara rutin dan rapi setiap Jumat
2. Menjaga laporan keuangan tetap aman dan bisa dipertanggungjawabkan
3. Memudahkan pencarian laporan lama saat dibutuhkan

### Pain Points

1. Buku kas fisik menumpuk dan sulit ditelusuri untuk periode lama
2. Tidak ada cadangan digital — takut buku hilang/rusak
3. Pengurus lain sering harus menunggu/minta bantuan langsung untuk melihat arsip

### Current Behavior

Mencatat semua transaksi secara manual di buku kas fisik setiap Jumat, menyimpan buku tersebut di masjid tanpa salinan digital.

### Needs

1. Cara cepat mengarsipkan laporan mingguan yang sudah dicatat, tanpa menambah beban kerja pencatatan
2. Sistem pengelompokan otomatis berdasarkan periode (tahun/bulan/minggu)
3. Akses yang mudah dibagikan ke pengurus lain tanpa harus membawa buku fisik

### Quote

> "Kalau ada yang nanya laporan minggu-minggu lalu, saya harus buka-buka buku satu-satu."

## Secondary Persona

### Name

Bapak Cecep — Bendahara 1 DKM Masjid Al-Luqman

Terlibat sebagai pengguna yang turut mengakses dan memverifikasi arsip laporan, meski peran pencatatan utama ada di Bendahara 2.

## Tertiary Persona (Publik & Jamaah)

### Name

Pak Hendra (52 th) & Ibu Siti (46 th) — Jamaah & Donatur Warga Kel. Soklat

### Profile

- Jamaah rutin Masjid Al-Luqman, sering berinfaq subuh, transfer donasi pembangunan, atau infaq Jumat.
- Mengakses website melalui smartphone (WhatsApp group warga / link pengumuman DKM).
- Tidak memiliki kepentingan teknis pembukuan, murni mencari transparansi dan kepastian.

### Goals

1. Ingin mengetahui saldo kas masjid terkini (Kas Operasional, Kas Pembangunan, Kas ZISWAF/Sosial) secara transparan dan mudah dipahami.
2. Ingin memastikan uang infaq/sedekah yang ditransfer sudah tercatat di pembukuan masjid tanpa harus bertanya langsung ke bendahara.
3. Mengetahui rekening resmi bank atas nama DKM Masjid Al-Luqman dan scan QRIS resmi untuk donasi.

### Pain Points

1. Bingung jika membuka website masjid langsung disuguhi tampilan dashboard admin yang penuh tabel akuntansi, tombol unggah nota, dan grafik analitik yang rumit.
2. Malas dan enggan jika harus login / daftar akun hanya untuk sekadar melihat laporan keuangan masjid.

### Needs

1. Halaman utama (Portal Publik) yang bersih, tenang, ramah, dan bebas dari kebingungan menu back-office.
2. Kolom pencarian sederhana: "Cek Riwayat Infaq" berdasarkan nama donatur atau kode resi.
3. Akses cepat unduh buletin laporan bulanan PDF resmi.

## Quaternary Persona (Calon Pengurus / Staf Baru)

### Name

Ustaz Fikri — Anggota Baru Bidang Sarpras & Kas DKM

### Profile

- Pengurus baru yang diminta membantu operasional bendahara.
- Mencoba login ke sistem melalui tombol "Akses Pengurus" dengan akun Google miliknya.

### Needs & Behavior

1. Setelah login pertama kali, status perannya belum ditetapkan (`role === null`).
2. Membutuhkan layar status yang jelas dan sopan: *"Akun Berhasil Masuk — Menunggu Verifikasi Hak Akses Administrator DKM"*, bukan dibiarkan bingung atau melihat tampilan yang sama persis dengan pengunjung umum.

