-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "extractedAt" TIMESTAMP(3),
ADD COLUMN     "extractionError" TEXT,
ADD COLUMN     "extractionModel" TEXT,
ADD COLUMN     "extractionRawResponse" JSONB,
ADD COLUMN     "extractionStatus" TEXT NOT NULL DEFAULT 'not_extracted';

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "transactionDate" TIMESTAMP(3),
    "donorId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
