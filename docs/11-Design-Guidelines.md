# 11. Design Guidelines

## Design Principles

1. Simple — bendahara tidak selalu familiar dengan aplikasi digital
2. Clear — foto laporan dan tanggal harus mudah terbaca
3. Trustworthy — warna hijau tua & krem memberi kesan tenang dan dapat dipercaya (cocok untuk konteks keagamaan)
4. Accessible — kontras tinggi, ukuran teks cukup besar
5. **Satu momen berani, sisanya tenang** — setiap halaman punya SATU elemen yang menonjol (hero band, angka besar) untuk menarik perhatian; elemen lain di sekitarnya sengaja dibuat tenang/disiplin. Jangan menyebar penekanan visual ke semua elemen sekaligus — itu yang membuat halaman terasa "kotak-kotak generik"
6. **List, bukan grid kartu, untuk data berulang** — daftar donatur, riwayat transaksi, dan konten sejenis yang berulang-ulang TIDAK dibungkus jadi kartu identik berjajar (pola dashboard SaaS generik). Gunakan format list dengan pembatas garis tipis, lebih dekat ke nuansa "buku besar/rekening koran" yang sesuai konteks pembukuan keuangan

> **Kenapa poin 5 & 6 ditambahkan:** revisi sebelumnya cuma menambah token warna & shadow, tapi struktur layout-nya tetap grid kotak seragam — pola paling umum dan gampang terasa hambar (template "SaaS-card kit"). Perbaikan sebenarnya ada di LAYOUT, bukan cuma nilai warna.

## Color Palette

