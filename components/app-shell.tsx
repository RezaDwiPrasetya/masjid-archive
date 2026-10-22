"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HeartHandshake,
  ImagePlus,
  LayoutDashboard,
  Search,
  Users,
  Receipt,
  Wallet,
  Landmark,
  ShieldCheck,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronRight,
  MoreVertical,
  HelpCircle,
  LogIn,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { isStaff, isAdmin } from "@/lib/auth-guard";

function MasjidEmblem({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Image
      src="/favicon.svg"
      alt="Logo Masjid Archive"
      width={36}
      height={36}
      priority
      className={`shrink-0 select-none ${className}`}
    />
  );
}

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "/" | "/unggah" | "/cari" | "/pengguna" | "/dashboard" | "/donatur" | "/pengeluaran" | "/keuangan";
}) {
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Hydrate collapsed state from localStorage safely
  React.useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("masjid_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("masjid_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const navItems = [];

  // Rute navigasi berdasarkan hak akses:
  // - Staf DKM (BENDAHARA & ADMIN): Mengutamakan instrumen analitik kas & kerja operasional
  //   diawali dengan Dashboard (/dashboard), Unggah (/unggah), dan Keuangan (/keuangan).
  // - Publik / Jamaah (Tanpa Login): Mengutamakan keterbukaan informasi & sambutan
  //   diawali dengan Beranda (/ - portal transparansi kas umat).
  if (isStaff(session)) {
    navItems.push(
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/unggah", label: "Unggah", icon: ImagePlus },
      { href: "/keuangan", label: "Keuangan", icon: Wallet }
    );
  } else {
    navItems.push({ href: "/", label: "Beranda", icon: Landmark });
  }

  // Rute transparansi kas & pencarian dokumen (Tersedia bagi semua pengguna)
  navItems.push(
    { href: "/donatur", label: "Donatur", icon: HeartHandshake },
    { href: "/pengeluaran", label: "Pengeluaran", icon: Receipt },
    { href: "/cari", label: "Cari", icon: Search }
  );

  // Rute administratif /pengguna khusus Administrator sistem (ADMIN)
  if (isAdmin(session)) {
    navItems.push({ href: "/pengguna", label: "Pengguna", icon: Users });
  }

  const role = session?.user?.role;
  const userName = session?.user?.name || "Pengurus DKM";
  const userFirstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col">
      {/* ========================================================= */}
      {/* DESKTOP MODERN FLOATING COLLAPSIBLE SIDEBAR               */}
      {/* ========================================================= */}
      <aside
        aria-label="Navigasi Utama Desktop"
        className={`hidden lg:flex fixed left-3 top-3 bottom-3 z-30 flex-col justify-between rounded-3xl bg-[#0f291e] text-white shadow-2xl border border-emerald-900/40 select-none overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[76px] p-2.5" : "w-[264px] p-3.5"
        }`}
      >
        {/* BAGIAN ATAS: Chrome Window Controls & Brand */}
        <div className="space-y-3">
          {/* Top Bar: Decorative Accent Dots & Collapse Button */}
          <div
            className={`flex items-center pb-2.5 border-b border-emerald-800/40 ${
              isCollapsed ? "flex-col gap-2 justify-center" : "justify-between"
            }`}
          >
            {/* Tiga Titik Aksen Modern (Window Dots) */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 shadow-xs" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shadow-xs" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-xs" />
            </div>

            {/* Tombol Toggle Buka/Tutup Sidebar */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors"
              title={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
              aria-label={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>

          {/* Logo & Identitas Masjid */}
          <div className="pt-0.5">
            {!isCollapsed ? (
              <Link href="/" className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all group">
                <MasjidEmblem className="h-9 w-9 group-hover:scale-105 transition-transform shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold tracking-tight text-white leading-tight font-sans truncate">
                    Masjid Archive
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-300/80 mt-0.5">
                    Sistem Kas & Arsip
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/"
                className="flex items-center justify-center py-1 group relative"
                title="Masjid Archive - Sistem Kas & Arsip"
              >
                <MasjidEmblem className="h-8 w-8 group-hover:scale-105 transition-transform shrink-0" />
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0a1f16] border border-emerald-800 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  Masjid Archive
                </span>
              </Link>
            )}
          </div>

          {/* Kolom Pencarian Cepat (Sesuai Referensi Gambar) */}
          <div className="pt-1">
            {!isCollapsed ? (
              <Link
                href="/cari"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-emerald-100/75 hover:text-white text-xs transition-all group"
                title="Pencarian cepat arsip kas & menu (Tekan /)"
              >
                <Search size={14} className="shrink-0 text-emerald-300 group-hover:text-white transition-colors" />
                <span className="truncate flex-1 font-medium">Cari arsip kas...</span>
                <span className="text-[10px] font-mono bg-black/25 px-1.5 py-0.5 rounded text-emerald-200/60 border border-white/5">
                  /
                </span>
              </Link>
            ) : (
              <Link
                href="/cari"
                className="h-10 w-10 mx-auto flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 text-emerald-200 hover:text-white transition-all group relative"
                title="Pencarian Arsip Kas"
              >
                <Search size={16} />
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0a1f16] border border-emerald-800 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  Cari Arsip
                </span>
              </Link>
            )}
          </div>

          {/* Menu Navigasi Utama */}
          <nav className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.href;

              if (isCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`h-10 w-10 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? "bg-white text-[#0f291e] font-bold shadow-md"
                        : "text-emerald-100/75 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon size={19} className="shrink-0" />
                    <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0a1f16] border border-emerald-800 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#0f291e] font-bold shadow-md"
                      : "text-emerald-100/75 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon
                    size={19}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? "text-[#133827]" : "text-emerald-300"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BAGIAN BAWAH: Kartu Sekunder (Sub-Island) & Profil Pengguna */}
        <div className="space-y-3 pt-3 border-t border-emerald-800/40">
          {/* KARTU SUB-ISLAND PUTIH (Sesuai Ciri Khas Gambar Referensi) */}
          {!isCollapsed ? (
            <div className="rounded-2xl bg-white text-[#0f291e] p-2 shadow-lg space-y-0.5 border border-white/20 animate-in fade-in duration-200">
              {isStaff(session) && (
                <Link
                  href="/?view=public"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0f291e] hover:bg-emerald-50 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink size={13} className="text-emerald-700" />
                    <span>Portal Publik</span>
                  </span>
                  <ChevronRight size={13} className="text-emerald-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}

              <Link
                href="/cari"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0f291e] hover:bg-emerald-50 transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-emerald-700" />
                  <span>DKM Al-Luqman</span>
                </span>
                <ChevronRight size={13} className="text-emerald-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {session && (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <LogOut size={13} className="text-rose-600" />
                    <span>Keluar Sistem</span>
                  </span>
                  <ChevronRight size={13} className="text-rose-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
            </div>
          ) : (
            /* Versi Ciut (Pill Putih Vertikal Sesuai Referensi Gambar) */
            <div className="w-11 mx-auto py-2 rounded-2xl bg-white text-[#0f291e] flex flex-col items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
              {isStaff(session) && (
                <Link
                  href="/?view=public"
                  className="text-emerald-800 hover:text-emerald-950 p-1 rounded-md hover:bg-emerald-50 transition-colors group relative"
                  title="Lihat Beranda Publik"
                >
                  <ExternalLink size={15} />
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0a1f16] border border-emerald-800 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    Portal Publik
                  </span>
                </Link>
              )}

              <Link
                href="/cari"
                className="text-emerald-800 hover:text-emerald-950 p-1 rounded-md hover:bg-emerald-50 transition-colors group relative"
                title="Status DKM Al-Luqman"
              >
                <ShieldCheck size={15} />
                <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0a1f16] border border-emerald-800 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  DKM Al-Luqman
                </span>
              </Link>

              {session && (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-rose-600 hover:text-rose-800 p-1 rounded-md hover:bg-rose-50 transition-colors group relative"
                  title="Keluar dari Akun"
                >
                  <LogOut size={15} />
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0a1f16] border border-emerald-800 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    Keluar Sistem
                  </span>
                </button>
              )}
            </div>
          )}

          {/* KARTU PROFIL PENGGUNA DI FOOTER (Sesuai Referensi Gambar) */}
          <div>
            {session ? (
              !isCollapsed ? (
                <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/10 text-white">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "Avatar"}
                        className="h-9 w-9 rounded-full ring-2 ring-emerald-400/30 object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-400/30 shrink-0">
                        {userName.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate leading-tight">
                        Welcome, {userFirstName}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider mt-0.5 truncate">
                        {role || "Jamaah"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="p-1.5 rounded-lg text-emerald-200/60 hover:text-rose-300 hover:bg-white/10 transition-colors shrink-0"
                    title="Keluar Akun"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-center group relative">
                  {session.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "Avatar"}
                      className="h-9 w-9 rounded-full ring-2 ring-emerald-400/40 object-cover cursor-pointer hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-400/40 cursor-pointer hover:scale-105 transition-transform">
                      {userName.charAt(0)}
                    </div>
                  )}
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0a1f16] border border-emerald-800 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    {userName} ({role || "Jamaah"})
                  </span>
                </div>
              )
            ) : (
              /* Saat Tamu / Belum Login */
              !isCollapsed ? (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <LogIn size={15} className="text-emerald-300" />
                  <span>Akses Pengurus</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                  className="h-10 w-10 mx-auto flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-all group relative"
                  title="Akses Pengurus DKM"
                >
                  <LogIn size={16} />
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0a1f16] border border-emerald-800 text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    Akses Pengurus
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* AREA KONTEN UTAMA (Dengan Margin Dinamis Smooth)           */}
      {/* ========================================================= */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-[96px]" : "lg:pl-[284px]"
        }`}
      >
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
              <span className="text-primary font-semibold">Publik &amp; Transparan</span>
            </div>
          </div>

          {/* Sisi Kanan: Auth Status / Tombol Masuk */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              {/* Di mobile tetap gunakan AuthButton sederhana */}
              {session ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-error py-1 px-2 rounded-lg border border-outline-variant bg-surface"
                >
                  <LogOut size={13} />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary py-1 px-2.5 rounded-lg border border-primary/30 bg-primary/10"
                >
                  <LogIn size={13} />
                  <span>Pengurus</span>
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-on-surface-variant">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-on-surface">DKM Masjid Al-Luqman</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 pb-24 lg:pb-12 w-full min-w-0">
          {children}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR                              */}
      {/* ========================================================= */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-outline-variant bg-surface-container/95 backdrop-blur-md px-1 sm:px-2 pb-[env(safe-area-inset-bottom)] lg:hidden w-full overflow-x-auto scrollbar-none"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 py-1 px-0.5 sm:px-1 min-h-[44px] transition-colors ${
                isActive
                  ? "font-semibold text-primary"
                  : "font-medium text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-xl px-2 sm:px-2.5 py-1 transition-all ${
                  isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant"
                }`}
              >
                <Icon size={19} className="shrink-0" />
              </div>
              <span className="truncate w-full text-[10px] sm:text-[11px] leading-tight text-center tracking-tight px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}