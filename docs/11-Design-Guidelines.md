# 11. Design Guidelines

## Design Principles

1. Simple — bendahara tidak selalu familiar dengan aplikasi digital
2. Clear — foto laporan dan tanggal harus mudah terbaca
3. Trustworthy — warna hijau tua & krem memberi kesan tenang dan dapat dipercaya (cocok untuk konteks keagamaan)
4. Accessible — kontras tinggi, ukuran teks cukup besar

## Color Palette

| Token                | Hex     | Penggunaan                     |
| ---------------------- | ------- | --------------------------------- |
| primary              | #154212 | Aksi utama, tombol, ikon aktif |
| primary-container    | #2d5a27 | Elemen pendukung primary       |
| primary-fixed        | #bcf0ae | Aksen terang                   |
| background / surface | #fafaf4 | Latar utama (krem hangat)      |
| on-surface           | #1a1c19 | Teks utama                     |
| on-surface-variant   | #42493e | Teks sekunder                  |
| error                | #ba1a1a | Pesan error/validasi           |
| outline-variant      | #c2c9bb | Border, pembatas               |

## Typography

- Font: **Outfit**
- Display (judul halaman besar): 48px / line-height 56px, weight 600
- Headline (judul section): 28px / 36px, weight 500
- Headline kecil: 22px / 28px, weight 500
- Body besar: 20px / 32px, weight 400
- Body normal: 18px / 28px, weight 400
- Label (tombol, nav): 16px / 20px, weight 600
- Caption (metadata kecil): 14px / 20px, weight 400

## Icons

- Material Symbols Outlined

## Spacing

- Unit dasar: 8px
- Stack kecil: 12px, Stack medium: 24px, Stack besar: 48px
- Gutter antar kolom: 24px
- Margin mobile: 20px
- Lebar konten maksimum: 1120px

## Border Radius

- Default: 0.25rem
- Large: 0.5rem
- Extra large (card): 0.75rem
- Full (tombol bulat, avatar): 9999px

## Components

- Bottom navigation (mobile) / sidebar (desktop) dengan 3 item: Laporan, Unggah, Cari
- Card hasil pencarian dengan foto, tanggal, tombol aksi
- Upload zone dengan preview foto & drag/tap area
- Accordion bertingkat (Tahun > Bulan) untuk halaman Arsip

## States

Setiap komponen interaktif mempertimbangkan:

- Default
- Hover (desktop)
- Focus
- Loading (saat upload/simpan)
- Empty (arsip/pencarian kosong)
- Error (upload gagal, validasi)
- Success (konfirmasi tersimpan)

> **Catatan implementasi:** ikon di guideline ini merujuk Material Symbols (wireframe). Sesuai [12. Technical Specification](./12-Technical-Specification.md), implementasi prototype memakai **Lucide Icons** sebagai padanannya.
