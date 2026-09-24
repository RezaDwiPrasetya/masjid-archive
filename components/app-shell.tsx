"use client";

import Link from "next/link";
import {
  Archive,
  HeartHandshake,
  ImagePlus,
  LayoutDashboard,
  Search,
  Users,
  ShieldCheck,
} from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { useSession } from "next-auth/react";

function MasjidEmblem({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-lg bg-primary text-primary-fixed select-none shadow-xs ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Octagram / 8-pointed geometric architectural star motif */}
        <rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(0 12 12)" />
        <rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)" opacity="0.75" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

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
    <div className="min-h-screen lg:flex bg-surface text-on-surface antialiased">
      {/* Permanent Structural Sidebar (Desktop) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] flex-col border-r border-outline-variant bg-surface-container z-20 select-none">
        {/* Brand Header */}
        <div className="p-6 pb-5 border-b border-outline-variant/60">
          <Link href="/" className="flex items-center gap-3 group">
            <MasjidEmblem className="h-9 w-9 group-hover:scale-[1.03] transition-transform duration-200" />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-on-surface leading-tight font-sans">
                Masjid Archive
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-on-surface-variant/80 mt-0.5">
                Sistem Kas & Arsip
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-on-primary font-semibold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 transition-transform duration-150 ${
                    isActive ? "text-primary-fixed" : "text-on-surface-variant group-hover:text-on-surface"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer — Status & Attribution */}
        <div className="p-4 mx-3 mb-4 rounded-xl border border-outline-variant/60 bg-surface/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
            <ShieldCheck size={14} className="text-primary shrink-0" />
            <span>DKM Al-Luqman</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-tight">
            Transparansi pembukuan kas & donasi terverifikasi.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[260px] min-w-0 flex flex-col min-h-screen">
        {/* Structural Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-outline-variant bg-surface-container/95 backdrop-blur-sm px-4 lg:px-8">
          {/* Mobile Brand / Desktop Context Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="lg:hidden flex items-center gap-2">
              <MasjidEmblem className="h-7 w-7" />
              <span className="text-sm font-bold tracking-tight text-on-surface truncate">
                Masjid Archive
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              <span>Arsip Digital Keuangan Masjid</span>
              <span className="text-outline">•</span>
              <span className="text-primary font-semibold">Publik & Transparan</span>
            </div>
          </div>

          {/* Auth Button */}
          <AuthButton />
        </header>

        {/* Page Content Body */}
        <main className="flex-1 pb-24 lg:pb-12 w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-outline-variant bg-surface-container/95 backdrop-blur-md px-1 lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2 text-[11px] transition-colors ${
                isActive
                  ? "font-semibold text-primary"
                  : "font-medium text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-lg p-1 transition-all ${
                  isActive ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <Icon size={20} />
              </div>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}