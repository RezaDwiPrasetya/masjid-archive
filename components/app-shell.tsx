"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

function subscribeSidebarStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSidebarSnapshot() {
  return typeof window !== "undefined" && localStorage.getItem("masjid_sidebar_collapsed") === "true";
}

function getSidebarServerSnapshot() {
  return false;
}

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "/" | "/unggah" | "/cari" | "/pengguna" | "/dashboard" | "/donatur" | "/pengeluaran" | "/keuangan";
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const storedCollapsed = React.useSyncExternalStore(
    subscribeSidebarStorage,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );
  const [manualCollapsed, setManualCollapsed] = React.useState<boolean | null>(null);
  const isCollapsed = manualCollapsed ?? storedCollapsed;

  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [isSidebarProfileOpen, setIsSidebarProfileOpen] = React.useState(false);
  const [isSidebarNotificationOpen, setIsSidebarNotificationOpen] = React.useState(false);
  const [optimisticActive, setOptimisticActive] = React.useState<string | null>(null);

  // Adjust optimistic active during render when prop changes (React recommended pattern)
  const [prevActive, setPrevActive] = React.useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    setOptimisticActive(null);
  }

  // State untuk penanda aktif menu navigasi publik (mendukung klik langsung & scrollspy presisi)
  const [activePublicNav, setActivePublicNav] = React.useState<string>(() => {
    if (pathname.startsWith("/laporan") || active === "/cari") return "#arsip-laporan";
    if (active === "/pengeluaran") return "#alokasi-belanja";
    if (active === "/donatur") return "#cek-infaq";
    return "beranda";
  });

  // Ref untuk mengunci scrollspy saat tombol sedang diklik (mencegah flickering/miss kalkulasi)
  const isNavClickingRef = React.useRef(false);
  const navClickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handlePublicNavClick = (
    target: "beranda" | "#alokasi-belanja" | "#cek-infaq" | "#rekening-resmi" | "#arsip-laporan",
    e: React.MouseEvent
  ) => {
    // Jika berada di luar beranda utama "/", biarkan browser bernavigasi normal ke rute target
    if (pathname !== "/") {
      setActivePublicNav(target);
      return;
    }

    e.preventDefault();
    isNavClickingRef.current = true;
    setActivePublicNav(target);

    if (target === "beranda") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    } else {
      const el = document.getElementById(target.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", target);
      }
    }

    // Kunci scroll listener selama 850ms agar animasi smooth scroll selesai tanpa interupsi
    if (navClickTimeoutRef.current) clearTimeout(navClickTimeoutRef.current);
    navClickTimeoutRef.current = setTimeout(() => {
      isNavClickingRef.current = false;
    }, 850);
  };

  // Sinkronisasi ScrollSpy Akurat pada Beranda Publik
  React.useEffect(() => {
    if (pathname !== "/" || typeof window === "undefined") {
      if (pathname.startsWith("/laporan") || active === "/cari") setActivePublicNav("#arsip-laporan");
      else if (active === "/pengeluaran") setActivePublicNav("#alokasi-belanja");
      else if (active === "/donatur") setActivePublicNav("#cek-infaq");
      else setActivePublicNav("beranda");
      return;
    }

    const sectionIds = ["alokasi-belanja", "cek-infaq", "rekening-resmi", "arsip-laporan"];

    const handleScroll = () => {
      // Jika pengguna baru saja mengklik menu, abaikan event scroll agar tidak melompat
      if (isNavClickingRef.current) return;

      // Beranda / Hero Card: Jika scroll dekat dengan bagian atas halaman (< 180px)
      if (window.scrollY < 180) {
        setActivePublicNav("beranda");
        return;
      }

      // Deteksi seksi yang posisinya paling relevan di viewport
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Offset 160px di bawah navbar sticky memberikan ambang batas baca ideal
          if (rect.top <= 160) {
            setActivePublicNav(`#${id}`);
            return;
          }
        }
      }

      setActivePublicNav("beranda");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    if (window.location.hash) {
      setActivePublicNav(window.location.hash);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (navClickTimeoutRef.current) clearTimeout(navClickTimeoutRef.current);
    };
  }, [active]);

  const headerProfileRef = React.useRef<HTMLDivElement>(null);
  const headerNotificationRef = React.useRef<HTMLDivElement>(null);
  const sidebarProfileRef = React.useRef<HTMLDivElement>(null);
  const sidebarNotificationRef = React.useRef<HTMLDivElement>(null);

  // Click outside listener for profile and notification popovers
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (headerProfileRef.current && !headerProfileRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
      if (headerNotificationRef.current && !headerNotificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
      if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(target)) {
        setIsSidebarProfileOpen(false);
      }
      if (sidebarNotificationRef.current && !sidebarNotificationRef.current.contains(target)) {
        setIsSidebarNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setManualCollapsed(next);
    try {
      localStorage.setItem("masjid_sidebar_collapsed", String(next));
    } catch {}
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
  const userEmail = session?.user?.email;

  const currentActive = optimisticActive ?? active;
  const activeIndex = navItems.findIndex((item) => item.href === currentActive);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const ActiveNavIcon = navItems[safeActiveIndex]?.icon ?? Landmark;

  // Penentuan mode tampilan:
  // 1. Sesi Staf Operasional: Pengguna yang login dengan peran ADMIN/BENDAHARA menggunakan Sidebar
  //    Desktop Emerald (kecuali saat berada di beranda publik active === "/").
  // 2. Portal Publik Jemaah: Pengguna tamu/jemaah tanpa login (di seluruh rute) atau staf yang sedang
  //    membuka beranda publik menggunakan Top Navbar Terpusat Full-Width tanpa sidebar samping.
  const isStaffUser = isStaff(session);
  const showStaffSidebar = isStaffUser && active !== "/";

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col font-sans">
      {/* ========================================================= */}
      {/* DESKTOP MODERN DOCKED COLLAPSIBLE SIDEBAR (KHUSUS STAF)   */}
      {/* ========================================================= */}
      {showStaffSidebar && (
        <aside
          aria-label="Navigasi Utama Desktop"
          className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-30 flex-col justify-between bg-primary text-white border-r border-emerald-950/40 select-none transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-[72px]" : "w-[260px]"
          }`}
        >
        {/* Ilustrasi Masjid Autentik Sesuai Referensi Pengguna (Persis media_1792723264079) */}
        {!isCollapsed && (
          <div className="absolute bottom-[72px] left-0 right-0 h-48 pointer-events-none overflow-hidden select-none z-0">
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
          {/* Top Bar: Masjid Brand Accent & Collapse Button (Rapi, lega, tidak berdesakan) */}
          <div
            className={`border-b border-white/10 ${
              isCollapsed
                ? "py-3 flex flex-col items-center justify-center gap-2"
                : "h-16 flex items-center justify-between px-4"
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
                className="flex items-center justify-center p-1 rounded-xl hover:bg-white/10 transition-colors group relative"
                title="Masjid Archive - Sistem Kas & Arsip"
              >
                <MasjidEmblem className="h-8 w-8 group-hover:scale-105 transition-transform shrink-0" />
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface text-on-surface border border-outline-variant text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  Masjid Archive
                </span>
              </Link>
            )}

            {/* Tombol Toggle Buka/Tutup Sidebar (Terpisah rapi dengan ruang yang lega) */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-emerald-100/75 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
              aria-label={isCollapsed ? "Bentangkan Sidebar" : "Ciutkan Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Menu Navigasi Utama (Bersih tanpa chevron dropdown yang membingungkan) */}
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
                  className={`group flex items-center rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
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
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BAGIAN BAWAH: Integrasi Profil Pengguna & Aksi Sesi Modern di Sidebar Desktop */}
        {session ? (
          !isCollapsed ? (
            /* Mode Sidebar Lebar: Kartu Profil Lengkap + Lonceng Notifikasi */
            <div className="p-3 border-t border-white/10 relative z-20 bg-primary">
              <div className="flex items-center gap-2">
                {/* Kartu Profil DKM Interaktif */}
                <div ref={sidebarProfileRef} className="relative flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarProfileOpen((prev) => !prev);
                      setIsSidebarNotificationOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left cursor-pointer group ${
                      isSidebarProfileOpen
                        ? "bg-white/20 border-white/20"
                        : "bg-white/10 hover:bg-white/15 border-white/10"
                    }`}
                    aria-label="Menu Profil & Akun"
                  >
                    <div className="h-8 w-8 rounded-full bg-emerald-500/90 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-white/20 group-hover:scale-105 transition-transform">
                      {userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white leading-tight truncate">
                        {userName}
                      </p>
                      <span className="text-[9.5px] uppercase font-bold tracking-wider text-emerald-200/90 bg-white/10 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                        {role || "ADMIN"}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-white/60 group-hover:text-white transition-transform duration-200 shrink-0 ${
                        isSidebarProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Popover Menu Profil (Membuka ke atas dari footer sidebar) */}
                  {isSidebarProfileOpen && (
                    <div className="absolute left-0 bottom-[calc(100%+8px)] w-60 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                        {userEmail && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{userEmail}</p>
                        )}
                        <span className="mt-1.5 inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                          {role || "ADMIN"}
                        </span>
                      </div>

                      <div className="py-1">
                        {isAdmin(session) && (
                          <Link
                            href="/pengguna"
                            onClick={() => setIsSidebarProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-800 transition-colors"
                          >
                            <Users size={15} />
                            <span>Kelola Pengguna</span>
                          </Link>
                        )}
                        <Link
                          href="/?view=public"
                          onClick={() => setIsSidebarProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-800 transition-colors"
                        >
                          <ExternalLink size={15} />
                          <span>Lihat Portal Publik</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSidebarProfileOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                        >
                          <LogOut size={15} />
                          <span>Keluar (Logout)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lonceng Notifikasi Sidebar */}
                <div ref={sidebarNotificationRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarNotificationOpen((prev) => !prev);
                      setIsSidebarProfileOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSidebarNotificationOpen
                        ? "bg-white/20 border-white/20 text-white"
                        : "bg-white/10 hover:bg-white/15 border-white/10 text-emerald-100/90 hover:text-white"
                    }`}
                    title="Pemberitahuan Sistem"
                  >
                    <Bell size={16} />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-primary" />
                  </button>

                  {/* Popover Notifikasi (Membuka ke atas dari footer sidebar) */}
                  {isSidebarNotificationOpen && (
                    <div className="absolute right-[-80px] bottom-[calc(100%+8px)] w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
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
              </div>
            </div>
          ) : (
            /* Mode Sidebar Ciut (72px): Avatar & Lonceng Ringkas */
            <div className="py-3 px-2 border-t border-white/10 relative z-20 flex flex-col items-center gap-2 bg-primary">
              {/* Lonceng Notifikasi */}
              <div ref={sidebarNotificationRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarNotificationOpen((prev) => !prev);
                    setIsSidebarProfileOpen(false);
                  }}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer relative ${
                    isSidebarNotificationOpen
                      ? "bg-white/20 border-white/20 text-white"
                      : "bg-white/5 hover:bg-white/15 border-white/10 text-emerald-100/90 hover:text-white"
                  }`}
                  title="Pemberitahuan Sistem"
                >
                  <Bell size={17} />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-primary" />
                </button>

                {/* Popover Notifikasi ke kanan di sidebar ciut */}
                {isSidebarNotificationOpen && (
                  <div className="absolute left-[calc(100%+12px)] bottom-0 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-left-2 duration-150">
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

              {/* Avatar Profil */}
              <div ref={sidebarProfileRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarProfileOpen((prev) => !prev);
                    setIsSidebarNotificationOpen(false);
                  }}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer group ${
                    isSidebarProfileOpen
                      ? "bg-white/25 border-white/25 text-white scale-105"
                      : "bg-white/10 hover:bg-white/20 border-white/15 text-white"
                  }`}
                  title={`${userName} (${role || "ADMIN"})`}
                >
                  <div className="h-7 w-7 rounded-full bg-emerald-500/90 text-white flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
                    {userName.charAt(0)}
                  </div>
                </button>

                {/* Popover Profil ke kanan di sidebar ciut */}
                {isSidebarProfileOpen && (
                  <div className="absolute left-[calc(100%+12px)] bottom-0 w-60 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 text-slate-800 animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                      {userEmail && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{userEmail}</p>
                      )}
                      <span className="mt-1.5 inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                        {role || "ADMIN"}
                      </span>
                    </div>

                    <div className="py-1">
                      {isAdmin(session) && (
                        <Link
                          href="/pengguna"
                          onClick={() => setIsSidebarProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-800 transition-colors"
                        >
                          <Users size={15} />
                          <span>Kelola Pengguna</span>
                        </Link>
                      )}
                      <Link
                        href="/?view=public"
                        onClick={() => setIsSidebarProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-800 transition-colors"
                      >
                        <ExternalLink size={15} />
                        <span>Lihat Portal Publik</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSidebarProfileOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* Saat Belum Login: Tombol Masuk / Akses Pengurus */
          !isCollapsed ? (
            <div className="p-3 border-t border-white/10 relative z-20 bg-primary">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold transition-all shadow-xs cursor-pointer group"
              >
                <LogIn size={15} className="text-emerald-200 group-hover:text-white transition-colors" />
                <span>Akses Pengurus</span>
              </button>
            </div>
          ) : (
            <div className="py-3 px-2 border-t border-white/10 relative z-20 flex justify-center bg-primary">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all group relative cursor-pointer"
                title="Akses Pengurus"
              >
                <LogIn size={17} />
                <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-surface text-on-surface border border-outline-variant text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  Akses Pengurus
                </span>
              </button>
            </div>
          )
        )}
        </aside>
      )}

      {/* ========================================================= */}
      {/* AREA KONTEN UTAMA DENGAN HEADER MOBILE & TOP NAVBAR PUBLIK */}
      {/* ========================================================= */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          showStaffSidebar ? (isCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]") : "lg:pl-0"
        }`}
      >
        {/* ========================================================= */}
        {/* DESKTOP PUBLIC CENTERED TOP NAVBAR (KHUSUS MODE PUBLIK)   */}
        {/* ========================================================= */}
        {!showStaffSidebar && (
          /* ─────────────────────────────────────────────────────────────── *
           * FULL SOLID NAVBAR — Desktop Public Portal                      *
           * Full-width sticky solid header (like ASUS reference) without   *
           * floating cards or vertical border dividers.                    *
           * ─────────────────────────────────────────────────────────────── */
          <header className="hidden lg:block sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
            <div className="w-full flex items-stretch px-6 lg:px-10" style={{ minHeight: "64px" }}>

              {/* ── LEFT: Brand identity (clean, no vertical divider) ── */}
              <div className="flex items-center gap-3 pr-6 shrink-0">
                <MasjidEmblem className="h-10 w-10 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap">
                      DKM Masjid Al-Luqman
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold whitespace-nowrap">
                      Portal Transparansi
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                    Kel. Soklat, Subang &middot; Akuntabilitas Terbuka
                  </span>
                </div>
              </div>

              {/* ── CENTER: Navigation — fills remaining space, clean underline indicator ───── */}
              <nav className="flex-1 flex items-stretch" aria-label="Navigasi Portal Publik">
                {(
                  [
                    { key: "beranda",          label: "Beranda",         href: "/" },
                    { key: "#alokasi-belanja", label: "Alokasi Belanja", href: pathname === "/" ? "#alokasi-belanja" : "/#alokasi-belanja" },
                    { key: "#cek-infaq",       label: "Cek Infaq Anda",  href: pathname === "/" ? "#cek-infaq"       : "/#cek-infaq" },
                    { key: "#rekening-resmi",  label: "Salurkan Infaq",  href: pathname === "/" ? "#rekening-resmi"  : "/#rekening-resmi" },
                    { key: "#arsip-laporan",   label: "Arsip Laporan",   href: pathname === "/" ? "#arsip-laporan"   : "/#arsip-laporan" },
                  ] as { key: "beranda" | "#alokasi-belanja" | "#cek-infaq" | "#rekening-resmi" | "#arsip-laporan"; label: string; href: string }[]
                ).map(({ key, label, href }) => {
                  const isActive = activePublicNav === key;
                  return (
                    <a
                      key={key}
                      href={href}
                      onClick={(e) => handlePublicNavClick(key, e)}
                      className={`relative flex flex-1 items-center justify-center cursor-pointer select-none transition-colors duration-200
                        ${isActive
                          ? "text-primary font-semibold"
                          : "text-slate-500 hover:text-slate-800 font-medium"}
                      `}
                    >
                      <span className="text-[13.5px] leading-none">{label}</span>
                      {/* Active indicator: clean green underline anchored to bottom edge */}
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] rounded-t-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: isActive ? "56%" : "0%", opacity: isActive ? 1 : 0 }}
                      />
                    </a>
                  );
                })}
              </nav>

              {/* ── RIGHT: CTA action (clean, no vertical divider) ──── */}
              <div className="flex items-center pl-6 shrink-0">
                {session ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-emerald-900 text-[13px] font-semibold shadow-sm transition-colors"
                    >
                      <LayoutDashboard size={15} />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Keluar"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/auth/post-login" })}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-emerald-900 text-[13px] font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <LogIn size={15} />
                    <span>Akses Pengurus</span>
                  </button>
                )}
              </div>
            </div>
          </header>
        )}
        {/* Header Khusus Mobile & Tablet (< lg). Di Desktop Disembunyikan (lg:hidden) */}
        <header className="lg:hidden sticky top-0 z-20 flex h-16 items-center justify-between border-b border-emerald-950/8 bg-white/95 backdrop-blur-md px-4 shadow-2xs">
          {/* Sisi Kiri: Brand Title Pada Tampilan Mobile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <MasjidEmblem className="h-7 w-7" />
              <span className="text-sm font-bold tracking-tight text-slate-900 truncate">
                Masjid<span className="text-emerald-800">Archive</span>
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Lonceng Notifikasi & Lencana Profil DKM */}
          <div className="flex items-center gap-3">
            {/* Lonceng Notifikasi Sistem Interaktif */}
            <div ref={headerNotificationRef} className="relative">
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
                <>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group focus:outline-none"
                    aria-label="Menu Profil & Keluar"
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
                  </button>

                  {/* Dropdown Menu Profil & Logout Interaktif */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                        {userEmail && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{userEmail}</p>
                        )}
                        <span className="mt-1.5 inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                          {role || "ADMIN"}
                        </span>
                      </div>

                      <div className="py-1">
                        {isAdmin(session) && (
                          <Link
                            href="/pengguna"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-800 transition-colors"
                          >
                            <Users size={15} />
                            <span>Kelola Pengguna</span>
                          </Link>
                        )}
                        <Link
                          href="/?view=public"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-800 transition-colors"
                        >
                          <ExternalLink size={15} />
                          <span>Lihat Portal Publik</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                        >
                          <LogOut size={15} />
                          <span>Keluar (Logout)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
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