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