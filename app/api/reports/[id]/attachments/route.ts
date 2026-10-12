import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/auth-guard";
import { validateUploadFiles, buildSafeStoragePath } from "@/lib/file-validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(session)) {
    return NextResponse.json(
      { error: "Forbidden: Hanya pengurus DKM (Admin atau Bendahara) yang dapat menambah lampiran" },
      { status: 403 }
    );
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

  const validation = validateUploadFiles(rawFiles);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  // Gunakan ID laporan sebagai folder prefix agar rapi
  const folderId = id;
  const uploadedPaths: string[] = [];
  let uploadResults: Array<{ storagePath: string; publicUrl: string; file: File; fileType: string }>;

  try {
    uploadResults = await Promise.all(
      validation.validatedFiles.map(async (item) => {
        const { storagePath } = buildSafeStoragePath(`reports/${folderId}`, item.file.name);

        const buffer = Buffer.from(await item.file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from("report-photos")
          .upload(storagePath, buffer, {
            contentType: item.file.type,
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
          file: item.file,
          fileType: item.fileType,
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