| Token                     | Hex       | Penggunaan                                                        |
| ------------------------- | --------- | ------------------------------------------------------------------ |
| primary                   | `#154212` | Hero band (latar penuh), tombol utama, ikon aktif, sidebar item terpilih |
| primary-container         | `#2d5a27` | Hover state tombol utama, elemen di dalam hero band                |
| primary-fixed             | `#bcf0ae` | Teks/aksen di atas hero band gelap                                  |
| **accent-gold** (baru)    | `#b8860b` | HANYA untuk 1 angka paling penting per halaman (mis. peringkat #1 di daftar donatur, atau garis bawah tipis di angka hero) — JANGAN dipakai berulang di banyak tempat, sekali per halaman maksimal |
| surface                   | `#fafaf4` | Latar halaman (krem hangat)                                        |
| surface-container         | `#ffffff` | HANYA untuk komponen form/input/dialog (Upload zone, modal konfirmasi) — BUKAN untuk membungkus daftar berulang |
| on-surface                | `#1a1c19` | Teks utama                                                          |
| on-surface-variant        | `#42493e` | Teks sekunder (metadata, caption)                                   |
| on-primary                | `#fafaf4` | Teks di atas latar `primary` (hero band)                            |
| error                     | `#ba1a1a` | Pesan error/validasi, indikator pengeluaran                        |
| warning                   | `#a15c00` | Badge "Belum Diverifikasi", "Model Cadangan"                       |
| outline-variant           | `#c2c9bb` | Garis pembatas list (baris donatur/transaksi), border form         |

**Aturan pemakaian (revisi total):**
- Daftar berulang (donatur, transaksi, riwayat) **TIDAK** dibungkus kartu putih satu-satu — gunakan `surface` sebagai latar, garis `outline-variant` 1px sebagai pembatas ANTAR baris (bukan border mengelilingi tiap item)
- Kartu (`surface-container` + border + shadow) HANYA dipakai untuk: form input, dialog/modal konfirmasi, upload zone — elemen yang secara alami memang butuh terasa seperti "objek terpisah yang bisa diisi/ditutup", bukan untuk menampilkan data baca-saja yang berulang
- `accent-gold` dipakai SANGAT hemat — kalau dipakai di banyak tempat sekaligus, itu artinya disalahgunakan sebagai warna dekorasi, bukan penanda "yang paling penting"

## Motif Geometris (Baru)

Satu elemen visual dekoratif, dipakai **maksimal 1 kali per halaman**, sebagai garis pembatas di bawah hero band — pola garis geometris sederhana terinspirasi lattice/jali arsitektur masjid (bentuk berulang segi delapan atau garis diagonal bersilang), digambar sebagai SVG tipis 1 warna (`primary-fixed` di atas latar `primary`), tinggi maksimal 12px, HANYA sebagai pemisah dekoratif antara hero band dan konten di bawahnya. Ini SATU-SATUNYA penggunaan motif dekoratif di seluruh aplikasi — jangan diulang di tempat lain, supaya tetap terasa istimewa, bukan wallpaper berulang.

## Typography

- Font: **Outfit**
- **Hero number (baru)**: 56px / line-height 64px, weight 600, warna `on-primary` — KHUSUS untuk satu angka utama di dalam hero band (mis. total kontribusi, saldo kas). Dipakai di dalam hero band SAJA, tidak di tempat lain
- Display (judul halaman): 40px / 48px, weight 600 — diturunkan dari 48px sebelumnya, supaya hero number (56px) tetap jadi elemen paling menonjol di halaman
- Headline (judul section): 28px / 36px, weight 500
- Headline kecil: 22px / 28px, weight 500
- Body besar: 20px / 32px, weight 400
- Body normal: 18px / 28px, weight 400
- Label (tombol, nav): 16px / 20px, weight 600
- Caption (metadata kecil): 14px / 20px, weight 400
- Nominal uang di dalam list (baris donatur/transaksi): 20px, weight 600, `font-variant-numeric: tabular-nums`

## Icons

- Lucide Icons (implementasi aktual)
- Ukuran: 16px inline, 20px tombol, 24px navigasi sidebar
- **Ranking di daftar donatur**: JANGAN pakai ikon trofi/medali berulang di tiap baris (kesan gamifikasi, tidak sesuai nuansa "buku besar keuangan") — ganti dengan angka urutan sederhana (1, 2, 3...) dalam lingkaran kecil `outline-variant`, HANYA baris pertama (#1) yang boleh pakai warna `accent-gold` pada lingkarannya

## Layout — Konsep Baru per Halaman

### Halaman Publik (Dashboard, Donatur)

```
┌──────────────────────────────────────────────┐
│  PRIMARY (hijau tua, full-width, padding besar)│
│                                                │
│  Label kecil (Caption, primary-fixed)          │
│  Rp 1.030.000                    <- Hero number│
│  Keterangan singkat (Body, primary-fixed)      │
│  ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲ <- motif geometris tipis│
├──────────────────────────────────────────────┤
│  (latar surface krem, konten mulai di sini)   │
│                                                │
│  Headline section                             │
│                                                │
│  1  Nama donatur              Rp xxx.xxx      │
│  ───────────────────────────────────────      │
│  2  Nama donatur              Rp xxx.xxx      │
│  ───────────────────────────────────────      │
│  3  Nama donatur              Rp xxx.xxx      │
│                                                │
└──────────────────────────────────────────────┘
```

- Dashboard: hero number = Saldo Kas Terkini. 3 angka sekunder (Total Pemasukan, Total Pengeluaran, Arus Kas Bersih) ditampilkan sebagai baris teks sejajar horizontal DI BAWAH hero band (bukan 4 kotak KPI sejajar rata seperti sebelumnya) — Caption + angka Body besar, dipisah garis vertikal tipis antar angka, BUKAN kartu terpisah
- Grafik tren tetap dalam bentuk yang sudah ada (Recharts), tapi HILANGKAN border/shadow kartu di sekelilingnya — biarkan menyatu langsung dengan latar `surface`, cukup judul + subjudul di atasnya tanpa bingkai

### Halaman Arsip Laporan

Grid foto laporan (BUKAN list, karena ini konten visual/gambar, list garis tidak cocok untuk thumbnail foto) — tapi perbaiki proporsinya:
- 3-4 kolom di desktop (bukan 1 kolom penuh seperti sebelumnya), gap 16px
- Rasio foto tetap terjaga (aspect-ratio: 3/4), caption tanggal di bawah foto langsung tanpa kartu putih pembungkus terpisah — foto + caption dianggap satu unit visual

## Spacing

Unit dasar: 8px.

| Token | Nilai | Kapan dipakai |
|---|---|---|
| space-1 | 4px | Jarak ikon-teks dalam badge |
| space-2 | 8px | Jarak antar elemen dalam satu baris list |
| space-4 | 16px | Padding internal form/dialog, gap grid foto Arsip |
| space-6 | 24px | Padding horizontal hero band (mobile), padding form besar |
| space-8 | 32px | Padding vertikal hero band, jarak antar section |
| space-12 | 48px | Padding horizontal hero band (desktop) |
| space-16 | 64px | Jarak antara hero band dan section berikutnya |

**Aturan list (baru, menjawab "space kebanyakan"):** tiap baris dalam list (donatur/transaksi) tinggi tetap ~56-64px, padding vertikal `space-2` (8px) SAJA — TIDAK ada padding besar antar baris seperti kartu, cukup garis pembatas 1px. Densitas ini disengaja — daftar keuangan boleh terasa "padat berisi", bukan lega seperti kartu marketing.

- Sidebar: lebar tetap 260px, `surface-container` (putih) + border kanan 1px `outline-variant` (TANPA shadow — shadow terlalu "mengambang" untuk elemen struktural permanen seperti sidebar)
- Lebar konten maksimum: 1120px

## Border Radius

- Default: 0.25rem (form input, badge)
- Large: 0.5rem
- Extra large (dialog, upload zone): 0.75rem
- Full (tombol bulat, avatar, lingkaran ranking): 9999px
- **List/hero band: 0 (tanpa radius)** — elemen full-width/full-bleed tidak pakai radius, supaya terasa seperti "lembar/halaman", bukan kartu mengambang

## Components

- **Hero Band**: latar `primary`, teks `on-primary`, hero number di tengah/kiri, motif geometris di bagian bawah sebagai pembatas
- **List Row** (donatur, transaksi, riwayat): latar `surface`, border-bottom 1px `outline-variant`, padding vertikal `space-2`, layout horizontal (ranking/ikon kiri — nama tengah — nominal kanan, tabular-nums)
- **Sidebar**: `surface-container`, border kanan 1px, TANPA shadow, lebar 260px
- **Upload Zone / Form Card**: `surface-container`, border 1px `outline-variant`, radius extra large, padding `space-6` — ini SATU-SATUNYA tempat kartu putih berbingkai masih relevan
- **Status Badge**: radius Full, ikon 16px + label, warna sesuai makna (success/warning/error)
- **Alert/Banner** ("data masih tahap awal"): latar `primary-fixed`, radius large, padding `space-4`
- **Grid Foto (Arsip Laporan)**: 3-4 kolom, gap `space-4`, tanpa kartu pembungkus terpisah — foto + caption sebagai satu unit

## States

- Default, Hover, Focus, Loading, Empty, Error, Success — semua tetap berlaku
- **List Row hover (baru)**: latar berubah jadi `surface-container` (bukan shadow naik seperti kartu) — memberi kesan "baris disorot", bukan "kartu terangkat"

> **Catatan implementasi:** ikon di guideline ini merujuk Material Symbols (wireframe awal), implementasi aktual memakai **Lucide Icons** — lihat [12. Technical Specification](./12-Technical-Specification.md).
