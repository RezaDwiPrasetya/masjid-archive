-- AddColumn
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "category" TEXT;
