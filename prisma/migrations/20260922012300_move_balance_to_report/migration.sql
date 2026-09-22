-- ============================================================
-- Migration: move_balance_to_report
-- Memindahkan initialBalance & finalBalance dari Attachment
-- ke Report (level yang secara konseptual tepat).
--
-- CATATAN KOMPATIBILITAS:
--   Di production database, kolom saldo di Attachment sudah
--   ada dari skema sebelum V4. Di shadow database (fresh),
--   kolom tersebut belum pernah dibuat oleh migrasi mana pun
--   yang tersisa. Oleh karena itu, Step 0 menambahkan kolom
--   sumber dengan IF NOT EXISTS agar migration ini idempoten.
--
-- Urutan SQL ini KRITIS:
--   0. ADD COLUMN IF NOT EXISTS ke Attachment (sumber) — aman di fresh DB
--   1. ADD COLUMN ke Report (kolom tujuan)
--   2. COPY DATA dari Attachment ke Report induknya
--   3. DROP COLUMN dari Attachment (kolom sumber)
-- ============================================================

-- Step 0: Pastikan kolom sumber ada di Attachment (idempoten — tidak merusak jika sudah ada)
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "initialBalance" DECIMAL(15,2);
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "finalBalance"   DECIMAL(15,2);

-- Step 1: Tambahkan kolom saldo ke tabel Report
ALTER TABLE "Report" ADD COLUMN "initialBalance" DECIMAL(15,2);
ALTER TABLE "Report" ADD COLUMN "finalBalance"   DECIMAL(15,2);

-- Step 2: Salin data saldo dari Attachment ke Report induknya
--         Hanya menyalin jika Attachment tersebut punya nilai saldo.
UPDATE "Report" r
SET
  "initialBalance" = a."initialBalance",
  "finalBalance"   = a."finalBalance"
FROM "Attachment" a
WHERE a."reportId" = r.id
  AND (a."initialBalance" IS NOT NULL OR a."finalBalance" IS NOT NULL);

-- Step 3: Hapus kolom saldo dari tabel Attachment
ALTER TABLE "Attachment" DROP COLUMN IF EXISTS "initialBalance";
ALTER TABLE "Attachment" DROP COLUMN IF EXISTS "finalBalance";
