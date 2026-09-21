"use client";

import Link from "next/link";
import { Archive, ImagePlus, Search, Users } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { useSession } from "next-auth/react";

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "/" | "/unggah" | "/cari" | "/pengguna";
}) {
  const { data: session } = useSession();

  const navItems = [
    { href: "/", label: "Laporan", icon: Archive },
    { href: "/unggah", label: "Unggah", icon: ImagePlus },
    { href: "/cari", label: "Cari", icon: Search },
  ];

  if (session?.user?.role === "ADMIN") {
    navItems.push({ href: "/pengguna", label: "Pengguna", icon: Users });
  }
  return (
    <div className="min-h-screen lg:flex bg-transparent">
      {/* Floating Glass Sidebar */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-64 flex-col rounded-3xl border border-white/20 bg-sidebar/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-6 z-20">
        <div className="mb-8 px-6">
          <span className="text-xl font-bold bg-gradient-to-br from-primary to-emerald-600 bg-clip-text text-transparent">Masjid Archive</span>
        </div>
        <nav className="flex-1 space-y-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground hover:scale-[1.02]"
                }`}
              >
                <Icon size={20} className={`transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 lg:pl-[18rem]">
        {/* Floating Glass Header */}
        <header className="sticky top-4 z-10 flex h-16 items-center justify-end rounded-2xl border border-white/20 bg-background/60 px-6 backdrop-blur-xl shadow-sm mx-4 lg:mx-6 mb-4">
          <AuthButton />
        </header>

        <main className="mx-auto max-w-5xl px-4 lg:px-6 py-4 pb-28">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t bg-background lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}