import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface TrendRow {
  period: string;
  type: string;
  total: string;
}

/**
 * Menghitung daftar slot periode kalender secara kronologis ascending (lama ke baru)
 * beserta rentang awal (startDate) dan akhir (endDate) untuk query database.
 */
function calculatePeriodSlots(
  granularity: "weekly" | "monthly",
  periods: number
): {
  slots: string[];
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const slots: string[] = [];

  if (granularity === "weekly") {
    // Tentukan hari Senin dari minggu saat ini (UTC)
    const currentMonday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const dayOfWeek = currentMonday.getUTCDay(); // 0 = Minggu, 1 = Senin, ...
    const diffToMonday = (dayOfWeek + 6) % 7;
    currentMonday.setUTCDate(currentMonday.getUTCDate() - diffToMonday);
    currentMonday.setUTCHours(0, 0, 0, 0);

    // Bangun daftar periode dari (periods - 1) minggu yang lalu hingga minggu ini
    for (let i = periods - 1; i >= 0; i--) {
      const slotDate = new Date(currentMonday.getTime());
      slotDate.setUTCDate(slotDate.getUTCDate() - i * 7);
      slots.push(slotDate.toISOString().split("T")[0]);
    }

    const startDate = new Date(slots[0] + "T00:00:00.000Z");
    // End date mencakup hingga akhir minggu terakhir (+ 7 hari)
    const endDate = new Date(slots[slots.length - 1] + "T00:00:00.000Z");
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    return { slots, startDate, endDate };
  } else {
    // Tentukan tanggal 1 dari bulan saat ini (UTC)
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    // Bangun daftar periode dari (periods - 1) bulan yang lalu hingga bulan ini
    for (let i = periods - 1; i >= 0; i--) {
      const slotDate = new Date(Date.UTC(currentYear, currentMonth - i, 1));
      slots.push(slotDate.toISOString().split("T")[0]);
    }

    const startDate = new Date(slots[0] + "T00:00:00.000Z");
    // End date mencakup hingga awal bulan berikutnya
    const lastSlot = new Date(slots[slots.length - 1] + "T00:00:00.000Z");
    const endDate = new Date(
      Date.UTC(lastSlot.getUTCFullYear(), lastSlot.getUTCMonth() + 1, 1)
    );

    return { slots, startDate, endDate };
  }
}

// GET /api/dashboard/trend
// Data tren pemasukan & pengeluaran untuk dashboard publik (F-014)
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
      // Pastikan format bilangan bulat murni (bukan desimal, negatif, string aneh, atau NaN)
      if (!/^\d+$/.test(rawPeriods)) {
        return NextResponse.json(
          {
            error:
              "Parameter periods harus berupa bilangan bulat positif.",
          },
          { status: 400 }
        );
      }

      periods = parseInt(rawPeriods, 10);
      if (periods <= 0) {
        return NextResponse.json(
          {
            error:
              "Parameter periods harus lebih besar dari 0.",
          },
          { status: 400 }
        );
      }

      // Batasi jumlah maksimum untuk mencegah beban berlebih pada query publik
      const maxPeriods = granularity === "weekly" ? 104 : 60; // 2 tahun untuk mingguan, 5 tahun untuk bulanan
      if (periods > maxPeriods) {
        return NextResponse.json(
          {
            error: `Parameter periods melebihi batas maksimum (${maxPeriods} untuk ${granularity}).`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Hitung slot periode kalender & batas tanggal
    const { slots, startDate, endDate } = calculatePeriodSlots(
      granularity,
      periods
    );

    // 4. Query agregasi per periode menggunakan PostgreSQL DATE_TRUNC
    // Filter ketat: hanya transaksi terverifikasi (isVerified = true)
    // Tanggal transaksi fallback ke Report.reportDate jika transactionDate null
    const rows =
      granularity === "monthly"
        ? await prisma.$queryRaw<TrendRow[]>`
            SELECT
              TO_CHAR(DATE_TRUNC('month', COALESCE(t."transactionDate", r."reportDate")), 'YYYY-MM-DD') AS "period",
              t."type",
              SUM(t."amount")::text AS "total"
            FROM "Transaction" t
            JOIN "Report" r ON t."reportId" = r."id"
            WHERE t."isVerified" = true
              AND COALESCE(t."transactionDate", r."reportDate") >= ${startDate}
              AND COALESCE(t."transactionDate", r."reportDate") < ${endDate}
            GROUP BY 1, 2
          `
        : await prisma.$queryRaw<TrendRow[]>`
            SELECT
              TO_CHAR(DATE_TRUNC('week', COALESCE(t."transactionDate", r."reportDate")), 'YYYY-MM-DD') AS "period",
              t."type",
              SUM(t."amount")::text AS "total"
            FROM "Transaction" t
            JOIN "Report" r ON t."reportId" = r."id"
            WHERE t."isVerified" = true
              AND COALESCE(t."transactionDate", r."reportDate") >= ${startDate}
              AND COALESCE(t."transactionDate", r."reportDate") < ${endDate}
            GROUP BY 1, 2
          `;

    // 5. Gap-filling: inisialisasi semua titik periode dengan 0
    const pointsMap = new Map<
      string,
      { pemasukan: number; pengeluaran: number }
    >();
    for (const slot of slots) {
      pointsMap.set(slot, { pemasukan: 0, pengeluaran: 0 });
    }

    // Masukkan data hasil query ke map
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

    // 6. Susun response array urut kronologis ascending
    const points = slots.map((period) => {
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
  } catch (error) {
    console.error("Error in GET /api/dashboard/trend:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat mengambil data tren." },
      { status: 500 }
    );
  }
}
