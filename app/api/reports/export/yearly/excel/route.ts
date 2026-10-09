import { NextRequest, NextResponse } from "next/server";
import { generateYearlyReportExcel } from "@/lib/export-excel";
import { getYearlyReportAggregatedData } from "@/lib/yearly-report";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json(
      { error: "Tahun tidak valid" },
      { status: 400 }
    );
  }

  const yearlyData = await getYearlyReportAggregatedData(year);
  const excelBuffer = generateYearlyReportExcel(yearlyData);

  const filename = `Rekap-Kas-Tahunan-Al-Luqman-${year}.xlsx`;

  return new NextResponse(excelBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
