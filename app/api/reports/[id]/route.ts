import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin, isStaff, canDeleteReport } from "@/lib/auth-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const staff = isStaff(session);

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      reportDate: true,
      year: true,
      month: true,
      weekOfMonth: true,
      uploadedAt: true,
      initialBalance: true,
      finalBalance: true,
      uploadedBy: {
        select: {
          name: true,
        },
      },
      attachments: {
        select: {
          id: true,
          fileUrl: true,
          fileType: true,
          originalFileName: true,
          fileSizeBytes: true,
          uploadedAt: true,
          ...(staff
            ? {
                extractionStatus: true,
                extractionModel: true,
                extractionError: true,
                extractedAt: true,
              }
            : {}),
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: report });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Cari laporan beserta semua attachment-nya dan uploader
  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      uploadedById: true,
      attachments: {
        select: { fileUrl: true },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  // Cek apakah ada transaksi yang sudah diverifikasi pada laporan ini
  const verifiedTransactionsCount = await prisma.transaction.count({
    where: {
      reportId: id,
      isVerified: true,
    },
  });

  // Validasi wewenang penghapusan:
  // 1. Admin memiliki wewenang penuh atas semua laporan.
  // 2. Bendahara pengunggah (uploader) dapat menghapus laporan buatannya sendiri SELAMA masih draf (0 transaksi terverifikasi).
  const isAllowed = canDeleteReport({
    session,
    reportUploadedById: report.uploadedById,
    verifiedTransactionsCount,
  });

  if (!isAllowed) {
    if (!isAdmin(session) && verifiedTransactionsCount > 0) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Administrator yang dapat menghapus laporan yang memiliki transaksi terverifikasi" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Forbidden: Hanya Administrator atau Bendahara yang dapat menghapus laporan draf ini" },
      { status: 403 }
    );
  }

  // Cek apakah ada query param ?force=true
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  if (verifiedTransactionsCount > 0 && !force) {
    return NextResponse.json(
      {
        error:
          "Laporan tidak dapat dihapus karena memiliki transaksi yang sudah diverifikasi.",
        hasVerifiedTransactions: true,
        verifiedCount: verifiedTransactionsCount,
      },
      { status: 409 }
    );
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

  // Hapus data DB secara atomik: Transaksi (unverified) dulu, Attachment, baru Report
  try {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { reportId: id } }),
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