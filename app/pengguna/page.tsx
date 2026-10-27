"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { useSession } from "next-auth/react";
import {
  ShieldAlert,
  UserCog,
  Search,
  Trash2,
  Users,
  ShieldCheck,
  UserCheck,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Lock,
  FileText,
  ChevronRight,
  ChevronLeft,
  Home,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

type UserItem = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null;
  _count?: {
    reports: number;
    verifiedTransactions: number;
  };
};

export default function PenggunaPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // State untuk dialog hapus
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Feedback banner
  const [alertFeedback, setAlertFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/users")
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => {
          setUsers(data);
          setHasFetched(true);
        })
        .catch((err) => {
          console.error(err);
          setHasFetched(true);
        });
    }
  }, [session]);

  const loading =
    status === "loading" || (session?.user?.role === "ADMIN" && !hasFetched);

  const handleRoleChange = async (userId: string, newRole: string | null) => {
    // Simpan data lama untuk revert jika gagal
    const previousUsers = [...users];

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        throw new Error("Gagal mengubah role");
      }

      setAlertFeedback({
        type: "success",
        message: "Hak akses pengguna berhasil diperbarui.",
      });
      setTimeout(() => setAlertFeedback(null), 4000);
    } catch {
      setUsers(previousUsers);
      setAlertFeedback({
        type: "error",
        message: "Terjadi kesalahan saat mengubah hak akses pengguna.",
      });
      setTimeout(() => setAlertFeedback(null), 5000);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    setDialogError(null);

    try {
      const res = await fetch(`/api/users?userId=${selectedUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setDialogError(data.error || "Gagal menghapus pengguna.");
        setIsDeleting(false);
        return;
      }

      // Hapus dari state lokal
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setSelectedUser(null);
      setIsDeleting(false);

      setAlertFeedback({
        type: "success",
        message: data.message || "Pengguna berhasil dihapus.",
      });
      setTimeout(() => setAlertFeedback(null), 4000);
    } catch {
      setDialogError("Terjadi gangguan koneksi saat menghapus pengguna.");
      setIsDeleting(false);
    }
  };

  // Filter pencarian dan role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name?.toLowerCase().includes(q) ?? false) ||
        (u.email?.toLowerCase().includes(q) ?? false);

      const matchesRole =
        roleFilter === "ALL"
          ? true
          : roleFilter === "ADMIN"
          ? u.role === "ADMIN"
          : roleFilter === "BENDAHARA"
          ? u.role === "BENDAHARA"
          : roleFilter === "JAMAAH"
          ? !u.role
          : true;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Statistik pengguna
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.role === "ADMIN").length,
      bendahara: users.filter((u) => u.role === "BENDAHARA").length,
      jamaah: users.filter((u) => !u.role).length,
    };
  }, [users]);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  if (status === "loading" || loading) {
    return (
      <AppShell active="/pengguna">
        <PageShell>
          <div className="flex h-[50vh] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Memuat data pengguna...</span>
          </div>
        </PageShell>
      </AppShell>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <AppShell active="/pengguna">
        <PageShell>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-2xs">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 font-sans">
                Akses Ditolak
              </h1>
              <p className="text-sm text-slate-500">
                Halaman ini khusus untuk Administrator sistem.
              </p>
            </div>
          </div>
        </PageShell>
      </AppShell>
    );
  }

  const hasAuditHistory =
    selectedUser &&
    (((selectedUser._count?.reports ?? 0) > 0) ||
      ((selectedUser._count?.verifiedTransactions ?? 0) > 0));

  return (
    <AppShell active="/pengguna">
      <PageShell>
        <div className="space-y-6 sm:space-y-8 pb-12">
          {/* UNIFIED HERO HEADER CARD (F-039) */}
          <div className="rounded-3xl bg-[#0e3824] text-white p-6 sm:p-8 lg:p-9 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5 sm:space-y-6">
              {/* Baris Atas: Judul Halaman & Ringkasan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Manajemen Pengguna
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
                    Pengaturan hak akses akun staf pengurus DKM, bendahara, dan jemaah masjid
                  </p>
                </div>
              </div>

              {/* Garis Pemisah Halus */}
              <div className="border-t border-white/10" />

              {/* Baris Bawah: Grid Metrik Akun & 3 Kartu Role KPI */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                {/* Sisi Kiri: Total Pengguna */}
                <div className="xl:col-span-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                    <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <Users size={14} />
                    </div>
                    <span>Total Pengguna Terdaftar</span>
                  </div>
                  <div className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-white tabular-nums leading-tight font-sans">
                    {stats.total} Akun
                  </div>
                  <div className="text-xs text-emerald-100/80">
                    Pengguna aktif dengan hak akses sistem terverifikasi
                  </div>
                </div>

                {/* Sisi Kanan: 3 Kartu Role Interaktif Emerald Glassmorphism */}
                <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card 1: Administrator */}
                  <div
                    onClick={() => {
                      setRoleFilter(roleFilter === "ADMIN" ? "ALL" : "ADMIN");
                      setPage(1);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm flex items-center justify-between gap-3 ${
                      roleFilter === "ADMIN"
                        ? "bg-white text-slate-900 border-white shadow-md ring-2 ring-emerald-400"
                        : "bg-[#144731]/80 border-emerald-400/20 text-white hover:bg-[#18533a]"
                    }`}
                    title="Klik untuk memfilter Administrator"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        roleFilter === "ADMIN" ? "bg-[#0e3824] text-white" : "bg-white/10 text-emerald-300 border border-white/10"
                      }`}>
                        <ShieldCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[10.5px] font-bold uppercase tracking-wider block leading-tight ${
                          roleFilter === "ADMIN" ? "text-emerald-900" : "text-emerald-200"
                        }`}>
                          Administrator
                        </span>
                        <div className={`text-xl font-bold tabular-nums mt-0.5 ${
                          roleFilter === "ADMIN" ? "text-slate-900" : "text-white"
                        }`}>
                          {stats.admin}
                        </div>
                        <span className={`text-[10px] block leading-tight mt-0.5 truncate ${
                          roleFilter === "ADMIN" ? "text-slate-500" : "text-emerald-300/80"
                        }`}>
                          Akses penuh sistem
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 ${
                      roleFilter === "ADMIN" ? "text-emerald-800" : "text-white/40"
                    }`} />
                  </div>

                  {/* Card 2: Bendahara */}
                  <div
                    onClick={() => {
                      setRoleFilter(roleFilter === "BENDAHARA" ? "ALL" : "BENDAHARA");
                      setPage(1);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm flex items-center justify-between gap-3 ${
                      roleFilter === "BENDAHARA"
                        ? "bg-white text-slate-900 border-white shadow-md ring-2 ring-emerald-400"
                        : "bg-[#144731]/80 border-emerald-400/20 text-white hover:bg-[#18533a]"
                    }`}
                    title="Klik untuk memfilter Bendahara"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        roleFilter === "BENDAHARA" ? "bg-[#0e3824] text-white" : "bg-white/10 text-emerald-300 border border-white/10"
                      }`}>
                        <UserCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[10.5px] font-bold uppercase tracking-wider block leading-tight ${
                          roleFilter === "BENDAHARA" ? "text-emerald-900" : "text-emerald-200"
                        }`}>
                          Bendahara
                        </span>
                        <div className={`text-xl font-bold tabular-nums mt-0.5 ${
                          roleFilter === "BENDAHARA" ? "text-slate-900" : "text-white"
                        }`}>
                          {stats.bendahara}
                        </div>
                        <span className={`text-[10px] block leading-tight mt-0.5 truncate ${
                          roleFilter === "BENDAHARA" ? "text-slate-500" : "text-emerald-300/80"
                        }`}>
                          Kelola kas &amp; laporan
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 ${
                      roleFilter === "BENDAHARA" ? "text-emerald-800" : "text-white/40"
                    }`} />
                  </div>

                  {/* Card 3: Jamaah / Publik */}
                  <div
                    onClick={() => {
                      setRoleFilter(roleFilter === "JAMAAH" ? "ALL" : "JAMAAH");
                      setPage(1);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm flex items-center justify-between gap-3 ${
                      roleFilter === "JAMAAH"
                        ? "bg-white text-slate-900 border-white shadow-md ring-2 ring-emerald-400"
                        : "bg-[#144731]/80 border-emerald-400/20 text-white hover:bg-[#18533a]"
                    }`}
                    title="Klik untuk memfilter Jamaah"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        roleFilter === "JAMAAH" ? "bg-[#0e3824] text-white" : "bg-white/10 text-emerald-300 border border-white/10"
                      }`}>
                        <Users size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[10.5px] font-bold uppercase tracking-wider block leading-tight ${
                          roleFilter === "JAMAAH" ? "text-emerald-900" : "text-emerald-200"
                        }`}>
                          Jamaah / Publik
                        </span>
                        <div className={`text-xl font-bold tabular-nums mt-0.5 ${
                          roleFilter === "JAMAAH" ? "text-slate-900" : "text-white"
                        }`}>
                          {stats.jamaah}
                        </div>
                        <span className={`text-[10px] block leading-tight mt-0.5 truncate ${
                          roleFilter === "JAMAAH" ? "text-slate-500" : "text-emerald-300/80"
                        }`}>
                          Akses baca transparan
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 ${
                      roleFilter === "JAMAAH" ? "text-emerald-800" : "text-white/40"
                    }`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Alert Banner */}
          {alertFeedback && (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs font-medium transition-all ${
                alertFeedback.type === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {alertFeedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{alertFeedback.message}</span>
              </div>
              <button
                onClick={() => setAlertFeedback(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Toolbar Pencarian dan Filter (Rounded-2xl Persis Mockup) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau email pengguna..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-9 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-2xl border border-slate-200/90 bg-white px-4 text-xs font-semibold text-slate-700 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 shadow-2xs cursor-pointer"
              >
                <option value="ALL">Semua Role ({users.length})</option>
                <option value="ADMIN">Administrator ({stats.admin})</option>
                <option value="BENDAHARA">Bendahara ({stats.bendahara})</option>
                <option value="JAMAAH">Jamaah ({stats.jamaah})</option>
              </select>
            </div>
          </div>

          {/* Tabel Daftar Pengguna (Card Rounded-2xl Persis Mockup Gambar 2) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Pengguna</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Status & Riwayat</th>
                    <th className="px-6 py-4">Hak Akses (Role)</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user) => {
                    const isSelf = user.id === session.user.id;
                    const reportCount = user._count?.reports ?? 0;
                    const verifiedCount = user._count?.verifiedTransactions ?? 0;
                    const hasHistory = reportCount > 0 || verifiedCount > 0;

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        {/* Kolom Pengguna */}
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt=""
                                className="h-10 w-10 rounded-full border border-slate-200 object-cover shrink-0"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e3824] text-white font-bold text-sm shrink-0">
                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                  {user.name || "Bapak Kosasih"}
                                </span>
                                {isSelf && (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/80">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 sm:hidden block truncate">
                                {user.email || "Tidak tertera"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kolom Email */}
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {user.email ? (
                            <span className="font-medium text-slate-700">{user.email}</span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">—</span>
                              <span className="italic text-[11px] text-slate-400">Tidak tertera</span>
                            </div>
                          )}
                        </td>

                        {/* Kolom Status & Riwayat */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-800">Aktif</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {hasHistory ? (
                                <span>
                                  {reportCount > 0 && `${reportCount} Laporan`}
                                  {reportCount > 0 && verifiedCount > 0 && " • "}
                                  {verifiedCount > 0 && `${verifiedCount} Verifikasi`}
                                </span>
                              ) : (
                                <span>Bergabung baru-baru ini</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Kolom Dropdown Role (Pill Cantik Persis Mockup) */}
                        <td className="px-6 py-4">
                          <div className="relative inline-block">
                            <select
                              className="inline-flex items-center cursor-pointer rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-colors hover:bg-slate-100 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 shadow-2xs"
                              value={user.role || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleRoleChange(user.id, val === "" ? null : val);
                              }}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? "Anda tidak dapat mengubah hak akses akun Anda sendiri"
                                  : "Pilih hak akses pengguna"
                              }
                            >
                              <option value="">Jamaah (Read-only)</option>
                              <option value="BENDAHARA">Bendahara (Upload)</option>
                              <option value="ADMIN">Administrator</option>
                            </select>
                          </div>
                        </td>

                        {/* Kolom Aksi */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end">
                            {isSelf ? (
                              <div
                                className="h-8 gap-1.5 px-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs font-medium text-slate-400 flex items-center"
                                title="Akun Anda yang sedang aktif digunakan (tidak dapat dihapus)"
                              >
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                <span>Akun Anda</span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogError(null);
                                }}
                                className={`h-8 gap-1.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                                  hasHistory
                                    ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                                    : "border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                }`}
                                title={
                                  hasHistory
                                    ? "Pengguna memiliki jejak audit (tidak dapat dihapus)"
                                    : "Hapus pengguna permanen"
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                <span>Hapus</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        <div className="mx-auto flex flex-col items-center justify-center">
                          <UserCog className="mb-2 h-8 w-8 text-slate-300" />
                          <p className="font-bold text-slate-700 text-sm">
                            Tidak ada pengguna ditemukan
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {searchQuery
                              ? `Tidak ada data pengguna yang cocok dengan "${searchQuery}".`
                              : "Belum ada pengguna terdaftar untuk filter ini."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Tabel: Menampilkan X dari Y & Kontrol Pagination */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-white border-t border-slate-100 text-xs text-slate-500">
              <span>
                Menampilkan {filteredUsers.length > 0 ? (page - 1) * pageSize + 1 : 0}-
                {Math.min(page * pageSize, filteredUsers.length)} dari {filteredUsers.length} pengguna
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Halaman sebelumnya"
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                      page === p
                        ? "bg-[#0e3824] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Halaman selanjutnya"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Dialog Konfirmasi Hapus / Peringatan Proteksi Jejak Audit */}
      <AlertDialog
        open={!!selectedUser}
        onOpenChange={(val) => {
          if (!isDeleting && !val) {
            setSelectedUser(null);
            setDialogError(null);
          }
        }}
      >
        <AlertDialogPopup>
          {hasAuditHistory ? (
            // Kasus 1: Pengguna memiliki riwayat audit laporan/verifikasi -> Proteksi Ketat
            <>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Lock className="size-5" />
                  </div>
                  <div>
                    <AlertDialogTitle>
                      Pengguna Memiliki Riwayat Audit
                    </AlertDialogTitle>
                    <span className="text-xs text-muted-foreground">
                      Proteksi Integritas Data
                    </span>
                  </div>
                </div>
                <AlertDialogDescription className="pt-2 text-sm leading-relaxed text-foreground/80">
                  Pengguna <strong>{selectedUser?.name || selectedUser?.email}</strong> memiliki riwayat{" "}
                  <strong>{selectedUser?._count?.reports ?? 0} unggahan laporan</strong> dan{" "}
                  <strong>
                    {selectedUser?._count?.verifiedTransactions ?? 0} transaksi terverifikasi
                  </strong>.
                  <br />
                  <br />
                  Demi menjaga <strong>keaslian jejak audit kas masjid</strong>, pengguna
                  yang memiliki riwayat data <strong>tidak dapat dihapus</strong>.
                  <br />
                  <br />
                  Jika Anda ingin mencabut akses pengurus ini, silakan ubah Hak Akses (Role)-nya menjadi{" "}
                  <strong>Jamaah (Read-only)</strong> melalui dropdown pada tabel.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Tutup
                </Button>
              </AlertDialogFooter>
            </>
          ) : (
            // Kasus 2: Pengguna bersih tanpa riwayat data -> Konfirmasi Hapus
            <>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Trash2 className="size-5" />
                  </div>
                  <div>
                    <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
                    <span className="text-xs text-muted-foreground">
                      Tindakan permanen
                    </span>
                  </div>
                </div>
                <AlertDialogDescription className="pt-2 text-sm leading-relaxed text-foreground/80">
                  Apakah Anda yakin ingin menghapus akun{" "}
                  <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                  <br />
                  Pengguna ini tidak memiliki riwayat laporan ataupun verifikasi kas,
                  sehingga aman untuk dihapus secara permanen dari sistem.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {dialogError && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{dialogError}</span>
                </div>
              )}

              <AlertDialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setSelectedUser(null)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDeleteUser}
                  className="gap-1.5"
                >
                  {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Pengguna"}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogPopup>
      </AlertDialog>
      </PageShell>
    </AppShell>
  );
}
