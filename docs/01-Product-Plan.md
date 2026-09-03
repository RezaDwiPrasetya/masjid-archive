# 01. Product Plan

## Product Vision

Arsip keuangan masjid yang selama ini hanya hidup di buku kas fisik, bisa diakses, dicari, dan diamankan secara digital — tanpa memaksa bendahara mengubah cara kerja pencatatan yang sudah berjalan.

## Product Goal

Menyediakan tempat penyimpanan digital untuk salinan (foto/scan) laporan keuangan masjid, tersusun otomatis per periode, sehingga pengurus tidak perlu membongkar buku fisik untuk mencari arsip lama.

## Target User

Bendahara DKM Masjid Al-Luqman — Bendahara 2 (Bapak Kosasih) sebagai pengguna utama, Bendahara 1 (Bapak Cecep) sebagai pengguna sekunder yang turut mengakses arsip.

## Problem

Riwayat transaksi keuangan DKM hanya tersimpan di buku kas fisik yang terus menumpuk, menyulitkan pencarian laporan lama dan berisiko hilang/rusak (data loss).

## Value Proposition

Bendahara tetap mencatat manual seperti biasa (tidak ada perubahan alur kerja inti), tapi setiap laporan mingguan yang sudah dicatat difoto dan diarsipkan secara digital — bisa dicari dan dilihat kapan saja oleh pengurus lain tanpa harus membuka buku fisik.

## Product Strategy

- Tidak mendigitalkan pencatatan transaksi (tetap manual di buku) — fokus hanya pada pengarsipan salinan visual laporan
- Otomatisasi pengelompokan arsip berdasarkan periode (tahun/bulan/minggu, mengikuti tanggal laporan mingguan tiap Jumat) agar pencarian cepat tanpa input manual per transaksi

## MVP Goal

Membuktikan bahwa bendahara mau dan mampu memfoto & mengunggah laporan setelah mencatat manual, dan pengurus lain benar-benar terbantu saat mencari arsip lama lewat filter periode.

## Out of Scope

- Input transaksi terstruktur ke database (bukan aplikasi pembukuan)
- Laporan otomatis/analitik keuangan
- Multi-masjid / multi-tenant

## Success Metrics

| Metric                                       | Target                                  |
| --------------------------------------------- | ---------------------------------------- |
| Laporan mingguan berhasil diunggah per bulan | Sesuai jumlah laporan Jumat aktual DKM  |
| Waktu pencarian arsip lama                   | Berkurang dibanding cara manual di buku |

## Timeline

| Milestone    | Target Date | Status      |
| ------------ | ----------- | ----------- |
| Prototype    | Minggu ini  | In Progress |
| User Testing | Menyusul    | Belum mulai |
| MVP          | Menyusul    | Belum mulai |
