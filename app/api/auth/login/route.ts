import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (username !== process.env.AUTH_USERNAME || password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "Username atau kata sandi salah" }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ data: { success: true } });
}