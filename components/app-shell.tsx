"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  ImagePlus,
  LayoutDashboard,
  Search,
  Users,
  Receipt,
  Wallet,
  Landmark,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronRight,
  ChevronDown,
  Bell,
  LogIn,
  Menu,
  ShieldCheck,
  CheckCircle2,
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

/**
 * Siluet Arsitektur Kubah & Menara Masjid (Watermark Halus di Sidebar)
 * Dibuat berbasis vektor murni SVG yang ringan dan elegan sesuai referensi.
 */
function MosqueSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 130"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Menara Kiri */}
      <rect x="22" y="50" width="7" height="80" rx="1" />
      <polygon points="25.5,24 20,50 31,50" />
      <circle cx="25.5" cy="21" r="2.5" />
      <line x1="25.5" y1="14" x2="25.5" y2="21" stroke="currentColor" strokeWidth="1" />

      {/* Kubah Sekunder Kiri */}
      <path d="M 45 130 L 45 80 Q 45 58 65 58 Q 85 58 85 80 L 85 130 Z" />
      <polygon points="65,51 62,58 68,58" />
      <circle cx="65" cy="48" r="1.5" />

      {/* Kubah Utama Megah Tengah */}
      <path d="M 95 130 L 95 70 Q 95 32 150 26 Q 205 32 205 70 L 205 130 Z" />
      <polygon points="150,16 145,26 155,26" />
      <circle cx="150" cy="13" r="2.5" />
      <line x1="150" y1="6" x2="150" y2="13" stroke="currentColor" strokeWidth="1.2" />

      {/* Kubah Sekunder Kanan */}
      <path d="M 215 130 L 215 80 Q 215 58 235 58 Q 255 58 255 80 L 255 130 Z" />
      <polygon points="235,51 232,58 238,58" />
      <circle cx="235" cy="48" r="1.5" />

      {/* Menara Kanan */}
      <rect x="271" y="50" width="7" height="80" rx="1" />
      <polygon points="274.5,24 269,50 280,50" />
      <circle cx="274.5" cy="21" r="2.5" />
      <line x1="274.5" y1="14" x2="274.5" y2="21" stroke="currentColor" strokeWidth="1" />

      {/* Lengkungan Jendela Berulang di Dasar Gedung */}
      <path d="M 115 130 L 115 105 A 10 10 0 0 1 135 105 L 135 130 Z" opacity="0.3" />
      <path d="M 165 130 L 165 105 A 10 10 0 0 1 185 105 L 185 130 Z" opacity="0.3" />
    </svg>
  );
}

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "/" | "/unggah" | "/cari" | "/pengguna" | "/dashboard" | "/donatur" | "/pengeluaran" | "/keuangan";
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [optimisticActive, setOptimisticActive] = React.useState<string | null>(null);

  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const headerProfileRef = React.useRef<HTMLDivElement>(null);
  const notificationRef = React.useRef<HTMLDivElement>(null);

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

  // Click outside listener for profile and notification popovers
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target) &&
        headerProfileRef.current &&
        !headerProfileRef.current.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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
  const userName = session?.user?.name || "Reza Dwi";
  const userFirstName = userName.split(" ")[0];

  const currentActive = optimisticActive ?? active;
  const activeIndex = navItems.findIndex((item) => item.href === currentActive);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const ActiveNavIcon = navItems[safeActiveIndex]?.icon ?? Landmark;

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col font-sans">
      {/* ========================================================= */}
      {/* DESKTOP MODERN DOCKED COLLAPSIBLE SIDEBAR                 */}
      {/* ========================================================= */}
      <aside
        aria-label="Navigasi Utama Desktop"
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-30 flex-col justify-between bg-primary text-white border-r border-emerald-950/40 select-none overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {/* Ilustrasi Masjid Autentik Sesuai Referensi Pengguna (Persis media_1792723264079) */}
        {!isCollapsed && (
          <div className="absolute bottom-[200px] left-0 right-0 h-48 pointer-events-none overflow-hidden select-none z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sidebar-mosque-clean.png"
              alt="Ilustrasi Masjid DKM"
              className="w-full h-full object-cover object-bottom opacity-85"
            />
          </div>
        )}

        {/* BAGIAN ATAS: Header Identitas & Menu Navigasi Utama */}
        <div className="flex flex-col z-10">
          {/* Top Bar: Masjid Brand Accent & Collapse Button (Tinggi h-16 menyatu rata dengan header) */}
          <div
            className={`h-16 flex items-center border-b border-white/10 ${
              isCollapsed ? "justify-center px-2" : "justify-between px-4"
            }`}
          >
            {!isCollapsed ? (
              <Link href="/" className="flex items-center gap-3 group">
                <MasjidEmblem className="h-9 w-9 group-hover:scale-105 transition-transform shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold tracking-tight text-white leading-tight font-sans truncate">
                    Masjid<span className="font-semibold text-primary-fixed">Archive</span>
                  </span>
                  <span className="text-[9.5px] uppercase font-bold tracking-wider text-emerald-200/80 mt-0.5">
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
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface text-on-surface border border-outline-variant text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  Masjid Archive
                </span>
              </Link>
            )}

            {/* Tombol Toggle Buka/Tutup Sidebar */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-emerald-100/75 hover:text-white hover:bg-white/10 transition-colors"
              title={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
              aria-label={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Menu Navigasi Utama (Dengan Gaya Kapsul Halus & Chevron Rapi Sesuai Referensi) */}
          <nav className={`space-y-1 pt-3 ${isCollapsed ? "px-2" : "px-3"}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.href;

              if (isCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`h-11 w-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? "bg-white/20 text-white font-bold border border-white/15 shadow-sm scale-105"
                        : "text-emerald-100/75 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon size={19} className="shrink-0" />
                    <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface text-on-surface border border-outline-variant text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-white/15 text-white font-semibold border border-white/10 shadow-xs backdrop-blur-xs"
                      : "text-emerald-100/80 hover:text-white hover:bg-white/10 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      size={18}
                      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? "text-primary-fixed" : "text-emerald-200/70 group-hover:text-white"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {!isActive && (
                    <ChevronRight
                      size={13}
                      className="text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BAGIAN BAWAH: Kartu Kutipan Amanah, Portal Publik, & Panel Profil Pengguna */}
        <div className={`space-y-3 py-3.5 border-t border-white/10 relative z-10 ${isCollapsed ? "px-2" : "px-3"}`}>
          {/* KARTU KUTIPAN AMANAH (Persis Referensi Gambar 1 & media_1792723264079) */}
          {!isCollapsed && (
            <div className="rounded-2xl bg-[#0f3b28]/80 border border-emerald-500/20 p-3.5 backdrop-blur-md text-white animate-in fade-in duration-200 shadow-sm">
              <p className="text-xs font-semibold leading-relaxed tracking-wide text-white">
                &ldquo;Transparansi adalah bagian dari amanah.&rdquo;
              </p>
              <p className="text-[10.5px] text-emerald-300/80 mt-1.5 font-medium">
                &mdash; DKM Masjid Al-Luqman
              </p>
            </div>
          )}

          {/* KARTU AKSI CEPAT / PORTAL PUBLIK */}
          {isStaff(session) && (
            !isCollapsed ? (
              <Link
                href="/?view=public"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0f3b28]/80 border border-emerald-500/20 text-xs font-semibold text-white hover:bg-[#144731] hover:border-emerald-400/30 transition-all group shadow-sm"
                title="Buka tampilan transparansi publik untuk jemaah"
              >
                <span className="flex items-center gap-2.5">
                  <ExternalLink size={14} className="text-white" />
                  <span>Lihat Portal Publik</span>
                </span>
                <ChevronRight size={13} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            ) : (
              <div className="w-10 mx-auto py-1 rounded-xl bg-[#0f3b28]/80 border border-emerald-500/20 flex flex-col items-center animate-in fade-in duration-200">
                <Link
                  href="/?view=public"
                  className="text-emerald-100/75 hover:text-white p-2 rounded-lg hover:bg-white/20 transition-colors group relative"
                  title="Lihat Beranda Publik"
                >
                  <ExternalLink size={16} />
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface text-on-surface border border-outline-variant text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    Portal Publik
                  </span>
                </Link>
              </div>
            )
          )}

          {/* KARTU PROFIL PENGGUNA (Dengan Menu Popover Fungsional) */}
          <div ref={profileMenuRef} className="relative">
            {/* Popover Menu Akun Interaktif */}
            {isProfileMenuOpen && session && (
              <div
                className={`absolute bottom-[calc(100%+12px)] rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isCollapsed ? "left-0 w-64" : "left-0 right-0"
                }`}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  {session.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "Avatar"}
                      className="h-10 w-10 rounded-full ring-2 ring-emerald-600/30 object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#3b6d53] text-white flex items-center justify-center font-bold text-sm ring-2 ring-emerald-600/20 shrink-0">
                      {userName.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {session.user?.name || "Pengurus DKM"}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {session.user?.email || "Akun Terverifikasi"}
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 w-fit">
                      {role || "ADMIN"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  {isStaff(session) && (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      <LayoutDashboard size={14} className="text-emerald-700" />
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
                  className="flex items-center justify-between p-2 rounded-xl bg-[#0f3b28]/80 border border-emerald-500/20 text-white hover:bg-[#144731] transition-all cursor-pointer group shadow-sm"
                  title="Klik untuk membuka menu akun"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "Avatar"}
                        className="h-9 w-9 rounded-full ring-2 ring-white/20 object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-[#3b6d53] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white/10 shrink-0">
                        {userName.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate leading-tight group-hover:text-primary-fixed transition-colors">
                        Welcome, {userFirstName}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5 inline-block w-fit truncate">
                        {role || "ADMIN"}
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-white/60 group-hover:text-white transition-transform duration-200 shrink-0 ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
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
                        className="h-9 w-9 rounded-full ring-2 ring-white/20 object-cover cursor-pointer hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white/20 cursor-pointer hover:scale-105 transition-transform">
                        {userName.charAt(0)}
                      </div>
                    )}
                  </button>
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface text-on-surface border border-outline-variant text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    {userName} ({role || "ADMIN"})
                  </span>
                </div>
              )
            ) : (
              /* Saat Tamu / Belum Login */
              !isCollapsed ? (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white text-primary hover:bg-primary-fixed text-xs font-bold transition-all shadow-md"
                >
                  <LogIn size={15} className="text-primary" />
                  <span>Akses Pengurus</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                  className="h-10 w-10 mx-auto flex items-center justify-center rounded-xl bg-white text-primary hover:bg-primary-fixed transition-all group relative shadow-md"
                  title="Akses Pengurus DKM"
                >
                  <LogIn size={16} className="text-primary" />
                  <span className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface text-on-surface border border-outline-variant text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                    Akses Pengurus
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* AREA KONTEN UTAMA DENGAN HEADER PENCARIAN MODERN           */}
      {/* ========================================================= */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        }`}
      >
        {/* Structural Header (Tinggi h-16 dengan Search Bar Kapsul & Profil Sesuai Referensi) */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-emerald-950/8 bg-white/95 backdrop-blur-md px-4 lg:px-8 shadow-2xs">
          {/* Sisi Kiri: Tombol Hamburger & Bilah Pencarian Kapsul Global */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Tombol Toggle Sidebar untuk Mobile & Desktop */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Toggle Menu Navigasi"
              aria-label="Toggle Menu Navigasi"
            >
              <Menu size={19} />
            </button>

            {/* Mobile Brand Title */}
            <div className="lg:hidden flex items-center gap-2 mr-1 shrink-0">
              <MasjidEmblem className="h-7 w-7" />
              <span className="text-sm font-bold tracking-tight text-slate-900 truncate">
                Masjid<span className="text-emerald-800">Archive</span>
              </span>
            </div>

            {/* Global Search Bar (Fungsional Menuju /cari) */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:flex items-center w-full max-w-md">
              <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari laporan, transaksi, atau kata kunci..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 transition-all shadow-2xs"
              />
            </form>
          </div>

          {/* Sisi Kanan: Lonceng Notifikasi & Lencana Profil DKM */}
          <div className="flex items-center gap-3">
            {/* Lonceng Notifikasi Sistem Interaktif */}
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="p-2 rounded-full text-slate-600 hover:text-emerald-800 hover:bg-slate-100 transition-colors relative"
                title="Pemberitahuan Sistem"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-700" />
                      <span className="text-xs font-bold text-slate-800">Status Keuangan Masjid</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Aktif
                    </span>
                  </div>
                  <div className="py-2.5 space-y-2.5">
                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                      <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800 leading-tight">Kas Fisik &amp; Bank Tersinkron</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Saldo kas DKM Al-Luqman terverifikasi mutasi internal.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profil Pengguna / DKM di Header (Sesuai Referensi Gambar 1 & 2) */}
            <div ref={headerProfileRef} className="relative">
              {session ? (
                <div
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="h-7 w-7 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {userName.charAt(0)}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {userName}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800">
                      {role || "ADMIN"}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-all shadow-xs"
                >
                  <LogIn size={13} />
                  <span>Akses Pengurus</span>
                </button>
              )}
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
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-primary text-white shadow-2xl border-t border-emerald-950/40 pb-[env(safe-area-inset-bottom)] select-none"
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
            {/* Bentuk Gelombang Lengkung Atas (SVG Wave Bridge) - Selaras 100% dengan bg-primary (#0e3824) */}
            <div className="absolute -top-[19px] left-1/2 -translate-x-1/2 w-24 h-5 flex justify-center pointer-events-none">
              <svg
                viewBox="0 0 96 20"
                className="w-24 h-5 fill-primary filter drop-shadow-[0_-2px_4px_rgba(0,0,0,0.25)]"
                preserveAspectRatio="none"
              >
                <path d="M 0 20 C 22 20 28 2 48 2 C 68 2 74 20 96 20 Z" />
              </svg>
            </div>

            {/* Balon Lingkaran Melayang: Background Putih (#ffffff) & Ikon Hijau (#0e3824) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white ring-4 ring-primary shadow-xl shadow-black/40 flex items-center justify-center text-primary transition-transform duration-200">
              <ActiveNavIcon size={21} className="text-primary" />
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
                  className="flex flex-1 min-w-0 flex-col items-center justify-center min-h-[48px] py-1 text-center group cursor-pointer relative"
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
                    className={`text-[10px] sm:text-[11px] leading-tight truncate w-full px-1 transition-all duration-200 ${
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