import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface TrendRow {
  period: string;
  type: string;
  total: string;
}

// GET /api/dashboard/trend
// Data tren pemasukan & pengeluaran untuk dashboard publik (F-014 & Issue #053)
// Akses publik — TANPA sesi NextAuth, tapi WAJIB memfilter isVerified: true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Validasi granularity
    const rawGranularity = searchParams.get("granularity") ?? "weekly";
    if (rawGranularity !== "weekly" && rawGranularity !== "monthly") {
      return NextResponse.json(
        {
          error:
            "Parameter granularity tidak valid. Gunakan 'weekly' atau 'monthly'.",
        },
        { status: 400 }
      );
    }
    const granularity = rawGranularity as "weekly" | "monthly";

    // 2. Validasi periods
    const rawPeriods = searchParams.get("periods");
    let periods = 12;

    if (rawPeriods !== null) {
      if (!/^\d+$/.test(rawPeriods)) {
        return NextResponse.json(
          {
            error: "Parameter periods harus berupa bilangan bulat positif.",
          },
          { status: 400 }
        );
      }

      periods = parseInt(rawPeriods, 10);
      if (periods <= 0) {
        return NextResponse.json(
          {
            error: "Parameter periods harus lebih besar dari 0.",
          },
          { status: 400 }
        );
      }

      const maxPeriods = granularity === "weekly" ? 104 : 60;
      if (periods > maxPeriods) {
        return NextResponse.json(
          {
            error: `Parameter periods melebihi batas maksimum (${maxPeriods} untuk ${granularity}).`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Cek apakah ada transaksi terverifikasi di database
    const verifiedTxCount = await prisma.transaction.count({
      where: { isVerified: true },
    });

    if (verifiedTxCount === 0) {
      return NextResponse.json({
        data: {
          granularity,
          points: [],
        },
      });
    }

    if (granularity === "weekly") {
      // BAGIAN 2 & 3: Pengelompokan mingguan berbasis Report.reportDate (Jumat)
      // Ambil laporan-laporan terverifikasi (maksimal periods laporan terakhir)
      const verifiedReports = await prisma.report.findMany({
        where: {
          transactions: {
            some: { isVerified: true },
          },
        },
        select: {
          id: true,
          reportDate: true,
        },
        orderBy: {
          reportDate: "desc",
        },
        take: periods,
      });

      if (verifiedReports.length === 0) {
        return NextResponse.json({
          data: {
            granularity,
            points: [],
          },
        });
      }

      // Urutkan kembali secara kronologis ascending (lama -> baru)
      verifiedReports.reverse();

      const reportIds = verifiedReports.map((r) => r.id);

      // Agregasi transaksi terverifikasi per reportId dan type
      const aggregated = await prisma.transaction.groupBy({
        by: ["reportId", "type"],
        where: {
          isVerified: true,
          reportId: { in: reportIds },
        },
        _sum: {
          amount: true,
        },
      });

      // Petakan ke map per reportId
      const reportMap = new Map<
        string,
        { pemasukan: number; pengeluaran: number }
      >();
      for (const r of verifiedReports) {
        reportMap.set(r.id, { pemasukan: 0, pengeluaran: 0 });
      }

      for (const item of aggregated) {
        const entry = reportMap.get(item.reportId);
        if (entry) {
          const amount = Number(item._sum.amount) || 0;
          if (item.type === "pemasukan") {
            entry.pemasukan += amount;
          } else if (item.type === "pengeluaran") {
            entry.pengeluaran += amount;
          }
        }
      }

      const points = verifiedReports.map((r) => {
        const data = reportMap.get(r.id)!;
        return {
          period: r.reportDate.toISOString().split("T")[0],
          pemasukan: data.pemasukan,
          pengeluaran: data.pengeluaran,
        };
      });

      return NextResponse.json({
        data: {
          granularity,
          points,
        },
      });
    } else {
      // BAGIAN 2 & 3 (Bulanan): Dikelompokkan berdasarkan bulan Report.reportDate
      const distinctMonths = await prisma.$queryRaw<{ monthPeriod: string }[]>`
        SELECT DISTINCT TO_CHAR(DATE_TRUNC('month', r."reportDate"), 'YYYY-MM-01') AS "monthPeriod"
        FROM "Report" r
        JOIN "Transaction" t ON t."reportId" = r."id"
        WHERE t."isVerified" = true
        ORDER BY "monthPeriod" DESC
        LIMIT ${periods}
      `;

      if (distinctMonths.length === 0) {
        return NextResponse.json({
          data: {
            granularity,
            points: [],
          },
        });
      }

      distinctMonths.reverse();
      const monthSlots = distinctMonths.map((m) => m.monthPeriod);

      const rows = await prisma.$queryRaw<TrendRow[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', r."reportDate"), 'YYYY-MM-01') AS "period",
          t."type",
          SUM(t."amount")::text AS "total"
        FROM "Transaction" t
        JOIN "Report" r ON t."reportId" = r."id"
        WHERE t."isVerified" = true
          AND TO_CHAR(DATE_TRUNC('month', r."reportDate"), 'YYYY-MM-01') IN (${Prisma.join(monthSlots)})
        GROUP BY 1, 2
        ORDER BY "period" ASC
      `;

      const pointsMap = new Map<
        string,
        { pemasukan: number; pengeluaran: number }
      >();
      for (const slot of monthSlots) {
        pointsMap.set(slot, { pemasukan: 0, pengeluaran: 0 });
      }

      for (const row of rows) {
        const entry = pointsMap.get(row.period);
        if (entry) {
          const amount = Number(row.total) || 0;
          if (row.type === "pemasukan") {
            entry.pemasukan += amount;
          } else if (row.type === "pengeluaran") {
            entry.pengeluaran += amount;
          }
        }
      }

      const points = monthSlots.map((period) => {
        const data = pointsMap.get(period)!;
        return {
          period,
          pemasukan: data.pemasukan,
          pengeluaran: data.pengeluaran,
        };
      });

      return NextResponse.json({
        data: {
          granularity,
          points,
        },
      });
    }
  } catch (error) {
    console.error("Error in GET /api/dashboard/trend:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat mengambil data tren." },
      { status: 500 }
    );
  }
}
