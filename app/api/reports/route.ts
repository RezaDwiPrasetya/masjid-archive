import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { derivePeriod } from "@/lib/derive-period";

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

  const reportDate = new Date(reportDateRaw);
  if (isNaN(reportDate.getTime())) {
    return NextResponse.json({ error: "Tanggal laporan tidak valid" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
    await mkdir(uploadDir, { recursive: true });

    const ext = photo.name.split(".").pop() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(uploadDir, filename), buffer);

    const { year, month, weekOfMonth } = derivePeriod(reportDate);

    const report = await prisma.report.create({
      data: {
        reportDate,
        photoUrl: `/uploads/reports/${filename}`,
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