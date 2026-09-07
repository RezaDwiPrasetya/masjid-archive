"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Terjadi kesalahan");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold">Masjid Archive</h1>
        <p className="mb-6 text-sm text-gray-500">
          Sistem Arsip Digital DKM Masjid Al-Luqman
        </p>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Kata Sandi</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </Button>

        <p className="mt-4 text-center text-xs text-gray-400">
          Hubungi Bendahara jika lupa kata sandi
        </p>
      </form>
    </div>
  );
}