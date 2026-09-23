import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { DonorsClient } from "@/components/donors-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Donatur — Masjid Archive",
  description: "Daftar kontribusi donatur dan infaq terverifikasi kas masjid.",
};

export default async function DonorsPage() {
  // 1. Agregasi donasi per donatur terdaftar (hanya transaksi terverifikasi & pemasukan)
  const donorsWithVerifiedTransactions = await prisma.donor.findMany({
    select: {
      id: true,
      name: true,
      transactions: {
        where: {
          isVerified: true,
          type: "pemasukan",
        },
        select: {
          amount: true,
        },
      },
    },
  });

  // Hitung total kontribusi & jumlah donasi per donatur
  const donors = donorsWithVerifiedTransactions
    .map((d) => {
      const total = d.transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      return {
        id: d.id,
        name: d.name,
        totalContribution: total,
        donationCount: d.transactions.length,
      };
    })
    .filter((d) => d.donationCount > 0)
    .sort(
      (a, b) =>
        b.totalContribution - a.totalContribution ||
        a.name.localeCompare(b.name)
    );

  // 2. Agregasi donasi anonim (donorId = null, isVerified = true, type = "pemasukan")
  const anonymousAgg = await prisma.transaction.aggregate({
    where: {
      isVerified: true,
      type: "pemasukan",
      donorId: null,
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const anonymous = {
    totalContribution: Number(anonymousAgg._sum.amount ?? 0),
    donationCount: anonymousAgg._count.id,
  };

  return (
    <AppShell active="/donatur">
      <DonorsClient donors={donors} anonymous={anonymous} />
    </AppShell>
  );
}
