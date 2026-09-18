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

## V2 — Multi-Format Upload (Sedang Dikerjakan)

### MVP Objective (V2)

Membuktikan bahwa satu laporan mingguan bisa memiliki lebih dari satu lampiran file, dengan tipe file yang lebih beragam (gambar, PDF, Excel) — sebagai fondasi sebelum data di dalamnya bisa diekstrak (V3).

### Must Have (V2)
- Form Unggah mendukung multi-file selection
- Mendukung tipe file: gambar (jpg/png), PDF, Excel (.xlsx)
- Validasi tipe file & ukuran maksimum per file
- Halaman Detail Laporan menampilkan daftar semua lampiran, dengan preview berbeda per tipe
- Tombol hapus lampiran individual sebelum submit final

### Should Have (V2)
- Reorder/urutan tampilan lampiran
- Indikator progres upload per file

### Could Have (V2)
- Preview thumbnail untuk halaman pertama PDF

### Not Now (V2 — tetap di luar scope, ini scope V3+)
- Ekstraksi data dari file (OCR/parsing) — scope V3
- Analitik/tren/dashboard — scope V4
- Multi-user/role — scope V5

### MVP Core Flow (V2)

Bendahara membuka form Unggah → memilih beberapa file sekaligus (kombinasi gambar/PDF/Excel) → mengisi tanggal laporan → submit → seluruh file tersimpan sebagai lampiran-lampiran yang terhubung ke satu laporan → pengurus lain membuka Detail Laporan dan melihat semua lampiran itu.

### MVP Success Criteria (V2)
- [ ] Bendahara berhasil mengunggah 1 laporan dengan kombinasi minimal 2 tipe file berbeda dalam sekali submit
- [ ] Semua lampiran tersimpan dan bisa diakses kembali dari halaman Detail Laporan
- [ ] Validasi menolak tipe file yang tidak didukung dengan pesan error yang jelas

---

## Roadmap Fase Berikutnya (Referensi)

| Fase | Fokus |
|---|---|
| V3 | Ekstraksi data (vision-LLM untuk gambar, parsing untuk PDF/Excel) |
| V4 | Financial intelligence: tren, tracking donatur, visualisasi |
| V5 | Multi-user & manajemen peran |
| V6 | Multi-tenant (opsional, jangka panjang) |
