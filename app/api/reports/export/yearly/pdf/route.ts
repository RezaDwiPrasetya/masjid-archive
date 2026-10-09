import { NextRequest, NextResponse } from "next/server";
import { generateYearlyReportPdf } from "@/lib/export-pdf";
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
  const pdfBytes = await generateYearlyReportPdf(yearlyData);

  const filename = `Rekap-Kas-Tahunan-Al-Luqman-${year}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
