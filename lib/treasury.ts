import { prisma } from "@/lib/prisma";

export interface TreasurySummary {
  totalBalance: number;
  cash: {
    balance: number;
    baselineBalance: number;
    income: number;
    expense: number;
    transfersIn: number;
    transfersOut: number;
  };
  bank: {
    balance: number;
    income: number;
    expense: number;
    transfersIn: number;
    transfersOut: number;
  };
}

/**
 * Menghitung saldo baseline kas fisik dari laporan kas terverifikasi terakhir.
 * Saldo kas fisik riil = Baseline Saldo Awal + Total Pemasukan Tunai - Total Pengeluaran Tunai + Net Mutasi Internal.
 */
export async function getTreasuryBaselineCashBalance(): Promise<number> {
  const latestReportWithBalance = await prisma.report.findFirst({
    where: {
      finalBalance: {
        not: null,
      },
    },
    orderBy: {
      reportDate: "desc",
    },
    select: {
      id: true,
      reportDate: true,
      finalBalance: true,
    },
  });

  if (!latestReportWithBalance || latestReportWithBalance.finalBalance === null) {
    return 0;
  }

  const latestFinalBalance = Number(latestReportWithBalance.finalBalance);

  // Hitung akumulasi kas tunai sampai tanggal laporan terakhir tersebut
  const cashInAgg = await prisma.transaction.aggregate({
    where: {
      isVerified: true,
      type: "pemasukan",
      paymentMethod: { notIn: ["TRANSFER", "QRIS"] },
      report: {
        reportDate: { lte: latestReportWithBalance.reportDate },
      },
    },
    _sum: {
      amount: true,
    },
  });

  const cashOutAgg = await prisma.transaction.aggregate({
    where: {
      isVerified: true,
      type: "pengeluaran",
      paymentMethod: { notIn: ["TRANSFER", "QRIS"] },
      report: {
        reportDate: { lte: latestReportWithBalance.reportDate },
      },
    },
    _sum: {
      amount: true,
    },
  });

  const cashInUpToLatest = Number(cashInAgg._sum.amount || 0);
  const cashOutUpToLatest = Number(cashOutAgg._sum.amount || 0);
  const netCashTxUpToLatest = cashInUpToLatest - cashOutUpToLatest;

  // Baseline kas fisik = Saldo akhir buku kas fisik - arus bersih transaksi tunai s.d laporan tersebut
  const baseline = latestFinalBalance - netCashTxUpToLatest;
  return baseline > 0 ? baseline : 0;
}
