-- ============================================================
-- Migration: move_balance_to_report
-- Memindahkan initialBalance & finalBalance dari Attachment
-- ke Report (level yang secara konseptual tepat).
--
-- Urutan SQL ini KRITIS:
--   1. ADD COLUMN ke Report (kolom tujuan)
--   2. COPY DATA dari Attachment ke Report induknya
--   3. DROP COLUMN dari Attachment (kolom sumber)
-- ============================================================

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
