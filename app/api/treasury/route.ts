import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTreasuryBaselineCashBalance } from "@/lib/treasury";

export const dynamic = "force-dynamic";

/**
 * GET /api/treasury
 * F-033 (Issue #078): Menyajikan data posisi kas riil masjid (Kas Fisik vs Kas Bank/Digital),
 * saldo likuiditas masing-masing kanal, mutasi internal kas, serta rincian alokasi pengeluaran.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    let yearFilter: number | null = null;
    let monthFilter: number | null = null;

    if (yearParam && /^\d{4}$/.test(yearParam)) {
      yearFilter = parseInt(yearParam, 10);
    }
    if (monthParam && /^\d{1,2}$/.test(monthParam)) {
      const parsedMonth = parseInt(monthParam, 10);
      if (parsedMonth >= 1 && parsedMonth <= 12) {
        monthFilter = parsedMonth;
      }
    }

    // Ambil seluruh transaksi terverifikasi
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
          select: { id: true, year: true, month: true, weekOfMonth: true, reportDate: true },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    // Ambil seluruh mutasi internal (Setor Tunai / Tarik Tunai)
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

    // Hitung akumulasi per kanal kas
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

    // Hitung mutasi internal
    let transfersBankToCash = 0; // Tarik tunai dari bank ke brankas/kas fisik
    let transfersCashToBank = 0; // Setor uang tunai ke rekening bank

    for (const tr of transfers) {
      const amount = Number(tr.amount);
      if (tr.fromAccount === "BANK" && tr.toAccount === "TUNAI") {
        transfersBankToCash += amount;
      } else if (tr.fromAccount === "TUNAI" && tr.toAccount === "BANK") {
        transfersCashToBank += amount;
      }
    }

    // Baseline saldo kas fisik awal dari buku kas terverifikasi
    const baselineCash = await getTreasuryBaselineCashBalance();

    const cashBalance = baselineCash + cashIn - cashOut + transfersBankToCash - transfersCashToBank;
    const bankBalance = bankIn - bankOut + transfersCashToBank - transfersBankToCash;
    const totalBalance = cashBalance + bankBalance;

    // Filter transaksi untuk tampilan riwayat jika filter tahun/bulan diberikan
    let filteredTransactions = transactions;
    if (yearFilter !== null) {
      filteredTransactions = filteredTransactions.filter(
        (tx) => tx.report?.year === yearFilter
      );
      if (monthFilter !== null) {
        filteredTransactions = filteredTransactions.filter(
          (tx) => tx.report?.month === monthFilter
        );
      }
    }

    return NextResponse.json({
      summary: {
        totalBalance,
        cash: {
          balance: cashBalance,
          baselineBalance: baselineCash,
          income: cashIn,
          expense: cashOut,
          transfersIn: transfersBankToCash, // Penambahan dari penarikan bank
          transfersOut: transfersCashToBank, // Pengurangan dari setoran ke bank
        },
        bank: {
          balance: bankBalance,
          income: bankIn,
          expense: bankOut,
          transfersIn: transfersCashToBank, // Penambahan dari setoran kas tunai
          transfersOut: transfersBankToCash, // Pengurangan dari penarikan ke brankas
        },
      },
      breakdowns: {
        cashExpensesByCategory,
        bankExpensesByCategory,
      },
      recentTransfers: transfers.slice(0, 10).map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      recentTransactions: filteredTransactions.slice(0, 20).map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description,
        transactionDate: tx.transactionDate,
        category: tx.category,
        paymentMethod: tx.paymentMethod ?? "TUNAI",
        donorName: tx.donor?.name || tx.donorNameRaw || null,
        reportId: tx.report?.id,
        reportDate: tx.report?.reportDate,
      })),
    });
  } catch (error) {
    console.error("GET /api/treasury error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pemantauan kas & perbendaharaan." },
      { status: 500 }
    );
  }
}
