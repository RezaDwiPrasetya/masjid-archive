import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { ExpensesClient, ExpenseCategoryBreakdown } from "@/components/expenses-client";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rekap & Transparansi Pengeluaran — Masjid Archive",
  description:
    "Transparansi alokasi penggunaan dana kas masjid per kategori pengeluaran terverifikasi DKM Masjid Al-Luqman.",
};

export default async function ExpensesPage() {
  const whereVerifiedExpenses = {
    isVerified: true,
    type: "pengeluaran" as const,
  };

  // 1. Agregat total pengeluaran
  const totalAgg = await prisma.transaction.aggregate({
    where: whereVerifiedExpenses,
    _sum: { amount: true },
    _count: { id: true },
  });

  const totalAmount = Number(totalAgg._sum.amount ?? 0);
  const transactionCount = totalAgg._count.id;

  // 2. Breakdown per kategori
  const byCategory = await prisma.transaction.groupBy({
    by: ["category"],
    where: whereVerifiedExpenses,
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const breakdown: ExpenseCategoryBreakdown[] = byCategory.map((row) => {
    const amount = Number(row._sum.amount ?? 0);
    const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
    const label = row.category
      ? (EXPENSE_CATEGORIES.find((c) => c.value === row.category)?.label ??
        row.category)
      : "Tidak Dikategorikan";

    return {
      category: row.category,
      label,
      totalAmount: amount,
      transactionCount: row._count.id,
      percentage,
    };
  });

  // 3. Rincian seluruh transaksi pengeluaran terverifikasi
  const transactionsRaw = await prisma.transaction.findMany({
    where: whereVerifiedExpenses,
    include: {
      report: {
        select: {
          id: true,
          reportDate: true,
          year: true,
          month: true,
          weekOfMonth: true,
        },
      },
    },
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
  });

  const formattedTransactions = transactionsRaw.map((t) => {
    const rawDate = t.transactionDate ?? t.report.reportDate;
    return {
      id: t.id,
      amount: Number(t.amount),
      description: t.description,
      transactionDate: rawDate
        ? rawDate.toISOString().split("T")[0]
        : null,
      category: t.category,
      reportId: t.reportId,
      reportDate: t.report.reportDate.toISOString().split("T")[0],
      reportPeriod: `Pekan ${t.report.weekOfMonth}, ${t.report.month}/${t.report.year}`,
    };
  });

  return (
    <AppShell active="/pengeluaran">
      <ExpensesClient
        totalAmount={totalAmount}
        transactionCount={transactionCount}
        breakdown={breakdown}
        transactions={formattedTransactions}
      />
    </AppShell>
  );
}
