import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        _count: {
          select: {
            reports: true,
            verifiedTransactions: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Role can be null, "ADMIN", or "BENDAHARA"
    const validRoles = [null, "ADMIN", "BENDAHARA"];
    if (role !== undefined && !validRoles.includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Proteksi akun sendiri
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri." },
        { status: 400 }
      );
    }

    // Cek keberadaan user dan riwayat auditnya
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            reports: true,
            verifiedTransactions: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const reportCount = targetUser._count.reports;
    const verifiedCount = targetUser._count.verifiedTransactions;

    // Proteksi integritas audit data
    if (reportCount > 0 || verifiedCount > 0) {
      return NextResponse.json(
        {
          code: "HAS_AUDIT_HISTORY",
          error: `Pengguna tidak dapat dihapus karena memiliki riwayat ${reportCount} unggahan laporan dan ${verifiedCount} transaksi terverifikasi. Demi menjaga keutuhan jejak audit, pengguna ini tidak dapat dihapus. Silakan ubah perannya menjadi Jamaah jika ingin mencabut akses.`,
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: `Pengguna ${targetUser.name || targetUser.email || ""} berhasil dihapus.`,
    });
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}