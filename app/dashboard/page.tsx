import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Keuangan — Masjid Archive",
  description: "Visualisasi tren pemasukan, pengeluaran kas masjid, dan saldo kas terkini.",
};

export default async function DashboardPage() {
  // Ambil laporan terbaru yang memiliki finalBalance terisi untuk KPI Saldo Kas Terkini
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

  const initialFinalBalance = latestReportWithBalance?.finalBalance
    ? Number(latestReportWithBalance.finalBalance)
    : null;

  const latestReportDate = latestReportWithBalance?.reportDate
    ? latestReportWithBalance.reportDate.toISOString()
    : null;

  const latestReportId = latestReportWithBalance?.id ?? null;

  return (
    <AppShell active="/dashboard">
      <DashboardClient
        initialFinalBalance={initialFinalBalance}
        latestReportDate={latestReportDate}
        latestReportId={latestReportId}
      />
    </AppShell>
  );
}
