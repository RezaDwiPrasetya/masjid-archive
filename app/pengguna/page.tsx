"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
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

  if (status === "loading" || loading) {
    return (
      <AppShell active="/pengguna">
        <div className="flex h-[50vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Memuat data pengguna...</span>
        </div>
      </AppShell>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <AppShell active="/pengguna">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">Akses Ditolak</h1>
            <p className="text-sm text-muted-foreground">
              Halaman ini khusus untuk Administrator sistem.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const hasAuditHistory =
    selectedUser &&
    (((selectedUser._count?.reports ?? 0) > 0) ||
      ((selectedUser._count?.verifiedTransactions ?? 0) > 0));

  return (
    <AppShell active="/pengguna">
      <div className="space-y-6 pb-12">
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Kelola Pengguna
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Atur hak akses, pencarian, dan manajemen akun pengguna Masjid Archive.
          </p>
        </div>

        {/* Feedback Alert Banner */}
        {alertFeedback && (
          <div
            className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm transition-all ${
              alertFeedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {alertFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{alertFeedback.message}</span>
            </div>
            <button
              onClick={() => setAlertFeedback(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Statistik Kartu Ringkas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Pengguna
              </span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {stats.total}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Administrator
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {stats.admin}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Bendahara
              </span>
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {stats.bendahara}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Jamaah
              </span>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {stats.jamaah}
            </p>
          </div>
        </div>

        {/* Toolbar Pencarian dan Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama atau email pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Semua Role ({users.length})</option>
              <option value="ADMIN">Administrator ({stats.admin})</option>
              <option value="BENDAHARA">Bendahara ({stats.bendahara})</option>
              <option value="JAMAAH">Jamaah ({stats.jamaah})</option>
            </select>
          </div>
        </div>

        {/* Tabel Daftar Pengguna */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Pengguna</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Status & Riwayat</th>
                  <th className="px-6 py-3.5">Hak Akses (Role)</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const isSelf = user.id === session.user.id;
                  const reportCount = user._count?.reports ?? 0;
                  const verifiedCount = user._count?.verifiedTransactions ?? 0;
                  const hasHistory = reportCount > 0 || verifiedCount > 0;

                  return (
                    <tr
                      key={user.id}
                      className="bg-card transition-colors hover:bg-muted/30"
                    >
                      {/* Kolom Pengguna */}
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt=""
                              className="h-9 w-9 rounded-full border border-border object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary/10">
                              <UserCog className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{user.name || "Anonim"}</span>
                              {isSelf && (
                                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground sm:hidden">
                              {user.email || "Tanpa email"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Email */}
                      <td className="px-6 py-4 text-muted-foreground">
                        {user.email || (
                          <span className="italic text-muted-foreground/60">
                            Tidak tertera
                          </span>
                        )}
                      </td>

                      {/* Kolom Status & Riwayat Audit */}
                      <td className="px-6 py-4">
                        {hasHistory ? (
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-800 dark:text-amber-300">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {reportCount > 0 && `${reportCount} Laporan`}
                              {reportCount > 0 && verifiedCount > 0 && " • "}
                              {verifiedCount > 0 && `${verifiedCount} Verifikasi`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/80">
                            Belum ada riwayat
                          </span>
                        )}
                      </td>

                      {/* Kolom Dropdown Role */}
                      <td className="px-6 py-4">
                        <select
                          className="inline-block cursor-pointer rounded-lg border border-input bg-background p-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
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
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end">
                          {isSelf ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="h-8 gap-1.5 border-dashed border-border/80 bg-muted/30 px-3 text-xs text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-100"
                              title="Akun Anda yang sedang aktif digunakan (tidak dapat dihapus)"
                            >
                              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                              <span>Akun Anda</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setDialogError(null);
                              }}
                              className={`h-8 gap-1.5 px-3 text-xs transition-colors ${
                                hasHistory
                                  ? "border-border/80 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                                  : "border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
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
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      <div className="mx-auto flex flex-col items-center justify-center">
                        <UserCog className="mb-2 h-8 w-8 text-muted-foreground/50" />
                        <p className="font-medium text-foreground">
                          Tidak ada pengguna ditemukan
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
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
    </AppShell>
  );
}
