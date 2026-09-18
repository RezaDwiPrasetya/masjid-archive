import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { uploadedBy: true, attachments: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: report });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Cari laporan beserta semua attachment-nya
  const report = await prisma.report.findUnique({
    where: { id },
    include: { attachments: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  // Ekstrak storage path dari setiap fileUrl
  // Format URL Supabase: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const storagePaths = report.attachments
    .map((att) => {
      try {
        const url = new URL(att.fileUrl);
        // Ambil path setelah "/object/public/report-photos/"
        const marker = "/object/public/report-photos/";
        const idx = url.pathname.indexOf(marker);
        return idx !== -1 ? url.pathname.slice(idx + marker.length) : null;
      } catch {
        return null;
      }
    })
    .filter((p): p is string => p !== null);

  // Hapus file fisik dari Supabase Storage (best-effort — lanjut meski gagal parsial)
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("report-photos")
      .remove(storagePaths);
    if (storageError) {
      console.error("[Delete] Gagal hapus sebagian file dari Supabase:", storageError);
    } else {
      console.info(`[Delete] ${storagePaths.length} file dihapus dari Supabase.`);
    }
  }

  // Hapus data DB secara atomik: Attachment dulu, baru Report
  try {
    await prisma.$transaction([
      prisma.attachment.deleteMany({ where: { reportId: id } }),
      prisma.report.delete({ where: { id } }),
    ]);
  } catch (dbError) {
    console.error("[Delete] Gagal hapus data DB:", dbError);
    return NextResponse.json(
      { error: "Gagal menghapus laporan dari database. Silakan coba lagi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { success: true } });
}