import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>;
}

// Rute /dashboard telah dilebur sepenuhnya ke Beranda utama (/) sebagai satu-satunya pusat transparansi kas
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { error } = await searchParams;
  if (error) {
    redirect(`/?error=${encodeURIComponent(error)}`);
  }
  redirect("/");
}
