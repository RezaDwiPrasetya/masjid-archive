"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useSession } from "next-auth/react";
import { ShieldAlert, UserCog } from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null;
};

export default function PenggunaPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/users")
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => {
          setUsers(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const handleRoleChange = async (userId: string, newRole: string | null) => {
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
    } catch (error) {
      alert("Terjadi kesalahan saat mengubah hak akses.");
      // Revert in real app
    }
  };

  if (status === "loading" || loading) {
    return (
      <AppShell active="/pengguna">
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Memuat...</div>
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
              Halaman ini khusus untuk Administrator.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="/pengguna">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Kelola Pengguna</h1>
        <p className="text-muted-foreground mt-2">
          Atur hak akses pengguna untuk sistem Masjid Archive.
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Pengguna</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium text-right">Hak Akses (Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="bg-card hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-8 h-8 rounded-full border border-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                        <UserCog className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    {user.name || "Anonim"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4 text-right">
                    <select
                      className="bg-background border border-input text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary inline-block p-2 outline-none cursor-pointer"
                      value={user.role || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleRoleChange(user.id, val === "" ? null : val);
                      }}
                      disabled={user.id === session.user.id} 
                    >
                      <option value="">Jamaah (Read-only)</option>
                      <option value="BENDAHARA">Bendahara (Upload)</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada pengguna terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
