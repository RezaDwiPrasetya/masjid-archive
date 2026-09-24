"use client";

import Link from "next/link";
import { Archive, HeartHandshake, ImagePlus, LayoutDashboard, Search, Users } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { useSession } from "next-auth/react";

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "/" | "/unggah" | "/cari" | "/pengguna" | "/dashboard" | "/donatur";
}) {
  const { data: session } = useSession();

  const navItems = [
    { href: "/", label: "Laporan", icon: Archive },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/donatur", label: "Donatur", icon: HeartHandshake },
    { href: "/cari", label: "Cari", icon: Search },
    { href: "/unggah", label: "Unggah", icon: ImagePlus },
  ];

  if (session?.user?.role === "ADMIN") {
    navItems.push({ href: "/pengguna", label: "Pengguna", icon: Users });
  }

  return (
    <div className="min-h-screen lg:flex bg-surface">
      {/* Permanent Structural Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col border-r border-outline-variant bg-surface-container p-6 z-20">
        <div className="mb-8">
          <span className="text-xl font-bold text-primary tracking-tight">Masjid Archive</span>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
              >
                <Icon size={24} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 lg:pl-[260px] min-w-0">
        {/* Permanent Structural Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-end border-b border-outline-variant bg-surface-container/95 backdrop-blur-sm px-4 lg:px-8">
          <AuthButton />
        </header>

        <main className="pb-28 flex-1 w-full min-w-0">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around border-t bg-background lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs ${isActive ? "text-primary" : "text-muted-foreground"
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