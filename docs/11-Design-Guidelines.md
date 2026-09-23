# 11. Design Guidelines

## Design Principles

1. Simple — bendahara tidak selalu familiar dengan aplikasi digital
2. Clear — foto laporan dan tanggal harus mudah terbaca
3. Trustworthy — warna hijau tua & krem memberi kesan tenang dan dapat dipercaya (cocok untuk konteks keagamaan)
4. Accessible — kontras tinggi, ukuran teks cukup besar
5. **Berlapis (baru)** — setiap permukaan (halaman, kartu, sidebar) harus punya kedalaman visual yang jelas lewat kontras warna & bayangan halus, bukan menyatu jadi satu bidang datar

> **Kenapa poin 5 ditambahkan:** versi sebelumnya cuma punya satu warna latar (`#fafaf4`) untuk SEMUA permukaan — halaman, kartu, dan sidebar semua kelihatan sama. Ini yang membuat aplikasi terasa "datar/polos" meski secara fungsional sudah matang. Poin ini menegaskan bahwa kedalaman visual (bukan cuma warna) adalah bagian dari identitas "trustworthy" — institusi keuangan yang dipercaya biasanya punya presentasi visual yang solid, bukan cuma fungsional.

## Color Palette

| Token                     | Hex       | Penggunaan                                                        |
| ------------------------- | --------- | ------------------------------------------------------------------ |
| primary                   | `#154212` | Aksi utama, tombol, ikon aktif, sidebar item terpilih             |
| primary-container         | `#2d5a27` | Elemen pendukung primary (hover state tombol utama)                |
| primary-fixed             | `#bcf0ae` | Aksen terang, highlight ringan                                     |
| **surface**               | `#fafaf4` | Latar halaman TERLUAR (paling belakang, krem hangat) — **baru diberi nama eksplisit** |
| **surface-container**     | `#ffffff` | Latar kartu, sidebar, panel — **BEDA dari surface**, putih bersih supaya menonjol di atas krem |
| **surface-container-high**| `#f0f2ec` | Latar untuk elemen di dalam kartu yang perlu dibedakan lagi (baris tabel selang-seling, badge non-status) |
| on-surface                | `#1a1c19` | Teks utama                                                          |
| on-surface-variant        | `#42493e` | Teks sekunder (metadata, caption)                                   |
| error                     | `#ba1a1a` | Pesan error/validasi, badge "Pengeluaran"                          |
| **success**               | `#154212` | Badge "Terverifikasi", indikator positif (sama dengan primary — konsisten, bukan warna baru) |
| **warning**                | `#a15c00` | Badge "Belum Diverifikasi", "Model Cadangan", peringatan duplikat |
| outline-variant           | `#c2c9bb` | Border, pembatas antar section                                     |
| **outline**                | `#8a9382` | Border kartu/sidebar yang butuh definisi lebih tegas dari outline-variant |

**Aturan pemakaian (baru, wajib diikuti):**
- Halaman (`<body>`) SELALU pakai `surface` (`#fafaf4`)
- Kartu, sidebar, dialog, popover SELALU pakai `surface-container` (`#ffffff`) + border tipis `outline-variant` + shadow halus (lihat bagian Elevation)
- JANGAN pernah kartu dan halaman pakai warna yang sama — ini aturan yang dilanggar di implementasi saat ini dan jadi penyebab utama tampilan terasa datar

## Elevation (Bayangan) — Bagian Baru

Karena tidak ada `elevation`/shadow di versi sebelumnya, berikut standarnya:

| Level | box-shadow | Dipakai untuk |
|---|---|---|
| level-0 | none | Halaman itu sendiri |
| level-1 | `0 1px 2px rgba(26,28,25,0.06)` | Kartu biasa (laporan, donatur, transaksi) |
| level-2 | `0 2px 8px rgba(26,28,25,0.10)` | Sidebar, dialog, popover, dropdown |
| level-3 | `0 4px 16px rgba(26,28,25,0.14)` | Modal/AlertDialog konfirmasi (mis. hapus paksa, batalkan verifikasi) |

Gabungkan SELALU dengan border 1px `outline-variant` di bawah shadow — shadow saja di palet warna terang sering kurang terlihat, border memberi definisi tegas tambahan.

## Typography

- Font: **Outfit**
- Display (judul halaman besar): 48px / line-height 56px, weight 600 — **HANYA untuk 1 judul per halaman** (mis. "Arsip Laporan"), jangan dipakai berulang
- Headline (judul section): 28px / 36px, weight 500
- Headline kecil: 22px / 28px, weight 500
- Body besar: 20px / 32px, weight 400
- Body normal: 18px / 28px, weight 400
- Label (tombol, nav): 16px / 20px, weight 600
- Caption (metadata kecil): 14px / 20px, weight 400
- **Angka finansial besar (baru)**: 32px / 40px, weight 600, tabular-nums — dipakai KHUSUS untuk nominal uang di KPI card (mis. "Rp 1.380.000" di Dashboard) supaya angka besar tidak memakai skala Display yang terlalu masif untuk konteks kartu kecil

> **Catatan tabular-nums:** properti CSS `font-variant-numeric: tabular-nums` WAJIB dipakai di semua tempat yang menampilkan nominal uang berjajar (tabel transaksi, daftar donatur) — supaya digit-digit sejajar rapi secara vertikal, bukan lebar berbeda-beda per digit yang membuat angka terlihat "goyang" saat dibandingkan.

## Icons

