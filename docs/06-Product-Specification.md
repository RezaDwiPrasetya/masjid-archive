# 06. Product Specification

## Feature

Unggah Laporan Mingguan

## Objective

Memungkinkan bendahara mengarsipkan foto laporan keuangan mingguan secara cepat, tanpa mengubah cara pencatatan manual yang sudah berjalan.

## User

Bendahara DKM Masjid Al-Luqman

## User Story

> As a bendahara, I want mengunggah foto laporan mingguan beserta tanggalnya, so that laporan tersimpan aman dan mudah dicari nanti.

## User Flow

1. Bendahara membuka menu "Unggah" di aplikasi
2. Bendahara memfoto/memilih foto halaman laporan
3. Bendahara memilih tanggal laporan (Jumat)
4. Bendahara menekan tombol "Simpan ke Arsip"
5. Sistem menampilkan konfirmasi "Laporan Berhasil Disimpan"

## Business Rules

- Setiap laporan wajib punya foto dan tanggal — tidak bisa disimpan tanpa keduanya
- Tahun, bulan, dan minggu arsip diturunkan otomatis dari tanggal yang dipilih, bukan input manual terpisah

## UI Requirements

- Area upload foto dengan preview sebelum submit
- Input tanggal dengan date picker
- Tombol simpan menunjukkan status loading saat proses unggah

## Data Requirements

- File foto (gambar)
- Tanggal laporan
- Timestamp waktu unggah

## Acceptance Criteria

- [ ] Bendahara bisa memilih/mengambil foto dari kamera atau galeri
- [ ] Bendahara bisa memilih tanggal laporan
- [ ] Sistem menolak submit jika foto atau tanggal belum diisi
- [ ] Laporan yang tersimpan langsung muncul di halaman Arsip sesuai periodenya

## Edge Cases

- Foto gagal diunggah karena koneksi terputus → tampilkan pesan error, izinkan coba lagi
- Tanggal yang dipilih ternyata sudah punya laporan tersimpan → beri peringatan sebelum menimpa/duplikat
