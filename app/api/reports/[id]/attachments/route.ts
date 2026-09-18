import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Pastikan laporan eksis
  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  const formData = await request.formData();
  const rawFiles = formData.getAll("files") as File[];

  if (rawFiles.length === 0) {
    return NextResponse.json(
      { error: "Minimal satu file wajib dipilih." },
      { status: 400 }
    );
  }

  // Validasi tipe & ukuran per file
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

  // Gunakan ID laporan sebagai folder prefix agar rapi
  const folderId = id;
  const uploadedPaths: string[] = [];
  let uploadResults: Array<{ storagePath: string; publicUrl: string; file: File; fileType: string }>;

  try {
    uploadResults = await Promise.all(
      rawFiles.map(async (file) => {
        const rule = ALLOWED_TYPES[file.type]!;
        const uniqueName = `${randomUUID()}-${file.name}`;
        const storagePath = `reports/${folderId}/${uniqueName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from("report-photos")
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;
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
    console.error("[Upload Tambahan Error]:", uploadError);
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("report-photos").remove(uploadedPaths);
    }
    return NextResponse.json(
      { error: "Gagal mengunggah lampiran ke storage." },
      { status: 500 }
    );
  }

  // Simpan ke database
  try {
    await prisma.attachment.createMany({
      data: uploadResults.map((result) => ({
        reportId:         id,
        fileUrl:          result.publicUrl,
        fileType:         result.fileType,
        originalFileName: result.file.name,
        fileSizeBytes:    result.file.size,
      })),
    });

    return NextResponse.json({ data: { success: true } }, { status: 201 });
  } catch (dbError) {
    console.error("[DB Attachment Error]:", dbError);
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("report-photos").remove(uploadedPaths);
    }
    return NextResponse.json(
      { error: "Gagal menyimpan lampiran tambahan." },
      { status: 500 }
    );
  }
}
