# 10. MVP Scope

## MVP Objective

Membuktikan bahwa bendahara mau dan mampu mengarsipkan laporan mingguan lewat foto + tanggal, dan pengurus lain benar-benar terbantu mencari arsip lama lewat filter periode — dibanding cara manual buka buku fisik.

## Must Have

- Unggah laporan (foto + tanggal)
- Arsip tersusun otomatis per Tahun > Bulan > Minggu
- Pencarian dengan filter Tahun/Bulan
- Halaman konfirmasi setelah upload berhasil

## Should Have

- Halaman detail laporan (foto ukuran penuh + unduh)

## Could Have

- Fitur bagikan tautan laporan ke pengurus lain

## Not Now

- Input transaksi terstruktur ke database
- Laporan/analitik keuangan otomatis
- Multi-masjid / multi-tenant
- Autentikasi multi-role yang kompleks

## MVP Core Flow

Bendahara mengunggah foto laporan mingguan beserta tanggalnya → sistem otomatis mengelompokkan ke periode yang sesuai → pengurus lain mencari/memfilter arsip → menemukan dan melihat laporan yang dicari.

## MVP Success Criteria

- [ ] Bendahara berhasil mengunggah minimal satu laporan mingguan tanpa bantuan
- [ ] Pengurus lain berhasil menemukan laporan tertentu lewat pencarian/filter tanpa bertanya ke bendahara
