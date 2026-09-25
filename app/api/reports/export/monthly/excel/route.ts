import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMonthlyReportExcel } from "@/lib/export-excel";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Tahun atau bulan tidak valid" },
      { status: 400 }
    );
  }

  // Cari semua laporan di bulan & tahun tersebut
  const reports = await prisma.report.findMany({
    where: {
      year,
      month,
    },
    orderBy: { reportDate: "asc" },
    include: {
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

  // Kumpulkan transaksi terverifikasi
  const allTransactions: {
    transactionDate: Date | null;
    type: string;
    amount: number;
    description: string;
    donorNameRaw: string | null;
    donorNameCanonical?: string | null;
    reportDate: Date;
  }[] = [];

  let initialBalance = 0;
  if (reports.length > 0 && reports[0].initialBalance !== null) {
    initialBalance = parseFloat(reports[0].initialBalance.toString());
  }

  for (const rep of reports) {
    for (const att of rep.attachments) {
      for (const tx of att.transactions) {
        allTransactions.push({
          transactionDate: tx.transactionDate,
          type: tx.type,
          amount: parseFloat(tx.amount.toString()),
          description: tx.description || "-",
          donorNameRaw: tx.donorNameRaw,
          donorNameCanonical: tx.donor?.name ?? null,
          reportDate: rep.reportDate,
        });
      }
    }
  }

  const totalIncome = allTransactions
    .filter((t) => t.type === "pemasukan")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = allTransactions
    .filter((t) => t.type === "pengeluaran")
    .reduce((sum, t) => sum + t.amount, 0);

  const finalBalance = initialBalance + totalIncome - totalExpense;

  const excelBuffer = generateMonthlyReportExcel({
    year,
    month,
    initialBalance,
    totalIncome,
    totalExpense,
    finalBalance,
    transactions: allTransactions,
  });

  const monthPadded = String(month).padStart(2, "0");
  const filename = `Rekap-Kas-Bulanan-Al-Luqman-${year}-${monthPadded}.xlsx`;

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
