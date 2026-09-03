# 05. Product Requirements Document

## Background

DKM Masjid Al-Luqman selama ini mengarsipkan laporan keuangan mingguan (tiap Jumat) hanya di buku kas fisik yang menumpuk dan berisiko hilang/rusak, sehingga pencarian arsip lama sulit dilakukan.

## Objective

Menyediakan aplikasi web untuk mengarsipkan salinan foto/scan laporan keuangan mingguan, tersusun otomatis berdasarkan periode, dan mudah dicari kapan saja oleh pengurus DKM.

## Target User

Bendahara DKM Masjid Al-Luqman (Bapak Kosasih sebagai primary user, Bapak Cecep sebagai secondary user).

## User Needs

1. Cara cepat mengarsipkan laporan mingguan tanpa menambah beban pencatatan manual
2. Pencarian arsip lama berdasarkan tahun/bulan tanpa membuka buku fisik
3. Akses arsip yang mudah dibagikan ke pengurus lain

## Functional Requirements

| ID     | Requirement                                                                          | Priority |
| ------ | --------------------------------------------------------------------------------------- | -------- |
| FR-001 | Pengguna dapat mengunggah foto laporan beserta tanggal laporan (Jumat)               | Must     |
| FR-002 | Sistem otomatis menentukan tahun/bulan/minggu dari tanggal laporan yang diunggah     | Must     |
| FR-003 | Pengguna dapat melihat daftar arsip laporan tersusun per Tahun > Bulan > Minggu      | Must     |
| FR-004 | Pengguna dapat mencari arsip lewat kata kunci dan filter Tahun/Bulan                 | Must     |
| FR-005 | Pengguna dapat melihat detail satu laporan (foto ukuran penuh, tanggal, ukuran file) | Must     |
| FR-006 | Pengguna dapat mengunduh foto laporan dari halaman detail                            | Should   |
| FR-007 | Pengguna dapat membagikan tautan laporan ke pengurus lain                            | Could    |
| FR-008 | Sistem menampilkan konfirmasi setelah laporan berhasil diunggah                      | Must     |

## Non-Functional Requirements

- Performance: Upload foto & pencarian arsip terasa responsif di koneksi internet standar
- Security: Akses aplikasi terbatas untuk pengurus DKM (belum publik)
- Accessibility: UI sederhana, mudah dipakai pengguna yang tidak terbiasa aplikasi digital
- Reliability: Foto yang sudah diunggah tidak boleh hilang/corrupt

## MVP Requirements

FR-001 sampai FR-005 dan FR-008 (alur inti: unggah → arsip tersusun otomatis → cari/lihat detail).

## Acceptance Criteria

Bendahara berhasil mengunggah laporan mingguan dan pengurus lain berhasil menemukan laporan tersebut lewat pencarian/filter tanpa bantuan bendahara.

## Out of Scope

- Input transaksi terstruktur ke database
- Laporan/analitik keuangan otomatis
- Multi-masjid / multi-tenant
