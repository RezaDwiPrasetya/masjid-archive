# 04. User Journey
 
 ## Scenario 1: Jamaah & Warga Publik (Mencari Kepastian Transparansi & Infaq)
 
 Seorang jamaah baru saja mentransfer infaq pembangunan masjid dan ingin memastikan donasinya tercatat, serta ingin melihat laporan kas bulanan.
 
 | Stage     | User Action                                                                                                                       | User Thought                                     | Pain/Friction                        | Opportunity                                                         |
 | --------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
 | Trigger   | Mentransfer infaq pembangunan via mobile banking / QRIS DKM                                                                      | "Alhamdulillah sudah transfer, apakah sudah masuk ya?" | Ragu apakah uangnya masuk ke kas masjid | Kanal rekening resmi & widget pencarian infaq terbuka tanpa login |
 | Discovery | Membuka link web Masjid Al-Luqman dari grup WhatsApp warga                                                                        | "Tampilannya ramah dan langsung ada info saldo"     | Takut disuruh login / daftar akun rumit | Tidak perlu login sama sekali; lobi portal langsung menyajikan saldo 3 pilar kas |
 | Action    | Mengetik nama/kode transfer di kolom "Cek Riwayat Infaq"                                                                          | "Wah nama saya ada, tercatat Rp500.000 untuk renovasi" | Khawatir privasi / nama tidak ditemukan | Pencarian cepat, opsi nama anonim (Hamba Allah), status terverifikasi DKM |
 | Outcome   | Jamaah merasa tenang dan percaya (trust) dengan pengelolaan amanah DKM, lalu mengunduh buletin PDF bulanan                       | "Masjid ini amanah dan terbuka laporannya"          | —                                    | Tombol unduh laporan PDF resmi siap cetak / arsip |
 
 ## Scenario 2: Bendahara DKM (Mengarsipkan Buku Kas Fisik Mingguan)
 
 Bendahara menyelesaikan pencatatan laporan keuangan mingguan (tiap Jumat) dan perlu mengarsipkannya agar mudah dicari di kemudian hari.
 
 | Stage     | User Action                                                                                                                       | User Thought                                     | Pain/Friction                        | Opportunity                                                         |
 | --------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
 | Trigger   | Selesai mencatat laporan Jumat mingguan di buku kas fisik                                                                         | "Laporan ini harus disimpan supaya arsip aman"    | Tidak ada tempat penyimpanan digital | Notifikasi pengingat arsip berkala |
 | Discovery | Membuka web Masjid Al-Luqman → klik tombol "Akses Pengurus" di pojok atas → login Google                                          | "Masuk ke sistem kerja pengurus"                 | Takut salah masuk halaman            | Tombol masuk khusus staf yang jelas & aman |
 | Action    | Memfoto laporan Jumat → unggah berkas → AI mengekstrak mutasi kas → bendahara mereview dan konfirmasi                              | "Cepat sekali, tidak perlu ketik ulang dari nol"  | Koreksi angka jika foto miring/buram | Review panel side-by-side (foto vs tabel hasil ekstraksi AI) |
 | Outcome   | Laporan tersimpan, saldo kas otomatis teragregasi ke portal publik secara instan                                                   | "Sekarang semua pengurus & jemaah bisa lihat update kas" | —                                 | Laporan langsung tersedia di portal transparansi publik |
 
 ## Scenario 3: Pengurus Baru (Proses Onboarding & Verifikasi Role)
 
 Anggota DKM baru yang diminta membantu bendahara mencoba login untuk pertama kali.
 
 | Stage     | User Action                                                                                                                       | User Thought                                     | Pain/Friction                        | Opportunity                                                         |
 | --------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
 | Trigger   | Diminta Ketua DKM membantu pengelolaan arsip digital                                                                              | "Saya coba login dulu pakai email Google saya"     | Tidak tahu harus menghubungi siapa   | Penjelasan yang ramah di layar |
 | Action    | Klik "Akses Pengurus" → login dengan akun Google pribadi                                                                          | "Apakah saya langsung bisa upload?"               | Menyangka sistem error jika tidak bisa upload | Halaman status khusus `/pending`: status "Menunggu Verifikasi Admin DKM" |
 | Outcome   | Pengguna memahami posisinya, Admin mengaktifkan role-nya di menu `/pengguna`, lalu staf baru mendapatkan akses workspace operasional| "Akun saya sudah aktif sebagai Staf DKM"          | —                                    | Transisi mulus ke workspace kerja staf |

