import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWeeklyReportExcel } from "@/lib/export-excel";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      uploadedBy: {
        select: { name: true },
      },
      attachments: {
        include: {
          transactions: {
            where: { isVerified: true },
            include: {
              donor: { select: { name: true } },
            },
            orderBy: [
              { transactionDate: "asc" },
              { id: "asc" },
            ],
          },
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json(
      { error: "Laporan kas tidak ditemukan" },
      { status: 404 }
    );
  }

  // Ambil hanya transaksi terverifikasi dari seluruh lampiran
  const verifiedTransactions = report.attachments.flatMap((att) =>
    att.transactions.map((tx) => ({
      transactionDate: tx.transactionDate,
      type: tx.type,
      amount: parseFloat(tx.amount.toString()),
      description: tx.description || "-",
      donorNameRaw: tx.donorNameRaw,
      donorNameCanonical: tx.donor?.name ?? null,
    }))
  );

  const initialBalance = report.initialBalance
    ? parseFloat(report.initialBalance.toString())
    : 0;

  const totalIncome = verifiedTransactions
    .filter((t) => t.type === "pemasukan")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = verifiedTransactions
    .filter((t) => t.type === "pengeluaran")
    .reduce((sum, t) => sum + t.amount, 0);

  const finalBalance =
    report.finalBalance !== null
      ? parseFloat(report.finalBalance.toString())
      : initialBalance + totalIncome - totalExpense;

  const excelBuffer = generateWeeklyReportExcel({
    reportDate: report.reportDate,
    uploadedByName: report.uploadedBy.name || "Pengurus DKM",
    initialBalance,
    totalIncome,
    totalExpense,
    finalBalance,
    transactions: verifiedTransactions,
  });

  const dateStr = report.reportDate.toISOString().split("T")[0];
  const filename = `Kas-Masjid-Al-Luqman-${dateStr}.xlsx`;

  return new NextResponse(excelBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
