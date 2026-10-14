-- F-025: Penanda baris transaksi manual dan tracking pembuat
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "isManual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
