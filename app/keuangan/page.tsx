import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/auth-guard";
import { getTreasuryBaselineCashBalance } from "@/lib/treasury";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { TreasuryClient } from "@/components/treasury-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Posisi Kas & Bank | Masjid Archive",
  description: "Pemantauan posisi kas riil masjid: kas fisik (tunai di brankas) vs kas digital (rekening bank & QRIS) serta rincian alokasi perbendaharaan.",
};

export default async function KeuanganPage() {
  const session = await getServerSession(authOptions);
  const isStaffUser = isStaff(session);

  // Ambil transaksi terverifikasi
  const transactions = await prisma.transaction.findMany({
    where: {
      isVerified: true,
    },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      transactionDate: true,
      category: true,
      paymentMethod: true,
      donorNameRaw: true,
      donor: {
        select: { id: true, name: true },
      },
      report: {
        select: { id: true, reportDate: true, year: true, month: true },
      },
    },
    orderBy: {
      transactionDate: "desc",
    },
  });

  // Ambil mutasi internal
  const transfers = await prisma.treasuryTransfer.findMany({
    select: {
      id: true,
      fromAccount: true,
      toAccount: true,
      amount: true,
      transferDate: true,
      description: true,
      createdBy: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: {
      transferDate: "desc",
    },
  });

  // Hitung saldo
  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;

  const cashExpensesByCategory: Record<string, number> = {};
  const bankExpensesByCategory: Record<string, number> = {};

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    const method = (tx.paymentMethod ?? "TUNAI").toUpperCase();
    const isCash = method === "TUNAI";
    const cat = tx.category || "lainnya";

    if (tx.type === "pemasukan") {
      if (isCash) cashIn += amount;
      else bankIn += amount;
    } else if (tx.type === "pengeluaran") {
      if (isCash) {
        cashOut += amount;
        cashExpensesByCategory[cat] = (cashExpensesByCategory[cat] || 0) + amount;
      } else {
        bankOut += amount;
        bankExpensesByCategory[cat] = (bankExpensesByCategory[cat] || 0) + amount;
      }
    }
  }

  let transfersBankToCash = 0;
  let transfersCashToBank = 0;

  for (const tr of transfers) {
    const amount = Number(tr.amount);
    if (tr.fromAccount === "BANK" && tr.toAccount === "TUNAI") {
      transfersBankToCash += amount;
    } else if (tr.fromAccount === "TUNAI" && tr.toAccount === "BANK") {
      transfersCashToBank += amount;
    }
  }

  const baselineCash = await getTreasuryBaselineCashBalance();

  const cashBalance = baselineCash + cashIn - cashOut + transfersBankToCash - transfersCashToBank;
  const bankBalance = bankIn - bankOut + transfersCashToBank - transfersBankToCash;
  const totalBalance = cashBalance + bankBalance;

  const initialSummary = {
    totalBalance,
    cash: {
      balance: cashBalance,
      baselineBalance: baselineCash,
      income: cashIn,
      expense: cashOut,
      transfersIn: transfersBankToCash,
      transfersOut: transfersCashToBank,
    },
    bank: {
      balance: bankBalance,
      income: bankIn,
      expense: bankOut,
      transfersIn: transfersCashToBank,
      transfersOut: transfersBankToCash,
    },
  };

  const initialBreakdowns = {
    cashExpensesByCategory,
    bankExpensesByCategory,
  };

  const initialTransfers = transfers.map((t) => ({
    ...t,
    amount: Number(t.amount),
    transferDate: t.transferDate.toISOString(),
  }));

  const initialTransactions = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    description: tx.description,
    transactionDate: tx.transactionDate ? tx.transactionDate.toISOString() : null,
    category: tx.category,
    paymentMethod: tx.paymentMethod ?? "TUNAI",
    donorName: tx.donor?.name || tx.donorNameRaw || null,
    reportId: tx.report?.id,
    reportDate: tx.report?.reportDate ? tx.report.reportDate.toISOString() : undefined,
  }));

  return (
    <AppShell active="/keuangan">
      <PageShell>
        <TreasuryClient
          initialSummary={initialSummary}
          initialBreakdowns={initialBreakdowns}
          initialTransfers={initialTransfers}
          initialTransactions={initialTransactions}
          isStaffUser={isStaffUser}
        />
      </PageShell>
    </AppShell>
  );
}
