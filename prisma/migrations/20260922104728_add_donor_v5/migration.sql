-- ============================================================
-- Migration: add_donor_v5
-- Menambahkan entity Donor (tabel baru) dan memperluas
-- Transaction dengan donorNameRaw + FK resmi ke Donor.
--
-- Konteks:
--   - Field donorId sudah ada di Transaction sejak V4 sebagai
--     kolom TEXT biasa (tanpa FK constraint), disiapkan lebih
--     awal untuk V5. Migration ini menjadikannya FK resmi.
--   - onDelete: RESTRICT dipilih secara konsisten dengan FK
--     Transaction→Attachment dan Transaction→Report yang sudah
--     ada — lihat catatan keputusan di bawah.
--
-- Catatan keputusan onDelete: RESTRICT vs SET NULL
--   Pilihan RESTRICT berarti Donor tidak bisa dihapus selama
--   masih ada Transaction yang mereferensnya. Ini LEBIH AMAN
--   untuk data keuangan karena mencegah kehilangan jejak audit
--   (siapa donatur transaksi ini?) secara tidak sengaja.
--   Jika di masa mendatang ada fitur "gabung/hapus Donor",
--   alurnya wajib eksplisit: pindahkan semua Transaction ke
--   Donor lain dulu, BARU hapus Donor yang lama — bukan hapus
--   Donor dan biarkan donorId menggantung. Konsisten dengan
--   pola Transaction→Attachment (RESTRICT) di V4.
-- ============================================================

-- Step 1: Buat tabel Donor baru
CREATE TABLE "Donor" (
    "id"             TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "contact"        TEXT,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- Step 2: Pastikan normalizedName unik (kunci pencocokan fuzzy)
CREATE UNIQUE INDEX "Donor_normalizedName_key" ON "Donor"("normalizedName");

-- Step 3: Tambahkan kolom donorNameRaw ke Transaction
--         (nama mentah sebelum fuzzy matching, opsional)
ALTER TABLE "Transaction" ADD COLUMN "donorNameRaw" TEXT;

-- Step 4: Jadikan donorId sebagai FK resmi ke Donor
--         (kolom sudah ada sejak V4, cukup tambah constraint)
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_donorId_fkey"
    FOREIGN KEY ("donorId") REFERENCES "Donor"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
