import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Cari attachment berdasarkan ID
  const attachment = await prisma.attachment.findUnique({
    where: { id },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Lampiran tidak ditemukan" }, { status: 404 });
  }

  // Ekstrak storage path dari fileUrl
  let storagePath: string | null = null;
  try {
    const url = new URL(attachment.fileUrl);
    const marker = "/object/public/report-photos/";
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) {
      storagePath = url.pathname.slice(idx + marker.length);
    }
  } catch (error) {
    console.error("[Delete Attachment] Gagal parse URL:", error);
  }

  // Hapus file fisik dari Supabase Storage
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("report-photos")
      .remove([storagePath]);
    if (storageError) {
      console.error(`[Delete Attachment] Gagal hapus file fisik ${storagePath} dari Supabase:`, storageError);
    } else {
      console.info(`[Delete Attachment] File ${storagePath} berhasil dihapus dari Supabase.`);
    }
  }

  // Hapus data dari DB
  try {
    await prisma.attachment.delete({
      where: { id },
    });
  } catch (dbError) {
    console.error("[Delete Attachment] Gagal hapus data DB:", dbError);
    return NextResponse.json(
      { error: "Gagal menghapus lampiran dari database." },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { success: true } });
}
