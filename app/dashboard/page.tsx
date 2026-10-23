import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Kas DKM | Masjid Archive",
  description: "Kokpit analitik tren keuangan dan perbendaharaan DKM Masjid Al-Luqman.",
};

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { error } = await searchParams;
  const session = await getServerSession(authOptions);

  // Akses eksklusif khusus staf pengurus DKM (Bendahara & Admin)
  if (!isStaff(session)) {
    redirect("/?error=forbidden");
  }

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

  // Ambil laporan terbaru yang menunggu ekstraksi AI atau verifikasi transaksi
  const pendingReportsRaw = await prisma.report.findMany({
    where: {
      OR: [
        { finalBalance: null },
        { attachments: { some: { extractionStatus: { in: ["not_extracted", "processing", "failed"] } } } },
        { transactions: { some: { isVerified: false } } },
      ],
    },
    orderBy: {
      uploadedAt: "desc",
    },
    take: 4,
    select: {
      id: true,
      reportDate: true,
      weekOfMonth: true,
      month: true,
      year: true,
      uploadedAt: true,
      attachments: {
        select: {
          id: true,
          originalFileName: true,
          extractionStatus: true,
        },
      },
      transactions: {
        select: {
          isVerified: true,
        },
      },
    },
  });

  const pendingReports = pendingReportsRaw.map((r) => {
    const unextractedCount = r.attachments.filter(
      (a) => !a.extractionStatus || a.extractionStatus === "not_extracted" || a.extractionStatus === "failed"
    ).length;
    const unverifiedCount = r.transactions.filter((t) => !t.isVerified).length;

    return {
      id: r.id,
      reportDate: r.reportDate.toISOString(),
      weekOfMonth: r.weekOfMonth,
      month: r.month,
      year: r.year,
      uploadedAt: r.uploadedAt.toISOString(),
      attachmentCount: r.attachments.length,
      unextractedCount,
      unverifiedCount,
    };
  });

  return (
    <AppShell active="/dashboard">
      <DashboardClient
        initialFinalBalance={initialFinalBalance}
        latestReportDate={latestReportDate}
        latestReportId={latestReportId}
        pendingReports={pendingReports}
        authError={error}
      />
    </AppShell>
  );
}
