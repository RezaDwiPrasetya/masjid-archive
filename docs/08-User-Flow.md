# 08. User Flow

## Core User Flow

```
Entry (buka aplikasi)
  ↓
Pilih menu: Unggah / Laporan / Cari
  ↓
Sistem merespons (arsip tersimpan / hasil pencarian tampil)
  ↓
Pengguna mendapat nilai (laporan aman / arsip ditemukan)
  ↓
Tujuan tercapai
```

## Detailed Flow

1. Bendahara membuka menu **Unggah** → memilih foto laporan → memilih tanggal → menyimpan
2. Sistem menampilkan halaman konfirmasi **"Laporan Berhasil Disimpan"**
3. Pengurus DKM membuka menu **Laporan** → menelusuri arsip lewat accordion Tahun > Bulan
4. Pengurus DKM membuka menu **Cari** → mengetik kata kunci atau memilih filter Tahun/Bulan
5. Pengurus DKM menekan salah satu hasil → masuk ke halaman **Detail Laporan** → bisa mengunduh atau membagikan foto

## Alternative Flows

### Error

Jika foto gagal diunggah (misal koneksi terputus), sistem menampilkan pesan error dan mengizinkan bendahara mencoba unggah ulang tanpa kehilangan foto/tanggal yang sudah dipilih.

### Empty State

Jika belum ada laporan pada periode yang difilter, sistem menampilkan pesan bahwa arsip untuk periode tersebut masih kosong, sambil menawarkan tombol untuk mengunggah laporan baru.

### Success State

Setelah laporan berhasil disimpan, sistem menampilkan halaman konfirmasi dengan ringkasan laporan (foto kecil, tanggal) dan status "Tersimpan".
