import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { derivePeriod } from "@/lib/derive-period";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  const keyword = searchParams.get("keyword")?.trim().toLowerCase() ?? "";

  const reports = await prisma.report.findMany({
    where: {
      ...(Number.isInteger(year) && year > 0 ? { year } : {}),
      ...(Number.isInteger(month) && month > 0 ? { month } : {}),
    },
    orderBy: { reportDate: "desc" },
    include: { uploadedBy: true },
  });

  const filteredReports = keyword
    ? reports.filter((report) => {
        const date = new Date(report.reportDate).toLocaleDateString("id-ID");
        return (
          date.toLowerCase().includes(keyword) ||
          report.uploadedBy.name.toLowerCase().includes(keyword)
        );
      })
    : reports;

  return NextResponse.json({ data: filteredReports });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const photo = formData.get("photo") as File | null;
  const reportDateRaw = formData.get("reportDate") as string | null;
  const uploadedById = formData.get("uploadedById") as string | null;

  if (!photo || !reportDateRaw || !uploadedById) {
    return NextResponse.json(
      { error: "Foto dan tanggal laporan wajib diisi" },
      { status: 400 }
    );
  }

  if (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Foto harus berupa gambar dengan ukuran maksimal 5 MB" },
      { status: 400 }
    );
  }

  const reportDate = new Date(reportDateRaw);
  if (isNaN(reportDate.getTime())) {
    return NextResponse.json({ error: "Tanggal laporan tidak valid" }, { status: 400 });
  }

  if (reportDate.getDay() !== 5) {
    return NextResponse.json(
      { error: "Tanggal laporan harus hari Jumat" },
      { status: 400 }
    );
  }

  const existingReport = await prisma.report.findFirst({ where: { reportDate } });
  if (existingReport) {
    return NextResponse.json(
      { error: "Laporan untuk tanggal tersebut sudah tersimpan" },
      { status: 409 }
    );
  }

  try {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const ext = photo.name.split(".").pop() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const storagePath = `reports/${filename}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("reports")
      .upload(storagePath, buffer, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("reports")
      .getPublicUrl(storagePath);

    const { year, month, weekOfMonth } = derivePeriod(reportDate);

    const report = await prisma.report.create({
      data: {
        reportDate,
        photoUrl: publicUrlData.publicUrl,
        year,
        month,
        weekOfMonth,
        uploadedById,
      },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengunggah foto. Periksa koneksi internet Anda dan coba lagi." },
      { status: 500 }
    );
  }
}