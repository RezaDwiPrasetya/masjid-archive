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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [optimisticActive, setOptimisticActive] = React.useState<string | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

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

  // Reset optimistic active whenever route active changes
  React.useEffect(() => {
    setOptimisticActive(null);
  }, [active]);

  // Click outside listener for profile menu popover
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const currentActive = optimisticActive ?? active;
  const activeIndex = navItems.findIndex((item) => item.href === currentActive);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const ActiveNavIcon = navItems[safeActiveIndex]?.icon ?? Landmark;

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col">
      {/* ========================================================= */}
      {/* DESKTOP MODERN FLOATING COLLAPSIBLE SIDEBAR               */}
      {/* ========================================================= */}
      <aside
        aria-label="Navigasi Utama Desktop"
        className={`hidden lg:flex fixed left-3 top-3 bottom-3 z-30 flex-col justify-between rounded-3xl bg-surface-container/95 backdrop-blur-md text-on-surface shadow-xl shadow-emerald-950/5 border border-outline-variant/70 select-none overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[76px] p-2.5" : "w-[264px] p-3.5"
        }`}
      >
        {/* BAGIAN ATAS: Header Identitas & Menu Navigasi Utama */}
        <div className="space-y-4">
          {/* Top Bar: Masjid Brand Accent Dots & Collapse Button */}
          <div
            className={`flex items-center pb-2.5 border-b border-outline-variant/50 ${
              isCollapsed ? "flex-col gap-2 justify-center" : "justify-between"
            }`}
          >
            {/* Tiga Titik Aksen Identitas Masjid (Emerald, Mint Sage, Archival Gold) */}
            <div className="flex items-center gap-1.5 px-1" title="DKM Al-Luqman">
              <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-2xs" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary-fixed shadow-2xs" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-gold shadow-2xs" />
            </div>

            {/* Tombol Toggle Buka/Tutup Sidebar */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
              title={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
              aria-label={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>

          {/* Logo & Identitas Masjid */}
          <div>
            {!isCollapsed ? (
              <Link href="/" className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-surface-container-high/60 transition-all group">
                <MasjidEmblem className="h-9 w-9 group-hover:scale-105 transition-transform shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold tracking-tight text-on-surface leading-tight font-sans truncate">
                    Masjid Archive
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary mt-0.5">
                    Sistem Kas &amp; Arsip
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
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary text-on-primary border border-primary-container text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  Masjid Archive
                </span>
              </Link>
            )}
          </div>

          {/* Menu Navigasi Utama (Fungsional, Bersih dari Kotak Pencarian Duplikat) */}
          <nav className="space-y-1.5 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.href;

              if (isCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`h-11 w-11 mx-auto flex items-center justify-center rounded-2xl transition-all duration-200 group relative ${
                      isActive
                        ? "bg-primary text-white font-bold shadow-md shadow-primary/30 ring-2 ring-primary-fixed/20 scale-105"
                        : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                    }`}
                  >
                    <Icon size={19} className="shrink-0" />
                    <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary text-on-primary border border-primary-container text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
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
                      ? "bg-primary text-white font-semibold shadow-xs shadow-primary/25"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                  }`}
                >
                  <Icon
                    size={19}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? "text-primary-fixed" : "text-outline group-hover:text-primary"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BAGIAN BAWAH: Aksi Khusus Staf & Panel Profil Pengguna */}
        <div className="space-y-3 pt-3 border-t border-outline-variant/50 relative">
          {/* KARTU SUB-ISLAND KHUSUS AKSI BERMAKNA (Hanya tampil jika ada aksi nyata) */}
          {isStaff(session) && (
            !isCollapsed ? (
              <div className="rounded-2xl bg-surface-container-high/75 border border-outline-variant/60 p-2 shadow-2xs space-y-0.5 animate-in fade-in duration-200">
                <Link
                  href="/?view=public"
                  className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-white hover:text-primary transition-colors group"
                  title="Buka tampilan transparansi publik untuk jemaah"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink size={14} className="text-primary" />
                    <span>Lihat Portal Publik</span>
                  </span>
                  <ChevronRight size={13} className="text-outline group-hover:text-primary opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            ) : (
              /* Versi Ciut (Ikon Portal Publik dengan Tooltip) */
              <div className="w-11 mx-auto py-1.5 rounded-2xl bg-surface-container-high/80 border border-outline-variant/60 flex flex-col items-center shadow-2xs animate-in fade-in duration-200">
                <Link
                  href="/?view=public"
                  className="text-on-surface-variant hover:text-primary p-2 rounded-xl hover:bg-white transition-colors group relative"
                  title="Lihat Beranda Publik"
                >
                  <ExternalLink size={16} />
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary text-on-primary border border-primary-container text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    Portal Publik
                  </span>
                </Link>
              </div>
            )
          )}

          {/* KARTU PROFIL PENGGUNA (Dengan Menu Popover Fungsional & Nyata) */}
          <div ref={profileMenuRef} className="relative">
            {/* Popover Menu Akun Interaktif */}
            {isProfileMenuOpen && session && (
              <div
                className={`absolute bottom-[calc(100%+12px)] rounded-2xl bg-surface-container border border-outline-variant shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isCollapsed ? "left-0 w-64" : "left-0 right-0"
                }`}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/60">
                  {session.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "Avatar"}
                      className="h-10 w-10 rounded-full ring-2 ring-primary/30 object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm ring-2 ring-primary/20 shrink-0">
                      {userName.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-on-surface truncate">
                      {session.user?.name || "Pengurus DKM"}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {session.user?.email || "Akun Terverifikasi"}
                    </span>
                    <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 w-fit">
                      {role || "Jamaah"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  {isStaff(session) && (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-high hover:text-primary transition-colors"
                    >
                      <LayoutDashboard size={14} className="text-primary" />
                      <span>Kokpit Dashboard Kas</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={14} className="text-rose-600" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </div>
            )}

            {session ? (
              !isCollapsed ? (
                <div
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center justify-between p-2 rounded-2xl bg-surface-container-high/50 border border-outline-variant/50 text-on-surface hover:bg-surface-container-high transition-all cursor-pointer group"
                  title="Klik untuk membuka menu akun"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "Avatar"}
                        className="h-9 w-9 rounded-full ring-2 ring-primary/20 object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shrink-0">
                        {userName.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate leading-tight group-hover:text-primary transition-colors">
                        Welcome, {userFirstName}
                      </span>
                      <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md mt-0.5 inline-block w-fit truncate">
                        {role || "Jamaah"}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg text-on-surface-variant group-hover:text-primary group-hover:bg-white transition-colors shrink-0">
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-200 ${isProfileMenuOpen ? "-rotate-90" : ""}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center group relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="focus:outline-hidden"
                    title="Menu Akun"
                  >
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "Avatar"}
                        className="h-9 w-9 rounded-full ring-2 ring-primary/30 object-cover cursor-pointer hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs ring-2 ring-primary/30 cursor-pointer hover:scale-105 transition-transform">
                        {userName.charAt(0)}
                      </div>
                    )}
                  </button>
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary text-on-primary border border-primary-container text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
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
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-primary text-white hover:bg-primary-container text-xs font-bold transition-all shadow-xs"
                >
                  <LogIn size={15} className="text-primary-fixed" />
                  <span>Akses Pengurus</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                  className="h-10 w-10 mx-auto flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-container transition-all group relative shadow-xs"
                  title="Akses Pengurus DKM"
                >
                  <LogIn size={16} className="text-primary-fixed" />
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-primary text-on-primary border border-primary-container text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
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
      {/* MOBILE MODERN CURVED WAVE BOTTOM NAVIGATION BAR           */}
      {/* (Desain Gelombang Mengikuti Tab Aktif Sesuai Referensi)     */}
      {/* ========================================================= */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#133827] text-white shadow-2xl border-t border-emerald-900/60 pb-[env(safe-area-inset-bottom)] select-none"
      >
        <div className="relative h-16 flex items-center overflow-visible">
          {/* Gelombang Mengambang Halus (Smooth Fluid Wave & Floating Bubble) */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none transition-transform duration-350 ease-out will-change-transform"
            style={{
              width: `${100 / navItems.length}%`,
              transform: `translateX(${safeActiveIndex * 100}%)`,
            }}
          >
            {/* Bentuk Gelombang Lengkung Atas (SVG Wave Bridge) */}
            <div className="absolute -top-[19px] left-1/2 -translate-x-1/2 w-24 h-5 flex justify-center pointer-events-none">
              <svg
                viewBox="0 0 96 20"
                className="w-24 h-5 fill-[#133827] filter drop-shadow-[0_-2px_4px_rgba(0,0,0,0.15)]"
                preserveAspectRatio="none"
              >
                <path d="M 0 20 C 22 20 28 2 48 2 C 68 2 74 20 96 20 Z" />
              </svg>
            </div>

            {/* Balon Lingkaran Melayang (Floating Elevated Bubble) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary ring-4 ring-[#133827] shadow-xl shadow-black/50 flex items-center justify-center text-white transition-transform duration-200">
              <ActiveNavIcon size={21} className="text-white drop-shadow-xs" />
            </div>
          </div>

          {/* Tombol Tab Navigasi */}
          <div className="w-full flex items-center justify-around z-10">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === safeActiveIndex;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOptimisticActive(item.href)}
                  className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 text-center group cursor-pointer relative"
                >
                  {/* Ikon di garis datar: disembunyikan saat aktif karena sudah terangkat ke balon gelombang */}
                  <div
                    className={`transition-all duration-200 flex items-center justify-center ${
                      isActive ? "opacity-0 -translate-y-3 pointer-events-none" : "opacity-100 translate-y-0 text-emerald-200/75 group-hover:text-white"
                    }`}
                  >
                    <Icon size={19} className="shrink-0" />
                  </div>

                  {/* Label Teks Navigasi */}
                  <span
                    className={`text-[10px] sm:text-[11px] leading-tight truncate px-1 transition-all duration-200 ${
                      isActive
                        ? "text-primary-fixed font-bold translate-y-1.5"
                        : "text-emerald-200/60 font-medium translate-y-0.5 group-hover:text-emerald-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}