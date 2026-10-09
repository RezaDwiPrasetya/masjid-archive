import { prisma } from "@/lib/prisma";
import { MONTH_NAMES } from "@/lib/period-filter";
import { YearlyMonthSummary, YearlyReportExportData } from "@/lib/export-excel";

export interface YearlyReportDetailTransaction {
  id: string;
  transactionDate: Date | null;
  type: string;
  amount: number;
  description: string;
  donorNameRaw: string | null;
  donorNameCanonical?: string | null;
  reportDate: Date;
}

export interface AggregatedYearlyReportData extends YearlyReportExportData {
  transactions: YearlyReportDetailTransaction[];
  totalReportsCount: number;
}

/**
 * Mengambil dan mengagregasi data kas satu tahun penuh (12 bulan)
 * beserta transaksi terverifikasi untuk cetak dan ekspor.
 */
export async function getYearlyReportAggregatedData(
  year: number
): Promise<AggregatedYearlyReportData> {
  const reports = await prisma.report.findMany({
    where: { year },
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

  // Saldo awal tahun diambil dari laporan pertama yang tercatat di tahun tersebut
  let initialBalance = 0;
  if (reports.length > 0 && reports[0].initialBalance !== null) {
    initialBalance = parseFloat(reports[0].initialBalance.toString());
  }

  // Agregasi per bulan (1 .. 12)
  let runningBalance = initialBalance;
  const monthSummaries: YearlyMonthSummary[] = [];
  const allTransactions: YearlyReportDetailTransaction[] = [];

  for (let m = 1; m <= 12; m++) {
    const monthReports = reports.filter((r) => r.month === m);
    let monthIncome = 0;
    let monthExpense = 0;

    for (const rep of monthReports) {
      for (const att of rep.attachments) {
        for (const tx of att.transactions) {
          const amt = parseFloat(tx.amount.toString());
          if (tx.type === "pemasukan") {
            monthIncome += amt;
          } else {
            monthExpense += amt;
          }

          allTransactions.push({
            id: tx.id,
            transactionDate: tx.transactionDate,
            type: tx.type,
            amount: amt,
            description: tx.description || "-",
            donorNameRaw: tx.donorNameRaw,
            donorNameCanonical: tx.donor?.name ?? null,
            reportDate: rep.reportDate,
          });
        }
      }
    }

    const net = monthIncome - monthExpense;
    runningBalance += net;

    monthSummaries.push({
      month: m,
      monthName: MONTH_NAMES[m - 1] || `Bulan ${m}`,
      reportCount: monthReports.length,
      income: monthIncome,
      expense: monthExpense,
      net,
      closingBalance: runningBalance,
    });
  }

  const totalIncome = monthSummaries.reduce((acc, m) => acc + m.income, 0);
  const totalExpense = monthSummaries.reduce((acc, m) => acc + m.expense, 0);
  const finalBalance = runningBalance;

  return {
    year,
    initialBalance,
    totalIncome,
    totalExpense,
    finalBalance,
    monthSummaries,
    transactions: allTransactions,
    totalReportsCount: reports.length,
  };
}
