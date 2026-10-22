import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isStaff } from "@/lib/auth-guard";
import { PendingClient } from "./pending-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menunggu Verifikasi Hak Akses",
  description:
    "Status verifikasi akun staf operasional DKM Masjid Al-Luqman, Subang",
};

export default async function PendingPage() {
  const session = await getServerSession(authOptions);

  // Jika pengunjung belum login, arahkan ke beranda publik
  if (!session) {
    redirect("/");
  }

  // Jika pengguna sudah memiliki peran staf (BENDAHARA / ADMIN), bawa langsung ke ruang kerja
  if (isStaff(session)) {
    redirect("/unggah");
  }

  return (
    <PendingClient
      user={{
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
      }}
    />
  );
}
