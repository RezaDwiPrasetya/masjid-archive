import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { derivePeriod } from "@/lib/derive-period";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    include: { uploadedBy: true, attachments: true },
  });

  const filteredReports = keyword
    ? reports.filter((report) => {
        const date = new Date(report.reportDate).toLocaleDateString("id-ID");
        return (
          date.toLowerCase().includes(keyword) ||
          (report.uploadedBy.name?.toLowerCase().includes(keyword) ?? false)
        );
      })
    : reports;

  return NextResponse.json({ data: filteredReports });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uploadedById = session.user.id;

  // ── #032 — Validasi server-side: ekstrak field ────────────────────────────
  const formData = await request.formData();
  const rawFiles = formData.getAll("files") as File[];
  const reportDateRaw = formData.get("reportDate") as string | null;

  // Guard: field wajib
  if (rawFiles.length === 0 || !reportDateRaw) {
    return NextResponse.json(
      { error: "Minimal satu file dan tanggal laporan wajib diisi." },
      { status: 400 }
    );
  }

  // ── #032 — Validasi tipe & ukuran per file (server-side mirror) ───────────
  const ALLOWED_TYPES: Record<string, { fileType: string; ext: string; maxBytes: number }> = {
    "image/jpeg":       { fileType: "image",  ext: "jpg",  maxBytes: 5  * 1024 * 1024 },
    "image/png":        { fileType: "image",  ext: "png",  maxBytes: 5  * 1024 * 1024 },
    "application/pdf":  { fileType: "pdf",    ext: "pdf",  maxBytes: 10 * 1024 * 1024 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      fileType: "excel", ext: "xlsx", maxBytes: 5 * 1024 * 1024,
    },
    "application/vnd.ms-excel": {
      fileType: "excel", ext: "xls",  maxBytes: 5 * 1024 * 1024,
    },
  };

  for (const file of rawFiles) {
    const rule = ALLOWED_TYPES[file.type];
    if (!rule) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: "${file.name}" (${file.type || "tidak dikenal"}).` },
        { status: 400 }
      );
    }
    if (file.size > rule.maxBytes) {
      const limitMB = rule.maxBytes / 1024 / 1024;
      const actualMB = (file.size / 1024 / 1024).toFixed(2);
      return NextResponse.json(
        {
          error: `File "${file.name}" melebihi batas ${limitMB} MB untuk tipe ${rule.fileType.toUpperCase()} (ukuran: ${actualMB} MB).`,
        },
        { status: 400 }
      );
    }
  }

  // ── #032 — Validasi tanggal & cek duplikat (SEBELUM upload apapun) ────────
  const reportDate = new Date(reportDateRaw);
  if (isNaN(reportDate.getTime())) {
    return NextResponse.json({ error: "Tanggal laporan tidak valid." }, { status: 400 });
  }
  if (reportDate.getDay() !== 5) {
    return NextResponse.json(
      { error: "Tanggal laporan harus hari Jumat." },
      { status: 400 }
    );
  }

  const existingReport = await prisma.report.findFirst({ where: { reportDate } });
  if (existingReport) {
    return NextResponse.json(
      { error: "Laporan untuk tanggal tersebut sudah tersimpan." },
      { status: 409 }
    );
  }

  // ── Pre-generate reportId untuk struktur folder Supabase (#027) ───────────
  // reportId di-generate manual agar bisa dipakai sebagai folder path
  // sebelum record Report dibuat di DB (Prisma pakai cuid(), kita pakai UUID di sini
  // hanya untuk folder path — reportId yang sesungguhnya tetap dari Prisma).
  // Solusi lebih bersih: upload ke folder sementara lalu pindah, tapi untuk
  // menghindari kompleksitas, kita pakai UUID sebagai "session" folder upload.
  const uploadSessionId = randomUUID();

  // ── #033 — Upload paralel ke Supabase via Promise.all ─────────────────────
  // Track semua path yang berhasil diupload untuk keperluan cleanup (#034)
  const uploadedPaths: string[] = [];

  let uploadResults: Array<{ storagePath: string; publicUrl: string; file: File; fileType: string }>;

  try {
    uploadResults = await Promise.all(
      rawFiles.map(async (file) => {
        const rule = ALLOWED_TYPES[file.type]!;
        const uniqueName = `${randomUUID()}-${file.name}`;
        // #027 — Struktur folder: reports/[session-id]/[uuid]-[nama-asli.ext]
        const storagePath = `reports/${uploadSessionId}/${uniqueName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from("report-photos")
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Track path agar bisa dihapus jika ada yang gagal setelahnya
        uploadedPaths.push(storagePath);

        const { data: publicUrlData } = supabase.storage
          .from("report-photos")
          .getPublicUrl(storagePath);

        return {
          storagePath,
          publicUrl: publicUrlData.publicUrl,
          file,
          fileType: rule.fileType,
        };
      })
    );
  } catch (uploadError) {
    // ── #034 — Cleanup: hapus file yang sudah terlanjur terupload ─────────
    console.error("[Upload Error] Sebagian file gagal diupload:", uploadError);
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("report-photos").remove(uploadedPaths);
      console.info(`[Cleanup] ${uploadedPaths.length} file yatim dihapus dari Supabase.`);
    }
    return NextResponse.json(
      { error: "Gagal mengunggah file ke storage. Silakan coba lagi." },
      { status: 500 }
    );
  }

  // ── #033 — Simpan atomik ke DB via prisma.$transaction ────────────────────
  try {
    const { year, month, weekOfMonth } = derivePeriod(reportDate);

    const report = await prisma.$transaction(async (tx) => {
      // Insert Report
      const newReport = await tx.report.create({
        data: { reportDate, year, month, weekOfMonth, uploadedById },
      });

      // Insert semua Attachment sekaligus (createMany tidak perlu loop)
      await tx.attachment.createMany({
        data: uploadResults.map((result) => ({
          reportId:         newReport.id,
          fileUrl:          result.publicUrl,
          fileType:         result.fileType,
          originalFileName: result.file.name,
          fileSizeBytes:    result.file.size,
        })),
      });

      return newReport;
    });

    return NextResponse.json(
      {
        data: {
          id:          report.id,
          reportDate:  report.reportDate,
          year:        report.year,
          month:       report.month,
          weekOfMonth: report.weekOfMonth,
          attachments: uploadResults.map((r) => ({
            fileName: r.file.name,
            status:   "uploaded",
          })),
        },
      },
      { status: 201 }
    );
  } catch (dbError) {
    // ── #034 — Cleanup kritis: $transaction rollback otomatis di sisi DB,
    //          tapi Supabase storage TIDAK ikut rollback — harus hapus manual.
    console.error("[DB Transaction Error] Rollback DB, hapus file yatim:", dbError);
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("report-photos").remove(uploadedPaths);
      console.info(`[Cleanup] ${uploadedPaths.length} file yatim dihapus setelah DB gagal.`);
    }
    return NextResponse.json(
      { error: "Gagal menyimpan lampiran. Silakan coba lagi." },
      { status: 500 }
    );
  }
}