- Material Symbols Outlined (spesifikasi awal) — implementasi memakai **Lucide Icons** sebagai padanan (lihat 12-Technical-Specification.md)
- **Ukuran konsisten (baru)**: 16px untuk ikon inline di teks/badge, 20px untuk ikon di tombol, 24px untuk ikon navigasi sidebar — JANGAN campur ukuran ikon dalam satu komponen yang sama

## Spacing

Unit dasar: 8px. Skala lengkap (baru, menggantikan 3-tingkat sebelumnya yang terlalu abstrak):

| Token | Nilai | Kapan dipakai |
|---|---|---|
| space-1 | 4px | Jarak antar ikon & teks dalam satu badge/label |
| space-2 | 8px | Jarak antar elemen sangat rapat (dalam satu baris data) |
| space-3 | 12px | Jarak antar field dalam satu form/kartu kecil |
| space-4 | 16px | **Padding internal kartu (default)**, jarak antar kartu dalam satu grid |
| space-6 | 24px | Padding internal kartu besar (KPI card, panel review), gutter antar kolom |
| space-8 | 32px | Jarak antar kelompok konten dalam satu section |
| space-12 | 48px | Jarak antar section besar (mis. antara header halaman dan konten utama) |
| space-16 | 64px | Jarak vertikal antara section-section utama di halaman panjang (Dashboard) |

**Aturan spesifik yang menjawab kritik "space antar elemen kebanyakan":**
- Kartu laporan foto (halaman Arsip): padding internal `space-4` (16px), BUKAN dibiarkan kartu jadi sangat lebar dengan foto kecil di tengah — foto harus mengisi penuh lebar kartu dikurangi padding
- Grid kartu (Arsip, Donatur, KPI Dashboard): gap antar kartu `space-4` (16px), maksimal 4 kolom di desktop, JANGAN biarkan 1 kartu sendirian memenuhi 1 baris penuh kalau lebar layar cukup untuk 2-3 kartu — pakai `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))` atau setara

- Gutter antar kolom: `space-6` (24px)
- Margin mobile: 20px (tidak berubah)
- Lebar konten maksimum: 1120px (tidak berubah)
- **Sidebar (baru)**: lebar tetap 260px desktop, padding internal `space-6` (24px), jarak antar item nav `space-2` (8px)

## Border Radius

- Default: 0.25rem
- Large: 0.5rem
- Extra large (card): 0.75rem
- Full (tombol bulat, avatar): 9999px

**Aturan konsistensi (baru):** Kartu SELALU pakai radius "Extra large" (0.75rem) — jangan campur radius berbeda antar jenis kartu (laporan, donatur, KPI) dalam halaman yang sama, ini salah satu penyebab "SaaS-card generik" yang terlihat asal-asalan kalau tidak konsisten.

## Components

Komponen dasar (dari versi awal):
- Sidebar (desktop, lebar 260px, `surface-container` + shadow level-2) / bottom navigation (mobile)
- Card hasil pencarian dengan foto, tanggal, tombol aksi
- Upload zone dengan preview foto & drag/tap area
- Accordion bertingkat (Tahun > Bulan) untuk halaman Arsip

**Komponen baru (V3-V5, belum pernah didokumentasikan — ini gap utama yang menyebabkan implementasi tidak konsisten):**

- **KPI Card (Dashboard)**: `surface-container`, radius extra large, padding `space-6`, shadow level-1. Layout: label kecil (Caption, `on-surface-variant`) di atas, nominal besar (skala "Angka finansial besar") di tengah, keterangan tambahan (Caption) di bawah. Grid 4 kolom desktop, 2 kolom tablet, 1 kolom mobile.
- **Status Badge**: radius Full, padding horizontal `space-3` vertikal `space-1`, ikon 16px + label. Warna sesuai makna: `success` (Terverifikasi), `warning` (Belum Diverifikasi / Model Cadangan), `error` (Pengeluaran, kalau perlu dibedakan dari badge tipe transaksi hijau/merah yang sudah ada).
- **Chart Container**: `surface-container`, padding `space-6`, shadow level-1. Judul (Headline kecil) + subjudul (Caption, `on-surface-variant`) di atas grafik, legend di kanan atas (tidak di bawah, supaya tidak menambah tinggi vertikal yang tidak perlu).
- **Donor Card**: `surface-container`, radius extra large, padding `space-4`, layout horizontal (avatar/ikon kiri, nama + jumlah donasi tengah, chevron kanan) — konsisten dengan pola yang sudah ada di screenshot, TIDAK perlu diubah, cuma perlu didokumentasikan biar konsisten ke depan.
- **Transaction Review Panel**: baris transaksi = `surface-container-high` (BUKAN `surface-container` polos) di dalam kartu attachment yang lebih besar — memberi kedalaman berlapis (kartu attachment > baris transaksi di dalamnya).
- **Alert/Banner (mis. "data masih tahap awal")**: `primary-fixed` sebagai latar (bukan warna solid `warning`, supaya tidak terkesan seperti error), ikon info, radius large, padding `space-4`.

## States

Setiap komponen interaktif mempertimbangkan:

- Default
- Hover (desktop) — **baru: hover kartu = shadow naik satu level (level-1 → level-2), bukan cuma perubahan warna**
- Focus
- Loading (saat upload/simpan) — pakai Skeleton dengan warna `surface-container-high`, BUKAN abu-abu generik
- Empty (arsip/pencarian kosong)
- Error (upload gagal, validasi)
- Success (konfirmasi tersimpan)

> **Catatan implementasi:** ikon di guideline ini merujuk Material Symbols (wireframe). Sesuai [12. Technical Specification](./12-Technical-Specification.md), implementasi prototype memakai **Lucide Icons** sebagai padanannya.
